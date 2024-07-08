use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct FactionTemplateMetadata {
    pub faction_id: u32,
    pub hash: felt252,
    pub position: u128,
    pub width: u128,
    pub height: u128,
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct TemplateMetadata {
    pub hash: felt252,
    pub name: felt252,
    pub position: u128,
    pub width: u128,
    pub height: u128,
    pub reward: u256,
    pub reward_token: ContractAddress,
    pub creator: ContractAddress
}

#[starknet::interface]
pub trait ITemplateStore<TContractState> {
    // Returns the number of templates stored in the contract state.
    fn get_templates_count(self: @TContractState) -> u32;
    // Returns the template metadata stored in the contract state.
    fn get_template(self: @TContractState, template_id: u32) -> TemplateMetadata;
    // Returns the template image hash stored in the contract state.
    fn get_template_hash(self: @TContractState, template_id: u32) -> felt252;
    // Stores a new template image into the contract state w/ metadata.
    // If the reward/token are set, then the contract escrows the reward for the template.
    fn add_template(ref self: TContractState, template_metadata: TemplateMetadata);
    // Returns whether the template is complete.
    fn is_template_complete(self: @TContractState, template_id: u32) -> bool;
}

#[starknet::interface]
pub trait ITemplateVerifier<TContractState> {
    // Verifies the template is complete, and if so, sets the template as complete.
    // If there was a reward escrowed, it is transferred to the builders.
    // Passed template_image contains the full image, and is used to verify the template.
    fn complete_template(ref self: TContractState, template_id: u32, template_image: Span<u8>);
    fn complete_template_with_rewards(
        ref self: TContractState, template_id: u32, template_image: Span<u8>
    );
    fn compute_template_hash(self: @TContractState, template: Span<u8>) -> felt252;
}
