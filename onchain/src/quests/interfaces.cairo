use starknet::ContractAddress;

#[starknet::interface]
pub trait IQuest<TContractState> {
    // Return the reward for the quest.
    fn get_reward(self: @TContractState) -> u32;
    // Return if the user can claim the quest.
    fn is_claimable(self: @TContractState, user: ContractAddress, calldata: Span<felt252>) -> bool;
    // Claim the quest.
    fn claim(ref self: TContractState, user: ContractAddress, calldata: Span<felt252>) -> u32;
}

#[starknet::interface]
pub trait IAuthorityQuest<TContractState> {
    fn is_claimed(self: @TContractState, user: ContractAddress) -> bool;
    fn mark_claimable(ref self: TContractState, calldata: Span<felt252>);
}

#[starknet::interface]
pub trait IPixelQuest<TContractState> {
    fn is_claimed(self: @TContractState, user: starknet::ContractAddress) -> bool;
    fn get_pixels_needed(self: @TContractState) -> u32;
    fn is_daily(self: @TContractState) -> bool;
    fn claim_day(self: @TContractState) -> u32;
    fn is_color(self: @TContractState) -> bool;
    fn color(self: @TContractState) -> u8;
}

#[starknet::interface]
pub trait IRainbowQuest<TContractState> {
    fn is_claimed(self: @TContractState, user: starknet::ContractAddress) -> bool;
}


#[starknet::interface]
pub trait IFactionQuest<TContractState> {
    fn is_claimed(self: @TContractState, user: starknet::ContractAddress) -> bool;
}

#[starknet::interface]
pub trait IUnruggableQuest<TContractState> {
    fn is_claimed(self: @TContractState, user: starknet::ContractAddress) -> bool;
}

#[starknet::interface]
pub trait IUnruggableMemecoin<TState> {
    // Returns the owner of the unruggable memecoin
    fn owner(self: @TState) -> ContractAddress;
    // Checks whether token has launched
    fn is_launched(self: @TState) -> bool;
}
