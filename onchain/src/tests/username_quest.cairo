use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::username_quest::UsernameQuest::UsernameQuestInitParams;
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};

use art_peace::username_store::interfaces::{
    IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait
};

use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;
use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
use snforge_std as snf;
use snforge_std::{declare, CheatTarget, ContractClassTrait};

const reward_amt: u32 = 25;
const username: felt252 = 'dealdesign';

fn deploy_username_store_contract() -> ContractAddress {
    let contract = snf::declare("UsernameStore");

    return contract.deploy(@ArrayTrait::new()).unwrap();
}

fn deploy_username_quest(username_store_address: ContractAddress) -> ContractAddress {
    let contract = declare("UsernameQuest");

    let mut username_quest_calldata = array![];
    UsernameQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: reward_amt,
        username_store: username_store_address
    }
        .serialize(ref username_quest_calldata);

    contract.deploy(@username_quest_calldata).unwrap()
}

#[test]
fn deploy_username_quest_test() {
    let username_store_address = deploy_username_store_contract();

    let username_quest_address = deploy_username_quest(username_store_address);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![username_quest_address].span()
        )
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![username_quest_address].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn username_quest_test() {
    let username_store_address = deploy_username_store_contract();
    let username_quest_address = deploy_username_quest(username_store_address);

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![username_quest_address].span()
        )
    };
    let username_store_dispatcher = IUsernameStoreDispatcher {
        contract_address: username_store_address
    };

    snf::start_prank(
        CheatTarget::Multiple(array![art_peace.contract_address, username_store_address]),
        utils::PLAYER1()
    );

    username_store_dispatcher.claim_username(username);
    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_user_extra_pixels_count(utils::PLAYER1()) == reward_amt,
        "Extra pixels incorrect after quest completion"
    );

    snf::stop_prank(
        CheatTarget::Multiple(array![art_peace.contract_address, username_store_address])
    );
}


#[test]
#[should_panic(expected: ('Quest not claimable',))]
fn test_username_quest_unclaimable() {
    let username_store_address = deploy_username_store_contract();
    let username_quest_address = deploy_username_quest(username_store_address);

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![username_quest_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());
    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));
}

#[test]
#[should_panic(expected: ('Quest not claimable',))]
fn test_username_quest_double_claim() {
    let username_store_address = deploy_username_store_contract();
    let username_quest_address = deploy_username_quest(username_store_address);

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![username_quest_address].span()
        )
    };
    let username_store_dispatcher = IUsernameStoreDispatcher {
        contract_address: username_store_address
    };

    snf::start_prank(
        CheatTarget::Multiple(array![art_peace.contract_address, username_store_address]),
        utils::PLAYER1()
    );

    username_store_dispatcher.claim_username(username);
    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    snf::stop_prank(
        CheatTarget::Multiple(array![art_peace.contract_address, username_store_address])
    );
}
