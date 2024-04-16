use art_peace::username_store::IUsernameStoreDispatcherTrait;


use snforge_std::{declare, ContractClassTrait};


use art_peace::username_store::IUsernameStoreDispatcher;

use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};



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
    
    assert(contract_address != username_address, 'Username not claimed');

}
#[test]
fn test_transfer_username() {
    let contract_address = deploy_contract();
    let dispatcher = IUsernameStoreDispatcher { contract_address };
    dispatcher.claim_username('devsweet');

    let second_contract_address = contract_address_const::<1>();

    dispatcher.transfer_username('devsweet', second_contract_address);

    let username_address = dispatcher.get_username('devsweet');

    assert( username_address == second_contract_address, 'Username not Transferred');

}