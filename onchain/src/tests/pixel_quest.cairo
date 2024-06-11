use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::pixel_quest::PixelQuest::PixelQuestInitParams;
use art_peace::tests::art_peace::{warp_to_next_available_time, deploy_with_quests_contract};
use art_peace::tests::utils;

use snforge_std as snf;
use snforge_std::ContractClassTrait;

use starknet::ContractAddress;

const WIDTH: u128 = 100;

fn deploy_pixel_quests_daily(pixel_quest: snf::ContractClass) -> Array<ContractAddress> {
    let mut daily_pixel_calldata = array![];
    PixelQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: 10,
        pixels_needed: 3,
        is_daily: true,
        claim_day: 0,
        is_color: false,
        color: 0,
    }
        .serialize(ref daily_pixel_calldata);
    let daily_pixel_quest = pixel_quest.deploy(@daily_pixel_calldata).unwrap();

    let mut daily_color_calldata = array![];
    PixelQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: 10,
        pixels_needed: 3,
        is_daily: true,
        claim_day: 0,
        is_color: true,
        color: 0x1,
    }
        .serialize(ref daily_color_calldata);
    let daily_color_quest = pixel_quest.deploy(@daily_color_calldata).unwrap();

    array![daily_pixel_quest, daily_color_quest, utils::EMPTY_QUEST_CONTRACT()]
}

fn deploy_pixel_quests_main(pixel_quest: snf::ContractClass) -> Array<ContractAddress> {
    let mut main_pixel_calldata = array![];
    PixelQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: 20,
        pixels_needed: 4,
        is_daily: false,
        claim_day: 0,
        is_color: false,
        color: 0,
    }
        .serialize(ref main_pixel_calldata);
    let main_pixel_quest = pixel_quest.deploy(@main_pixel_calldata).unwrap();

    let mut main_color_calldata = array![];
    PixelQuestInitParams {
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: 20,
        pixels_needed: 4,
        is_daily: false,
        claim_day: 0,
        is_color: true,
        color: 0x1,
    }
        .serialize(ref main_color_calldata);
    let main_color_quest = pixel_quest.deploy(@main_color_calldata).unwrap();

    array![main_pixel_quest, main_color_quest]
}

#[test]
fn deploy_pixel_quest_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    assert!(
        art_peace.get_days_quests(0) == daily_quests.span(), "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == main_quests.span(), "Main quests were not set correctly"
    );
}

#[test]
fn pixel_quests_daily_no_color_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x0;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_today_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == 10, "Extra pixels are wrong after daily color claim"
    );
}

#[test]
fn pixel_quests_daily_color_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x1;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_today_quest(1, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == 10, "Extra pixels are wrong after daily color claim"
    );
}

#[test]
fn pixel_quests_main_no_color_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x0;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after daily color claim"
    );
}

#[test]
fn pixel_quests_main_color_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x1;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_main_quest(1, utils::EMPTY_CALLDATA());

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after daily color claim"
    );
}

#[test]
#[should_panic(expected: 'Quest not claimable',)]
fn pixel_quests_daily_no_color_double_invalid_claim_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x0;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_today_quest(0, utils::EMPTY_CALLDATA());
    art_peace.claim_today_quest(0, utils::EMPTY_CALLDATA());
}

#[test]
#[should_panic(expected: 'Quest not claimable',)]
fn pixel_quests_daily_no_color_claim_if_not_claimable_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x0;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_today_quest(0, utils::EMPTY_CALLDATA());
}

#[test]
#[should_panic(expected: 'Quest not claimable',)]
fn pixel_quests_main_no_color_double_invalid_claim_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x0;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
}

#[test]
#[should_panic(expected: 'Quest not claimable',)]
fn pixel_quests_dmain_no_color_claim_if_not_claimable_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x0;
    art_peace.place_pixel_blocktime(pos, color);
    warp_to_next_available_time(art_peace);
    art_peace.place_pixel_blocktime(pos, color);

    art_peace.claim_main_quest(0, utils::EMPTY_CALLDATA());
}

