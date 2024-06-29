#[starknet::component]
pub mod CanvasNFTStoreComponent {
    use art_peace::nfts::interfaces::{ICanvasNFTStore, NFTMetadata};

    #[storage]
    struct Storage {
        nfts_count: u256,
        // Map: nft's token_id -> nft's metadata
        nfts_data: LegacyMap::<u256, NFTMetadata>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CanvasNFTMinted: CanvasNFTMinted,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CanvasNFTMinted {
        #[key]
        pub token_id: u256,
        pub metadata: NFTMetadata,
    }

    #[embeddable_as(CanvasNFTStoreImpl)]
    impl CanvasNFTStore<
        TContractState, +HasComponent<TContractState>
    > of ICanvasNFTStore<ComponentState<TContractState>> {
        fn get_nfts_count(self: @ComponentState<TContractState>) -> u256 {
            return self.nfts_count.read();
        }

        fn get_nft_metadata(self: @ComponentState<TContractState>, token_id: u256) -> NFTMetadata {
            return self.nfts_data.read(token_id);
        }

        fn get_nft_minter(
            self: @ComponentState<TContractState>, token_id: u256
        ) -> starknet::ContractAddress {
            let metadata: NFTMetadata = self.nfts_data.read(token_id);
            return metadata.minter;
        }

        fn get_nft_day_index(self: @ComponentState<TContractState>, token_id: u256) -> u32 {
            let metadata: NFTMetadata = self.nfts_data.read(token_id);
            return metadata.day_index;
        }

        fn get_nft_image_hash(self: @ComponentState<TContractState>, token_id: u256) -> felt252 {
            let metadata: NFTMetadata = self.nfts_data.read(token_id);
            return metadata.image_hash;
        }
    }
}
