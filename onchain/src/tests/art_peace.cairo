use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::ArtPeace::InitParams;
use art_peace::quests::pixel_quest::PixelQuest::PixelQuestInitParams;
use art_peace::quests::unruggable_quest::UnruggableQuest::UnruggableQuestInitParams;
use art_peace::mocks::erc20_mock::SnakeERC20Mock;
use art_peace::mocks::unruggable_token::UnruggableMock;
use art_peace::tests::utils;
use art_peace::nfts::interfaces::{
    IArtPeaceNFTMinterDispatcher, IArtPeaceNFTMinterDispatcherTrait, ICanvasNFTStoreDispatcher,
    ICanvasNFTStoreDispatcherTrait, NFTMintParams, NFTMetadata
};
use art_peace::templates::interfaces::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher,
    ITemplateVerifierDispatcherTrait, TemplateMetadata
};

use core::poseidon::PoseidonTrait;
use core::hash::{HashStateTrait, HashStateExTrait};

use openzeppelin::token::erc20::interface::{IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, contract_address_const, get_contract_address};

const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);
const WIDTH: u128 = 100;
const HEIGHT: u128 = 100;
const TIME_BETWEEN_PIXELS: u64 = 10;

fn ART_PEACE_CONTRACT() -> ContractAddress {
    contract_address_const::<'ArtPeace'>()
}

fn ERC20_MOCK_CONTRACT() -> ContractAddress {
    contract_address_const::<'erc20mock'>()
}

fn UNRUGGABLE_MOCK_CONTRACT() -> ContractAddress {
    contract_address_const::<'unruggable'>()
}

fn EMPTY_CALLDATA() -> Span<felt252> {
    array![].span()
}

fn EMPTY_QUEST_CONTRACT() -> ContractAddress {
    contract_address_const::<'EmptyQuest'>()
}

fn NFT_CONTRACT() -> ContractAddress {
    contract_address_const::<'CanvasNFT'>()
}

fn PLAYER1() -> ContractAddress {
    contract_address_const::<'Player1'>()
}

fn PLAYER2() -> ContractAddress {
    contract_address_const::<'Player2'>()
}

fn deploy_contract() -> ContractAddress {
    deploy_nft_contract();

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
        nft_contract: NFT_CONTRACT(),
    }
        .serialize(ref calldata);
    let contract_addr = contract.deploy_at(@calldata, ART_PEACE_CONTRACT()).unwrap();
    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS);

    contract_addr
}

fn deploy_with_quests_contract(
    daily_quests: Span<ContractAddress>, main_quests: Span<ContractAddress>
) -> ContractAddress {
    deploy_nft_contract();

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
        nft_contract: NFT_CONTRACT(),
    }
        .serialize(ref calldata);
    let contract_addr = contract.deploy_at(@calldata, ART_PEACE_CONTRACT()).unwrap();
    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS);

    contract_addr
}

fn deploy_pixel_quests_daily(pixel_quest: snf::ContractClass) -> Array<ContractAddress> {
    let mut daily_pixel_calldata = array![];
    PixelQuestInitParams {
        art_peace: ART_PEACE_CONTRACT(),
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
        art_peace: ART_PEACE_CONTRACT(),
        reward: 10,
        pixels_needed: 3,
        is_daily: true,
        claim_day: 0,
        is_color: true,
        color: 0x1,
    }
        .serialize(ref daily_color_calldata);
    let daily_color_quest = pixel_quest.deploy(@daily_color_calldata).unwrap();

    array![daily_pixel_quest, daily_color_quest, EMPTY_QUEST_CONTRACT()]
}

