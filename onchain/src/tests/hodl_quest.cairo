use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::hodl_quest::HodlQuest::HodlQuestInitParams;
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};

use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;
use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
use snforge_std as snf;
use snforge_std::{declare, CheatTarget, ContractClassTrait};

const reward_amt: u32 = 18;
const user_extra_pixel: u32 = 18;


fn deploy_hodl_quest() -> ContractAddress {
    let contract = declare("HodlQuest");

    let mut hodl_quest_calldata = array![];
    HodlQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(), reward: reward_amt, extra_pixel: user_extra_pixel,
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

    let calldata: Array<felt252> = array![];
    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    snf::store(hodl_quest_contract_address, selector!("user_extra_pixel"), array![user_extra_pixel.into()].span(),);

   // art_peace.claim_main_quest(0, calldata.span());

    assert!(
        art_peace.get_extra_pixels_count() == reward_amt,
        "Extra pixels are wrong after main quest claim"
    );
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));
}
