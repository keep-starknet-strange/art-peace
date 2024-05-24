// - Check if user has voted for a new color
// - A daily quest
// - Take `dayIdx` and store 
// - Use `dayIdx` in `is_claimable`

#[starknet::contract]
pub mod VoteQuest {
    use art_peace::{quests::IQuest};
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        claim_day: u32,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, art_peace: ContractAddress, claim_day: u32, reward: u32
    ) {
        self.art_peace.write(art_peace);
        self.claim_day.write(claim_day);
        self.reward.write(reward);
    }

    #[abi(embed_v0)]
    impl VoteQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            true
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