fn deploy_pixel_quests_main(pixel_quest: snf::ContractClass) -> Array<ContractAddress> {
    let mut main_pixel_calldata = array![];
    PixelQuestInitParams {
        art_peace: ART_PEACE_CONTRACT(),
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
        art_peace: ART_PEACE_CONTRACT(),
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

fn deploy_unruggable_quest_main(unruggable_quest: snf::ContractClass) -> ContractAddress {
    let mut unruggable_calldata = array![];
    UnruggableQuestInitParams { art_peace: ART_PEACE_CONTRACT(), reward: 20, }
        .serialize(ref unruggable_calldata);
    let main_unruggable_quest = unruggable_quest.deploy(@unruggable_calldata).unwrap();

    main_unruggable_quest
}

fn deploy_nft_contract() -> ContractAddress {
    let contract = snf::declare("CanvasNFT");
    let mut calldata = array![];
    let name: ByteArray = "CanvasNFTs";
    let symbol: ByteArray = "A/P";
    name.serialize(ref calldata);
    symbol.serialize(ref calldata);
    calldata.append(ART_PEACE_CONTRACT().into());
    contract.deploy_at(@calldata, NFT_CONTRACT()).unwrap()
}


fn deploy_erc20_mock() -> ContractAddress {
    let contract = snf::declare("SnakeERC20Mock");
    let name: ByteArray = "erc20 mock";
    let symbol: ByteArray = "ERC20MOCK";
    let initial_supply: u256 = 10 * utils::pow_256(10, 18);
    let recipient: ContractAddress = get_contract_address();

    let mut calldata: Array<felt252> = array![];
    Serde::serialize(@name, ref calldata);
    Serde::serialize(@symbol, ref calldata);
    Serde::serialize(@initial_supply, ref calldata);
    Serde::serialize(@recipient, ref calldata);

    let contract_addr = contract.deploy_at(@calldata, ERC20_MOCK_CONTRACT()).unwrap();

    contract_addr
}

fn deploy_unruggable_mock() -> ContractAddress {
    let contract = snf::declare("UnruggableMock");
    let name: ByteArray = "Unruggable mock";
    let symbol: ByteArray = "UNRUGGABLE";
    let owner: ContractAddress = get_contract_address();

    let mut calldata: Array<felt252> = array![];
    Serde::serialize(@name, ref calldata);
    Serde::serialize(@symbol, ref calldata);
    Serde::serialize(@owner, ref calldata);

    let contract_addr = contract.deploy_at(@calldata, UNRUGGABLE_MOCK_CONTRACT()).unwrap();

    contract_addr
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
fn deploy_unruggable_quest_test() {
    let unruggable_quest = snf::declare("UnruggableQuest");
    let main_unruggable_quest = deploy_unruggable_quest_main(unruggable_quest);

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_unruggable_quest].span()
        )
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![main_unruggable_quest].span(),
        "Main quests were not set correctly"
    );
}

// TODO: Daily quest test day 2, stats, other fields ...

