use art_peace::tests::utils;
use art_peace::username_store::interfaces::{
    IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait
};

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, contract_address_const};

fn deploy_contract() -> ContractAddress {
    let contract = snf::declare("UsernameStore");

    return contract.deploy(@ArrayTrait::new()).unwrap();
}

#[test]
fn test_claim_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('deal');

    let username_address = dispatcher.get_username_address('deal');

    assert(username_address != contract_address_const::<0>(), 'Username not claimed');
}

#[test]
#[should_panic(expected: 'username_claimed')]
fn test_claim_same_username_twice() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('deal');
    dispatcher.claim_username('deal');
}

#[test]
fn test_transfer_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('devsweet');

    let second_contract_address = contract_address_const::<1>();

    dispatcher.transfer_username('devsweet', second_contract_address);

    let username_address = dispatcher.get_username_address('devsweet');

    assert(username_address == second_contract_address, 'Username not Transferred');
}

#[test]
#[should_panic(expected: 'username_cannot_be_transferred')]
fn test_transfer_not_owner_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('devsweet');

    let second_contract_address = contract_address_const::<1>();

    snf::start_prank(
        target: CheatTarget::One(dispatcher.contract_address), caller_address: utils::PLAYER1()
    );

    dispatcher.transfer_username('devsweet', second_contract_address);
}

