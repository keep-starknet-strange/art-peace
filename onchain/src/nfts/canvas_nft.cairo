#[starknet::contract]
mod CanvasNFT {
    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::ContractAddress;
    use art_peace::nfts::component::CanvasNFTStoreComponent;
    use art_peace::nfts::component::CanvasNFTStoreComponent::CanvasNFTMinted;
    use art_peace::nfts::{ICanvasNFTAdditional, NFTMetadata};

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: CanvasNFTStoreComponent, storage: nfts, event: NFTEvent);

    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataImpl = ERC721Component::ERC721MetadataImpl<ContractState>;
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
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, name: ByteArray, symbol: ByteArray
    ) {
        let base_uri = "test"; // TODO: change to real base uri
        self.erc721.initializer(name, symbol, base_uri);
    }

    #[abi(embed_v0)]
    impl CanvasNFTAdditional of ICanvasNFTAdditional<ContractState> {
        fn set_canvas_contract(ref self: ContractState, canvas_contract: ContractAddress) {
            let zero_address = starknet::contract_address_const::<0>();
            assert(
                self.art_peace.read() == zero_address,
                'ArtPeace contract already set'
            );
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
    }
}
