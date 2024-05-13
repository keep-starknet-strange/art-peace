use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::rainbow_quest::RainbowQuest::RainbowQuestInitParams;
use art_peace::quests::interfaces::{IRainbowQuestDispatcher, IRainbowQuestDispatcherTrait};
use art_peace::tests::art_peace::{deploy_with_quests_contract, warp_to_next_available_time};
use art_peace::tests::utils;

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, contract_address_const};

fn deploy_rainbow_quest_main() -> ContractAddress {
    let rainbow_quest = snf::declare("RainbowQuest");
    let mut rainbow_calldate = array![];
    RainbowQuestInitParams { art_peace: utils::ART_PEACE_CONTRACT(), reward: 20, }
        .serialize(ref rainbow_calldate);
    let main_rainbow_quest = rainbow_quest.deploy(@rainbow_calldate).unwrap();

    main_rainbow_quest
}

#[test]
fn deploy_rainbow_quest_main_test() {
    let main_randow_quest = deploy_rainbow_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_randow_quest].span()
        )
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![main_randow_quest].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn rainbow_quest_test() {
    let main_rainbow_quest = deploy_rainbow_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_rainbow_quest].span()
        )
    };

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER1()
    );

    let mut i: u8 = 0;
    while i < art_peace
        .get_color_count() {
            art_peace.place_pixel_blocktime(i.into(), i);
            warp_to_next_available_time(art_peace);

            i += 1;
        };

    let calldata = array![].span();
    art_peace.claim_main_quest(0, calldata);

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after main quest claim"
    );
}

#[test]
#[should_panic(expected: 'Quest not claimable',)]
fn rainbow_quest_color_missing_test() {
    let main_rainbow_quest = deploy_rainbow_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_rainbow_quest].span()
        )
    };

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER1()
    );

    let mut i: u8 = 0;
    while i < art_peace.get_color_count()
        - 1 {
            art_peace.place_pixel_blocktime(i.into(), i);
            warp_to_next_available_time(art_peace);

            i += 1;
        };

    let calldata = array![].span();
    art_peace.claim_main_quest(0, calldata);
}
