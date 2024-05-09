use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::template_quest::TemplateQuest::TemplateQuestInitParams;
use art_peace::templates::interfaces::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, TemplateMetadata
};
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, contract_address_const};

const reward_amt: u32 = 18;

fn deploy_template_quest() -> ContractAddress {
    let contract = snf::declare("TemplateQuest");

    let mut template_calldata = array![];
    TemplateQuestInitParams { art_peace: utils::ART_PEACE_CONTRACT(), reward: reward_amt, }
        .serialize(ref template_calldata);

    contract.deploy(@template_calldata).unwrap()
}

#[test]
fn deploy_template_quest_test() {
    let template_quest = deploy_template_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![template_quest].span()
        )
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![template_quest].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn template_quest_test() {
    let template_quest = deploy_template_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![template_quest].span()
        )
    };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };

    let template_metadata = TemplateMetadata {
        name: 'test',
        hash: 0,
        position: 0,
        width: 2,
        height: 2,
        reward: 0,
        reward_token: contract_address_const::<0>(),
        creator: utils::PLAYER1()
    };
    template_store.add_template(template_metadata);

    let calldata: Array<felt252> = array![0];
    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());
    art_peace.claim_main_quest(0, calldata.span());
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));

    assert!(
        art_peace.get_user_extra_pixels_count(utils::PLAYER1()) == reward_amt,
        "Extra pixels are wrong after main quest claim"
    );
}


#[test]
#[should_panic(expected: 'Quest not claimable')]
fn template_quest_claim_not_creator_test() {
    let template_quest = deploy_template_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![template_quest].span()
        )
    };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };

    let template_metadata = TemplateMetadata {
        name: 'test',
        hash: 0,
        position: 0,
        width: 2,
        height: 2,
        reward: 0,
        reward_token: contract_address_const::<0>(),
        creator: utils::PLAYER2()
    };
    template_store.add_template(template_metadata);

    let calldata: Array<felt252> = array![0];
    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    art_peace.claim_main_quest(0, calldata.span());
}

#[test]
#[should_panic(expected: 'Quest not claimable')]
fn template_quest_claim_no_template_added_test() {
    let template_quest = deploy_template_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![template_quest].span()
        )
    };

    let calldata: Array<felt252> = array![0];
    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    art_peace.claim_main_quest(0, calldata.span());
}
