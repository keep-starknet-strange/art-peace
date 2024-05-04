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
    dispatcher.claim_username('devsweet');

    dispatcher.change_username('devsweet');

    let username_address = dispatcher.get_username('devsweet');

    assert_eq!(username_address, contract_address, "Username not changed");
}