#[test]
fn pixel_quests_test() {
    let pixel_quest = snf::declare("PixelQuest");
    let daily_quests = deploy_pixel_quests_daily(pixel_quest);
    let main_quests = deploy_pixel_quests_main(pixel_quest);
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
    art_peace.claim_daily_quest(0, 1, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(1, EMPTY_CALLDATA());
    assert!(art_peace.get_extra_pixels_count() == 0, "Extra pixels are wrong after invalid claims");

    warp_to_next_available_time(art_peace);
    let x = 15;
    let y = 25;
    let color = 0x1;
    art_peace.place_pixel_xy(x, y, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_daily_quest(0, 1, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(1, EMPTY_CALLDATA());
    assert!(art_peace.get_extra_pixels_count() == 0, "Extra pixels are wrong after invalid claims");

    warp_to_next_available_time(art_peace);
    let x = 20;
    let y = 30;
    let pos = x + y * WIDTH;
    let color = 0x9;
    art_peace.place_pixel(pos, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_daily_quest(0, 1, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(1, EMPTY_CALLDATA());
    assert!(
        art_peace.get_extra_pixels_count() == 10, "Extra pixels are wrong after daily quest 1 claim"
    );

    warp_to_next_available_time(art_peace);
    let x = 25;
    let y = 35;
    let color = 0x1;
    art_peace.place_pixel_xy(x, y, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_daily_quest(0, 1, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(1, EMPTY_CALLDATA());
    assert!(
        art_peace.get_extra_pixels_count() == 30, "Extra pixels are wrong after main quest 1 claim"
    );

    warp_to_next_available_time(art_peace);
    let x = 30;
    let y = 40;
    let pos = x + y * WIDTH;
    let color = 0x1;
    art_peace.place_pixel(pos, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_daily_quest(0, 1, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(1, EMPTY_CALLDATA());
    assert!(
        art_peace.get_extra_pixels_count() == 40, "Extra pixels are wrong after daily quest 2 claim"
    );

    warp_to_next_available_time(art_peace);
    let x = 35;
    let y = 45;
    let color = 0x1;
    art_peace.place_pixel_xy(x, y, color);
    art_peace.claim_daily_quest(0, 0, EMPTY_CALLDATA());
    art_peace.claim_daily_quest(0, 1, EMPTY_CALLDATA());
    art_peace.claim_main_quest(0, EMPTY_CALLDATA());
    art_peace.claim_main_quest(1, EMPTY_CALLDATA());
    assert!(
        art_peace.get_extra_pixels_count() == 60, "Extra pixels are wrong after main quest 2 claim"
    );
}

#[test]
fn unruggable_quest_test() {
    let unruggable_quest = snf::declare("UnruggableQuest");
    let main_unruggable_quest = deploy_unruggable_quest_main(unruggable_quest);

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_unruggable_quest].span()
        )
    };

    let unruggable_token = deploy_unruggable_mock();

    let calldata: Span<felt252> = array![unruggable_token.try_into().unwrap()].span();
    art_peace.claim_main_quest(0, calldata);

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after main quest claim"
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

    let erc20_mock: ContractAddress = deploy_erc20_mock();

    // 2x2 template image
    let template_image = array![1, 2, 3, 4];
    let template_hash = compute_template_hash(template_image.span());
    let template_metadata = TemplateMetadata {
        hash: template_hash, position: 0, width: 2, height: 2, reward: 0, reward_token: erc20_mock,
    };

    template_store.add_template(template_metadata);

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

// TODO: Deploy test for nft that checks name, symbol, uri, etc.

#[test]
fn nft_mint_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    let nft_minter = IArtPeaceNFTMinterDispatcher { contract_address: art_peace.contract_address };
    let nft_store = ICanvasNFTStoreDispatcher { contract_address: NFT_CONTRACT() };
    let nft = IERC721Dispatcher { contract_address: NFT_CONTRACT() };

    let mint_params = NFTMintParams { position: 10, width: 16, height: 16, };
    snf::start_prank(CheatTarget::One(nft_minter.contract_address), PLAYER1());
    nft_minter.mint_nft(mint_params);
    snf::stop_prank(CheatTarget::One(nft_minter.contract_address));

    let expected_metadata = NFTMetadata {
        position: 10,
        width: 16,
        height: 16,
        image_hash: 0,
        block_number: 2000, // TODO
        minter: PLAYER1(),
    };
    let nft_metadata = nft_store.get_nft_metadata(0);

    assert!(nft_store.get_nfts_count() == 1, "NFTs count is not 1");
    assert!(nft_metadata == expected_metadata, "NFT metadata is not correct");
    assert!(nft.owner_of(0) == PLAYER1(), "NFT owner is not correct");
    assert!(nft.balance_of(PLAYER1()) == 1, "NFT balance is not correct");
    assert!(nft.balance_of(PLAYER2()) == 0, "NFT balance is not correct");

    snf::start_prank(CheatTarget::One(nft.contract_address), PLAYER1());
    nft.transfer_from(PLAYER1(), PLAYER2(), 0);
    snf::stop_prank(CheatTarget::One(nft.contract_address));

    assert!(nft.owner_of(0) == PLAYER2(), "NFT owner is not correct after transfer");
    assert!(nft.balance_of(PLAYER1()) == 0, "NFT balance is not correct after transfer");
    assert!(nft.balance_of(PLAYER2()) == 1, "NFT balance is not correct after transfer");
}

#[test]
fn deposit_reward_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };

    let erc20_mock: ContractAddress = deploy_erc20_mock();
    let reward_amount: u256 = 1 * utils::pow_256(10, 18);

    // 2x2 template image
    let template_image = array![1, 2, 3, 4];
    let template_hash = compute_template_hash(template_image.span());
    let template_metadata = TemplateMetadata {
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: reward_amount,
        reward_token: erc20_mock,
    };

    IERC20Dispatcher { contract_address: erc20_mock }.approve(art_peace_address, reward_amount);

    template_store.add_template(template_metadata);

    let art_peace_token_balance = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(art_peace_address);

    assert!(
        art_peace_token_balance == reward_amount, "reward wrongly distributed when adding template"
    );
}
