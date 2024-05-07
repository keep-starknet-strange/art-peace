#[starknet::contract]
pub mod HodlQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::quests::{IQuest, QuestClaimed};

    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        reward: u32,
        extra_pixel: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        QuestClaimed: QuestClaimed,
    }


    #[derive(Drop, Serde)]
    pub struct HodlQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
        pub extra_pixel: u32
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: HodlQuestInitParams) {
        self.art_peace.write(init_params.art_peace);
        self.reward.write(init_params.reward);
        self.extra_pixel.write(init_params.extra_pixel);
    }

    #[abi(embed_v0)]
    impl HodlQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let art_peace_main = IArtPeaceDispatcher { contract_address: self.art_peace.read() };

            let get_extra_pixels_count = art_peace_main.get_user_extra_pixels_count(get_caller_address());

            if get_extra_pixels_count != self.extra_pixel.read() {
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
