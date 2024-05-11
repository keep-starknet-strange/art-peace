#[starknet::contract]
pub mod NFTMintQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::nfts::interfaces::{ICanvasNFTStoreDispatcher, ICanvasNFTStoreDispatcherTrait};
    use art_peace::quests::IQuest;

    #[storage]
    struct Storage {
        canvas_nft: ContractAddress,
        art_peace: ContractAddress,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[derive(Drop, Serde)]
    pub struct NFTMintQuestInitParams {
        pub canvas_nft: ContractAddress,
        pub art_peace: ContractAddress,
        pub reward: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: NFTMintQuestInitParams) {
        self.canvas_nft.write(init_params.canvas_nft);
        self.art_peace.write(init_params.art_peace);
        self.reward.write(init_params.reward);
    }

    #[abi(embed_v0)]
    impl NFTMintQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let token_id_felt = *calldata.at(0);
            let token_id: u256 = token_id_felt.into();

            let nft_store = ICanvasNFTStoreDispatcher { contract_address: self.canvas_nft.read() };
            let token_minter = nft_store.get_nft_minter(token_id);

            if token_minter != user {
                return false;
            }

            return true;
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            assert(get_caller_address() == self.art_peace.read(), 'Only ArtPeace can claim quests');

            assert(self.is_claimable(user, calldata), 'Quest not claimable');

            self.claimed.write(user, true);
            let reward = self.reward.read();

            reward
        }
    }
}
