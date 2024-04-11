use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::ArtPeace::InitParams;
use art_peace::templates::interface::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher,
    ITemplateVerifierDispatcherTrait, TemplateMetadata
};

use core::poseidon::PoseidonTrait;
use core::hash::{HashStateTrait, HashStateExTrait};

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};
use starknet::{ContractAddress, contract_address_const};

const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);
const WIDTH: u128 = 100;
const HEIGHT: u128 = 100;
const TIME_BETWEEN_PIXELS: u64 = 10;

fn ART_PEACE_CONTRACT() -> ContractAddress {
    contract_address_const::<'ArtPeace'>()
}

fn EMPTY_CALLDATA() -> Span<felt252> {
    array![].span()
}

fn deploy_contract() -> ContractAddress {
    let contract = snf::declare("ArtPeace");
    let mut calldata = array![];
    InitParams {
        canvas_width: WIDTH,
        canvas_height: HEIGHT,
        time_between_pixels: TIME_BETWEEN_PIXELS,
        color_palette: array![
            0x000000,
            0xFFFFFF,
            0xFF0000,
            0x00FF00,
            0x0000FF,
            0xFFFF00,
            0xFF00FF,
            0x00FFFF,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        end_time: 1000000,
        daily_quests: array![].span(),
        main_quests: array![].span(),
    }
        .serialize(ref calldata);
    let contract_addr = contract.deploy_at(@calldata, ART_PEACE_CONTRACT()).unwrap();
    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS);

    contract_addr
}

fn deploy_with_quests_contract(
    daily_quests: Span<ContractAddress>, main_quests: Span<ContractAddress>
) -> ContractAddress {
    let contract = snf::declare("ArtPeace");
    let mut calldata = array![];
    InitParams {
        canvas_width: WIDTH,
        canvas_height: HEIGHT,
        time_between_pixels: TIME_BETWEEN_PIXELS,
        color_palette: array![
            0x000000,
            0xFFFFFF,
            0xFF0000,
            0x00FF00,
            0x0000FF,
            0xFFFF00,
            0xFF00FF,
            0x00FFFF,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        end_time: 1000000,
        daily_quests: daily_quests,
        main_quests: main_quests,
    }
        .serialize(ref calldata);
    let contract_addr = contract.deploy_at(@calldata, ART_PEACE_CONTRACT()).unwrap();
    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS);

    contract_addr
}

fn deploy_pixel_quest_daily(pixel_quest: snf::ContractClass) -> ContractAddress {
    // art_peace, reward, pixels_needed, is_daily, claim_day
    let mut calldata: Array<felt252> = array![ART_PEACE_CONTRACT().into(), 10, 3, 1, 0];

    pixel_quest.deploy(@calldata).unwrap()
}

fn deploy_pixel_quest_main(pixel_quest: snf::ContractClass) -> ContractAddress {
    // art_peace, reward, pixels_needed, is_daily, claim_day
    let mut calldata: Array<felt252> = array![ART_PEACE_CONTRACT().into(), 20, 4, 0, 0];

    pixel_quest.deploy(@calldata).unwrap()
}

fn warp_to_next_available_time(art_peace: IArtPeaceDispatcher) {
    let last_time = art_peace.get_last_placed_time();
    snf::start_warp(CheatTarget::One(art_peace.contract_address), last_time + TIME_BETWEEN_PIXELS);
}

fn compute_template_hash(template: Span<u8>) -> felt252 {
    let template_len = template.len();
    if template_len == 0 {
        return 0;
    }

    let mut hasher = PoseidonTrait::new();
    let mut i = 0;
    while i < template_len {
        hasher = hasher.update_with(*template.at(i));
        i += 1;
    };

    hasher.finalize()
}

#[test]
fn deploy_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    assert!(art_peace.get_width() == WIDTH, "Deployed contract has wrong width");
    assert!(art_peace.get_height() == HEIGHT, "Deployed contract has wrong height");
    assert!(
        art_peace.get_total_pixels() == WIDTH * HEIGHT, "Deployed contract has wrong total pixels"
    );
// TODO: Other getters & asserts
}

// TODO: To fuzz test
// TODO: Test out of bounds, other assert failures
// TODO: event spy?
// TODO: all getters & setters
// TODO: Tests assert in code
// TODO: Check pixel owner

