#[starknet::contract]
mod CanvasNFT {
    use art_peace::nfts::interfaces::ICanvasNFTStore;
    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::token::erc721::interface::IERC721Metadata;
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::ContractAddress;
    use art_peace::nfts::component::CanvasNFTStoreComponent;
    use art_peace::nfts::component::CanvasNFTStoreComponent::CanvasNFTMinted;
    use art_peace::nfts::{ICanvasNFTAdditional, ICanvasNFTLikeAndUnlike, NFTMetadata};

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: CanvasNFTStoreComponent, storage: nfts, event: NFTEvent);

    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721CamelOnly = ERC721Component::ERC721CamelOnlyImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataCamelOnly =
        ERC721Component::ERC721MetadataCamelOnlyImpl<ContractState>;
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    #[abi(embed_v0)]
    impl CanvasNFTStoreImpl =
        CanvasNFTStoreComponent::CanvasNFTStoreImpl<ContractState>;

    impl InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        nfts: CanvasNFTStoreComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        NFTEvent: CanvasNFTStoreComponent::Event,
        NFTLiked: NFTLiked,
        NFTUnliked: NFTUnliked,
    }

    #[derive(Drop, starknet::Event)]
    struct NFTLiked {
        #[key]
        token_id: u256,
        #[key]
        user_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct NFTUnliked {
        #[key]
        token_id: u256,
        #[key]
        user_address: ContractAddress
    }


    #[constructor]
    fn constructor(
        ref self: ContractState, name: ByteArray, symbol: ByteArray, round_number: felt252
    ) {
        let base_uri = format!(
            "https://api.art-peace.net/nft/round-{}/metadata/nft-", round_number
        );
        self.erc721.initializer(name, symbol, base_uri);
    }

    #[abi(embed_v0)]
    impl ERC721Metadata of IERC721Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc721.ERC721_name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.ERC721_symbol.read()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            assert(self.erc721._exists(token_id), 'Token does not exist');
            let base_uri = self.erc721._base_uri();
            if base_uri.len() == 0 {
                return "";
            } else {
                return format!("{}{}.json", base_uri, token_id);
            }
        }
    }

    #[abi(embed_v0)]
    impl CanvasNFTAdditional of ICanvasNFTAdditional<ContractState> {
        fn set_canvas_contract(ref self: ContractState, canvas_contract: ContractAddress) {
            let zero_address = starknet::contract_address_const::<0>();
            assert(self.art_peace.read() == zero_address, 'ArtPeace contract already set');
            self.art_peace.write(canvas_contract);
        }

        fn mint(ref self: ContractState, metadata: NFTMetadata, receiver: ContractAddress) {
            assert(
                self.art_peace.read() == starknet::get_caller_address(),
                'Only ArtPeace contract can mint'
            );
            let token_id = self.nfts.get_nfts_count();
            self.nfts.nfts_data.write(token_id, metadata);
            self.erc721._mint(receiver, token_id);
            self.nfts.nfts_count.write(token_id + 1);
            self.nfts.emit(CanvasNFTMinted { token_id, metadata });
        }

        fn set_base_uri(ref self: ContractState, base_uri: ByteArray) {
            assert(
                self.art_peace.read() == starknet::get_caller_address(),
                'Only ArtPeace can set base uri'
            );
            self.erc721._set_base_uri(base_uri);
        }
    }

    #[abi(embed_v0)]
    impl CanvasNFTLikeAndUnlike of ICanvasNFTLikeAndUnlike<ContractState> {
        fn like_nft(ref self: ContractState, token_id: u256) {
            assert(token_id < self.get_nfts_count(), 'NFT Does not Exist in the Store');

            self
                .emit(
                    NFTLiked { user_address: starknet::get_caller_address(), token_id: token_id }
                );
        }

        fn unlike_nft(ref self: ContractState, token_id: u256) {
            assert(token_id < self.get_nfts_count(), 'NFT Does not Exist in the Store');
            self
                .emit(
                    NFTUnliked { user_address: starknet::get_caller_address(), token_id: token_id }
                );
        }
    }
}
