use starknet::ContractAddress;

#[derive(Drop, starknet::Event)]
pub struct QuestClaimed {
    pub user: ContractAddress,
    pub reward: u32,
}

#[starknet::interface]
pub trait IQuest<TContractState> {
    // Return the reward for the quest.
    fn get_reward(self: @TContractState) -> u32;
    // Return if the user can claim the quest.
    fn is_claimable(self: @TContractState, user: ContractAddress) -> bool;
    // Claim the quest.
    fn claim(ref self: TContractState, user: ContractAddress) -> u32;
}