#[test]
fn place_pixel_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    art_peace.place_pixel(pos, color);
    assert!(art_peace.get_pixel_color(pos) == color, "Pixel was not placed correctly at pos");
    assert!(art_peace.get_pixel_xy(x, y).color == color, "Pixel was not placed correctly at xy");

    warp_to_next_available_time(art_peace);
    let x = 15;
    let y = 25;
    let pos = x + y * WIDTH;
    let color = 0x7;
    art_peace.place_pixel_xy(x, y, color);
    assert!(art_peace.get_pixel_xy(x, y).color == color, "Pixel xy was not placed correctly at xy");
    assert!(art_peace.get_pixel(pos).color == color, "Pixel xy was not placed correctly at pos");
}

#[test]
fn deploy_quest_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let empty_quest = contract_address_const::<'EmptyQuest'>();
    let daily_quests = array![deploy_pixel_quest_daily(pixel_quest), empty_quest, empty_quest];
    let main_quests = array![deploy_pixel_quest_main(pixel_quest)];
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

// TODO: Daily quest test day 2, stats, other fields ...

#[test]
fn pixel_quest_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let empty_quest = contract_address_const::<'EmptyQuest'>();
    let daily_quests = array![deploy_pixel_quest_daily(pixel_quest), empty_quest, empty_quest];
    let main_quests = array![deploy_pixel_quest_main(pixel_quest)];
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(daily_quests.span(), main_quests.span())
    };

    // snf::start_prank(CheatTarget::One(art_peace.contract_address), TEST_ACCOUNT());

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    art_peace.place_pixel(pos, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    assert!(art_peace.get_extra_pixels_count() == 0, "Extra pixels are wrong after invalid claims");

    warp_to_next_available_time(art_peace);
    let x = 15;
    let y = 25;
    let color = 0x7;
    art_peace.place_pixel_xy(x, y, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    assert!(art_peace.get_extra_pixels_count() == 0, "Extra pixels are wrong after invalid claims");

    warp_to_next_available_time(art_peace);
    let x = 20;
    let y = 30;
    let pos = x + y * WIDTH;
    let color = 0x9;
    art_peace.place_pixel(pos, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    assert!(
        art_peace.get_extra_pixels_count() == 10, "Extra pixels are wrong after daily quest claim"
    );

    warp_to_next_available_time(art_peace);
    let x = 25;
    let y = 35;
    let color = 0xB;
    art_peace.place_pixel_xy(x, y, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    assert!(
        art_peace.get_extra_pixels_count() == 30, "Extra pixels are wrong after main quest claim"
    );
}

#[test]
fn template_full_basic_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };
    let template_verifier = ITemplateVerifierDispatcher {
        contract_address: art_peace.contract_address
    };

    assert!(template_store.get_templates_count() == 0, "Templates count is not 0");

    // 2x2 template image
    let template_image = array![1, 2, 3, 4];
    let template_hash = compute_template_hash(template_image.span());
    let template_metadata = TemplateMetadata {
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: 0,
        reward_token: contract_address_const::<0>(),
    };

    let reward_token: ContractAddress = contract_address_const::<0x0>();

    template_store.add_template(template_metadata, reward_token, 0);

    assert!(template_store.get_templates_count() == 1, "Templates count is not 1");
    assert!(template_store.get_template_hash(0) == template_hash, "Template hash is not correct");
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (base)"
    );

    warp_to_next_available_time(art_peace);
    let x = 0;
    let y = 0;
    let pos = x + y * WIDTH;
    let color = 1;
    art_peace.place_pixel(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (1)"
    );

    warp_to_next_available_time(art_peace);
    let x = 1;
    let y = 0;
    let pos = x + y * WIDTH;
    let color = 2;
    art_peace.place_pixel(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (2)"
    );

    warp_to_next_available_time(art_peace);
    let x = 0;
    let y = 1;
    let pos = x + y * WIDTH;
    let color = 3;
    art_peace.place_pixel(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (3)"
    );

    warp_to_next_available_time(art_peace);
    let x = 1;
    let y = 1;
    let pos = x + y * WIDTH;
    let color = 4;
    art_peace.place_pixel(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == true,
        "Template is not completed after it should be"
    );
}

#[test]
fn increase_day_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };

    let current_day_index = art_peace.get_day();
    assert!(current_day_index == 0, "day index wrongly initialized");

    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    let current_day_index = art_peace.get_day();
    assert!(current_day_index == 1, "day index not updated");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

#[test]
#[should_panic(expected: ('day has not passed',))]
fn increase_day_panic_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };

    let current_day_index = art_peace.get_day();
    assert!(current_day_index == 0, "day index wrongly initialized");

    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS - 1);
    art_peace.increase_day_index();
}
// TODO: test invalid template inputs


