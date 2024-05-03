#[starknet::contract]
pub mod NFTMintQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::nfts::interfaces::{ICanvasNFTStore, NFTMetadata};
    use art_peace::nfts::interfaces::{ICanvasNFTStoreDispatcher, ICanvasNFTStoreDispatcherTrait};
    use art_peace::quests::{IQuest, QuestClaimed};

    #[storage]
    struct Storage {
        CanvasNFT: ContractAddress,
        art_peace: ContractAddress,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        QuestClaimed: QuestClaimed,
    }


    #[derive(Drop, Serde)]
    pub struct NFTMintQuestInitParams {
        pub CanvasNFT: ContractAddress,
        pub art_peace: ContractAddress,
        pub reward: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: NFTMintQuestInitParams) {
        self.CanvasNFT.write(init_params.CanvasNFT);
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
            // let token_id: u256 = token_id_felt.try_into().unwrap();
            let token_id: u256 = token_id_felt.into();

            let nft_store = ICanvasNFTStoreDispatcher { contract_address: self.CanvasNFT.read() };
            let token_miner = nft_store.get_nft_minter(token_id);

            if token_miner != user {
                return false;
            }

            return true;
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            if get_caller_address() != self.art_peace.read() {
                return 0;
            }

            if !self.is_claimable(user, calldata) {
                return 0;
            }

            self.claimed.write(user, true);
            let reward = self.reward.read();
            self.emit(QuestClaimed { user, reward, calldata });

            reward
        }
    }
}
