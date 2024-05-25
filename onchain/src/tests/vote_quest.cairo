use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
use snforge_std::{declare, CheatTarget, ContractClassTrait};
use snforge_std as snf;
use art_peace::quests::vote_quest::VoteQuest::VoteQuestInitParams;
use art_peace::tests::utils;
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};

const reward: u32 = 99;
const day_index: u32 = 0;


fn deploy_vote_quest() -> ContractAddress {
    let contract = declare("VoteQuest");

    let mut vote_quest_calldata = array![];
    VoteQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(), day_index: day_index, reward: reward,
    }
        .serialize(ref vote_quest_calldata);

    contract.deploy(@vote_quest_calldata).unwrap()
}

#[test]
fn deploy_vote_quest_test() {
    let vote_quest = deploy_vote_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(array![].span(), array![vote_quest].span())
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![vote_quest].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn vote_quest_test() {
    let vote_quest_contract_address = deploy_vote_quest();
    let art_peace_dispatcher = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![vote_quest_contract_address].span()
        )
    };

    snf::start_prank(CheatTarget::One(art_peace_dispatcher.contract_address), utils::PLAYER1());

    // Set day index in storage
    snf::store(
        art_peace_dispatcher.contract_address,
        selector!("day_index"),
        array![day_index.into()].span()
    );
    // Player vote for a color
    art_peace_dispatcher.vote_color(1);
    // Player claim quest
    art_peace_dispatcher.claim_main_quest(0, utils::EMPTY_CALLDATA());

    snf::stop_prank(CheatTarget::One(art_peace_dispatcher.contract_address));

    assert!(
        art_peace_dispatcher.get_user_extra_pixels_count(utils::PLAYER1()) == reward,
        "Extra pixels are wrong after main quest claim"
    );
}
