// - Check if user has voted for a new color
// - A daily quest
// - Take `dayIdx` and store 
// - Use `dayIdx` in `is_claimable`

#[starknet::contract]
pub mod VoteQuest {
    use art_peace::{quests::IQuest};
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};

    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        day_index: u32,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[derive(Drop, Serde)]
    pub struct VoteQuestInitParams {
        pub art_peace: ContractAddress,
        pub day_index: u32,
        pub reward: u32
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: VoteQuestInitParams) {
        self.art_peace.write(init_params.art_peace);
        self.day_index.write(init_params.day_index);
        self.reward.write(init_params.reward);
    }

    #[abi(embed_v0)]
    impl VoteQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let day_index = self.day_index.read();
            let art_peace_dispatcher = IArtPeaceDispatcher {
                contract_address: self.art_peace.read()
            };

            let user_vote: u8 = art_peace_dispatcher.get_user_vote(day_index);

            if user_vote == 0 {
                return false;
            } else {
                return true;
            }
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
