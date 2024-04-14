use username_store::UsernameStore;
use username_store::{IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait};
use username::UserNameClaimErrors;

use starknet::{ContractAddress};
use snforge_std::{declare, cheatcodes::contract_class::ContractClassTrait};


#[cfg(test)]
mod tests {

    // Import the deploy syscall to be able to deploy the contract.
    use starknet::{
        ContractAddress, get_caller_address, get_contract_address, contract_address_const
    };
    
    use starknet::syscalls::deploy_syscall;
    use starknet::{ContractAddress, contract_address_const};

     // Use starknet test utils to fake the transaction context.
    // use starknet::testing::{claim_username, transfer_username};

    // Deploy the contract and return its dispatcher.
    fn deploy_contract() -> ContractAddress {
        let contract = declare("UsernameStore");
        //  contract.deploy().unwrap();
        return contract.deploy(@ArrayTrait::new()).unwrap();
    }

  
   #[test]
    #[available_gas(2000000000)]
    fn check_claimed_username(){
        // deploy the contract
        let contract_address = deploy_contract();
        let dispatcher = IUsernameStoreDispatcher { contract_address };

        // call the claimed username
        let claim_username = dispatcher.claim_username('demo_name')
        
        let original_owner = contract_address_const::<0>();

        assert(contract_state.usernames.read('demo_name') == original_owner, Errors::NOT_EQUAL);

    }


    #[test]
    #[available_gas(2000000000)]
    fn test_transfer_username() {
        // deploy the contract
        let contract_address = deploy_contract();
        let dispatcher = IUsernameStoreDispatcher { contract_address };

        // call the claimed username
        let claim_username = dispatcher.claim_username('demo_name')

        // Fake the caller address to address 1
        let original_owner = contract_address_const::<0>();

        let new_owner = contract_address_const::<1>();

        dispatcher.transfer_usernames('demo_name', new_owner);

        
        assert(contract_state.usernames.read('demo_name') == new_owner, "Test case 1 failed: Username not transferred correctly");
    
  
    }


}