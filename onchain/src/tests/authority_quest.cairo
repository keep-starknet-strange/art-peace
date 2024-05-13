use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::authority_quest::AuthorityQuest::AuthorityQuestInitParams;
use art_peace::quests::interfaces::{IAuthorityQuestDispatcher, IAuthorityQuestDispatcherTrait};
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, get_contract_address, contract_address_const};

fn deploy_authority_quest_main() -> ContractAddress {
    let authority_quest = snf::declare("AuthorityQuest");
    let mut authority_calldata = array![];
    AuthorityQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(), authority: get_contract_address(), reward: 20,
    }
        .serialize(ref authority_calldata);
    let main_authority_quest = authority_quest.deploy(@authority_calldata).unwrap();

    main_authority_quest
}

#[test]
fn deploy_authority_quest_main_test() {
    let main_authority_quest = deploy_authority_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_authority_quest].span()
        )
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![main_authority_quest].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn authority_quest_test() {
    let main_authority_quest = deploy_authority_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_authority_quest].span()
        )
    };

    let main_authority_quest = IAuthorityQuestDispatcher { contract_address: main_authority_quest };

    let calldata: Span<felt252> = array![
        utils::PLAYER1().try_into().unwrap(), utils::PLAYER2().try_into().unwrap()
    ]
        .span();
    main_authority_quest.mark_claimable(calldata);

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER1()
    );
    art_peace.claim_main_quest(0, calldata);

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after main quest claim"
    );

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER2()
    );
    art_peace.claim_main_quest(0, calldata);

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after main quest claim"
    );
}

#[test]
#[should_panic(expected: ('Quest not claimable',))]
fn authority_quest_double_claim_test() {
    let main_authority_quest = deploy_authority_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_authority_quest].span()
        )
    };

    let main_authority_quest = IAuthorityQuestDispatcher { contract_address: main_authority_quest };

    let calldata: Span<felt252> = array![utils::PLAYER1().try_into().unwrap()].span();
    main_authority_quest.mark_claimable(calldata);

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER1()
    );
    art_peace.claim_main_quest(0, calldata);

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after main quest claim"
    );

    art_peace.claim_main_quest(0, calldata);
}

#[test]
#[should_panic(expected: ('Quest not claimable',))]
fn authority_quest_claim_if_not_claimable_test() {
    let main_authority_quest = deploy_authority_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_authority_quest].span()
        )
    };

    let calldata: Span<felt252> = array![utils::PLAYER1().try_into().unwrap()].span();

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER1()
    );

    art_peace.claim_main_quest(0, calldata);
}
