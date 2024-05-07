use art_peace::username_store::interfaces::{
    IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait
};
use art_peace::tests::utils;
use starknet::{ContractAddress, get_caller_address, contract_address_const};
use snforge_std as snf;
use snforge_std::{declare, CheatTarget, ContractClassTrait};

fn deploy_contract() -> ContractAddress {
    let contract = declare("UsernameStore");

    return contract.deploy(@ArrayTrait::new()).unwrap();
}

#[test]
fn test_claim_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };

    snf::start_prank(CheatTarget::One(contract_address), utils::PLAYER1());
    dispatcher.claim_username('deal');

    let username_address = dispatcher.get_username_address('deal');
    assert!(username_address == utils::PLAYER1(), "User didn't claim name");
    let username = dispatcher.get_username(utils::PLAYER1());
    assert!(username == 'deal', "Username not claimed");
    snf::stop_prank(CheatTarget::One(contract_address));
}

#[test]
fn test_change_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };

    snf::start_prank(CheatTarget::One(contract_address), utils::PLAYER1());

    // Set initial username
    let username = 'devsweet';
    dispatcher.claim_username(username);
    let initial_username = dispatcher.get_username(utils::PLAYER1());
    assert!(initial_username == username, "Initial username not set");

    // Change username
    let new_username = 'devcool';
    dispatcher.change_username(new_username);

    let new_username_address = dispatcher.get_username_address(new_username);
    assert!(new_username_address == utils::PLAYER1(), "New username not linked");
    let new_username = dispatcher.get_username(utils::PLAYER1());
    assert!(new_username == new_username, "New username not set");

    let old_username_address = dispatcher.get_username_address(initial_username);
    assert!(old_username_address == contract_address_const::<0>(), "Old username not unlinked");
}
