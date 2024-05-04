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

    //let simulated_caller_address = contract_address;

    // Claim initial username
    let initial_username = 'devsweet';
    dispatcher.claim_username(initial_username);

    // Verify initial claim
    let initial_username_address = dispatcher.get_username(initial_username);

    //assert_eq!(initial_username_address, simulated_caller_address, "Initial username not claimed properly");

    // Claim a new username for changing
    let new_username = 'devcool';
    dispatcher.claim_username(new_username);

    // Change to a new, different username
    dispatcher.change_username(new_username);
    
    // Verify new username association
    let new_username_address = dispatcher.get_username(new_username);
    assert_eq!(new_username_address, initial_username_address, "Username not changed correctly");

    // Ensure the old username is no longer linked
    let old_username_address = dispatcher.get_username(initial_username);
    assert_ne!(old_username_address, new_username_address, "Old username still linked");
}