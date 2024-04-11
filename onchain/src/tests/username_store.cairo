use username_store::UsernameStore;
use username_store::{IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait};
use username::UserNameClaimErrors;



#[cfg(test)]
mod tests {

    // Import the deploy syscall to be able to deploy the contract.
    use starknet::{
        ContractAddress, get_caller_address, get_contract_address, contract_address_const
    };
    
    use starknet::syscalls::deploy_syscall;
    use starknet::{ContractAddress, contract_address_const};

     // Use starknet test utils to fake the transaction context.
    use starknet::testing::{claim_username, transfer_username};

    fn USERNAME_STORE_CONTRACT() -> ContractAddress {
    contract_address_const::<'UsernameStores'>()
}

       // Deploy the contract and return its dispatcher.
    fn deploy() -> ContractAddress {
        // Set up constructor arguments.
        let contract = snf::declare('UsernameStores');


        let contract_addr = contract.deploy_at(@calldata, USERNAME_STORE_CONTRACT()).unwrap();

        contract_addr
    }


    #[test]
    #[available_gas(2000000000)]
    fn test_claimUsername() {

        // Fake the caller address to address 1
        let owner = contract_address_const::<1>();
        claim_username(owner, 'demo_name');

        let contract = deploy(10);
         assert(contract_state.username.read('transfer_username(&contract_state, "demo_name", new_address)') == get_caller_address(), 'Test case 1 failed: Username not claimed correctly');

       
         assert(core::panic_with_felt252(UserNameClaimErrors::USERNAME_CLAIMED), 'Test case 2 failed: Username claimed erroneously');
   
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_transfer_username() {

        // Fake the caller address to address 1
        let original_owner = contract_address_const::<1>();
        let new_owner = contract_address_const::<2>();

        transfer_username(&contract_state, 'demo_name', new_address);

        let contract = deploy(10);
        assert(contract_state.username.read('demo_name') == new_owner, "Test case 1 failed: Username not transferred correctly");
    
        assert(contract_state.username.read('demo_name') == original_owner, "Test case 1 failed: Username not transferred correctly");
    
  
    }


}