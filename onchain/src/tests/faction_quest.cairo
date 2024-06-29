use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::faction_quest::FactionQuest::FactionQuestInitParams;
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;
use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait, declare};
use starknet::{ContractAddress, contract_address_const};


const reward_amt: u32 = 10;

fn deploy_faction_quest_main() -> ContractAddress {
    let contract = declare("FactionQuest");

    let mut hodl_quest_calldata = array![];
    FactionQuestInitParams { art_peace: utils::ART_PEACE_CONTRACT(), reward: reward_amt, }
        .serialize(ref hodl_quest_calldata);

    contract.deploy(@hodl_quest_calldata).unwrap()
}


#[test]
fn deploy_faction_quest_main_test() {
    let faction_quest = deploy_faction_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(array![].span(), array![faction_quest].span())
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![faction_quest].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn faction_quest_test() {
    let faction_quest_contract_address = deploy_faction_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![faction_quest_contract_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::HOST());
    art_peace.init_faction('TestFaction', utils::HOST(), true, 1);
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());
    art_peace.join_faction(1);

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == reward_amt,
        "Extra pixels are wrong after main quest claim"
    );
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));
}


#[test]
#[should_panic(expected: 'Quest not claimable')]
fn faction_quest_is_not_claimable_test() {
    let faction_quest_contract_address = deploy_faction_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![faction_quest_contract_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == reward_amt,
        "Extra pixels are wrong after main quest claim"
    );
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));
}

