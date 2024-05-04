use snforge_std::{declare, ContractClassTrait};
use art_peace::username_store::interfaces::{
    IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait
};
use starknet::{ContractAddress, get_caller_address, contract_address_const};

fn deploy_contract() -> ContractAddress {
    let contract = declare("UsernameStore");

    return contract.deploy(@ArrayTrait::new()).unwrap();
}

#[test]
fn test_claim_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('deal');
    
    let username_address = dispatcher.get_username('deal');

    assert!(contract_address != username_address, "Username not claimed");
}

#[test]
fn test_change_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };

    let initial_username = 'devsweet';
    dispatcher.claim_username(initial_username);
    let initial_username_address = dispatcher.get_username(initial_username);
    assert_eq!(initial_username_address, contract_address, "Initial username not claimed properly");

    let new_username = 'devcool';
    dispatcher.claim_username(new_username); // You must also claim the new username to ensure it's available for the test
    dispatcher.change_username(new_username);
    
    // Check new username is now linked to the contract address
    let new_username_address = dispatcher.get_username(new_username);
    assert_eq!(new_username_address, contract_address, "Username not changed correctly");

    // Ensure the old username is no longer linked
    let old_username_address = dispatcher.get_username(initial_username);
    assert_eq!(old_username_address, contract_address_const::<0>(), "Old username still linked");
}
