use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::hodl_quest::HodlQuest::HodlQuestInitParams;
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};

use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;
use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
use snforge_std as snf;
use snforge_std::{declare, CheatTarget, ContractClassTrait};

const reward_amt: u32 = 10;
const extra_pixels_needed: u32 = 15;


fn deploy_hodl_quest() -> ContractAddress {
    let contract = declare("HodlQuest");

    let mut hodl_quest_calldata = array![];
    HodlQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: reward_amt,
        extra_pixels_needed: extra_pixels_needed,
    }
        .serialize(ref hodl_quest_calldata);

    contract.deploy(@hodl_quest_calldata).unwrap()
}


#[test]
fn deploy_hodl_quest_test() {
    let hodl_quest = deploy_hodl_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(array![].span(), array![hodl_quest].span())
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![hodl_quest].span(),
        "Main quests were not set correctly"
    );
}


#[test]
fn hodl_quest_test() {
    let hodl_quest_contract_address = deploy_hodl_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![hodl_quest_contract_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    snf::store(
        art_peace.contract_address,
        snf::map_entry_address(selector!("extra_pixels"), array![(utils::PLAYER1()).into()].span()),
        array![extra_pixels_needed.into()].span()
    );

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == reward_amt + extra_pixels_needed,
        "Extra pixels are wrong after main quest claim"
    );
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));
}

#[test]
#[should_panic(expected: 'Quest not claimable')]
fn hodl_quest_incorrect_claim_test() {
    let hodl_quest_contract_address = deploy_hodl_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![hodl_quest_contract_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
}

#[test]
#[should_panic(expected: 'Quest not claimable')]
fn hodl_quest_double_claim_test() {
    let hodl_quest_contract_address = deploy_hodl_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![hodl_quest_contract_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    snf::store(
        art_peace.contract_address,
        snf::map_entry_address(selector!("extra_pixels"), array![(utils::PLAYER1()).into()].span()),
        array![extra_pixels_needed.into()].span()
    );

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == reward_amt + extra_pixels_needed,
        "Extra pixels are wrong after main quest claim"
    );

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
}
