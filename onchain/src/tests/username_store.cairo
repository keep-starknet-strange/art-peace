use art_peace::tests::utils;
use art_peace::username_store::interfaces::{
    IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait
};

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, get_caller_address, contract_address_const};

fn deploy_contract() -> ContractAddress {
    let contract = snf::declare("UsernameStore");

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

#[test]
#[should_panic(expected: ('User already has a username',))]
fn test_cannot_claim_multiple_usernames() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };

    snf::start_prank(CheatTarget::One(contract_address), utils::PLAYER1());

    // Claim initial username
    let initial_username = 'devsweet';
    dispatcher.claim_username(initial_username);

    // Attempt to claim another username
    let new_username = 'devcool';
    dispatcher.claim_username(new_username);
}

#[test]
#[should_panic(expected: ('User does not have a username',))]
fn test_cannot_change_with_no_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };

    snf::start_prank(CheatTarget::One(contract_address), utils::PLAYER1());

    let username = 'devsweet';
    dispatcher.change_username(username);
}

#[test]
#[should_panic(expected: 'Username already claimed')]
fn test_claim_same_username_twice() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('devsweet');

    snf::start_prank(CheatTarget::One(contract_address), utils::PLAYER1());

    dispatcher.claim_username('devsweet');
}
