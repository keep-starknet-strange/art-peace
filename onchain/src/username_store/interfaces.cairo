use starknet::ContractAddress;

#[starknet::interface]
pub trait IUsernameStore<TContractState> {
    fn claim_username(ref self: TContractState, key: felt252);
    fn transfer_username(ref self: TContractState, key: felt252, new_Address: ContractAddress);
    fn get_username(ref self: TContractState, key: felt252) -> ContractAddress;
}
