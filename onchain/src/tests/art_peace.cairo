use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::ArtPeace::InitParams;
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

use starknet::{ContractAddress, contract_address_const, get_contract_address, get_caller_address};

const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);
const WIDTH: u128 = 100;
const HEIGHT: u128 = 100;
const TIME_BETWEEN_PIXELS: u64 = 10;
const LEANIENCE_MARGIN: u64 = 20;

pub(crate) fn deploy_contract() -> ContractAddress {
    deploy_nft_contract();

    let contract = snf::declare("ArtPeace");
    let mut calldata = array![];
    InitParams {
        host: utils::HOST(),
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
        votable_colors: array![
            0xDD0000,
            0x00DD00,
            0x0000DD,
            0xDDDD00,
            0xDD00DD,
            0x00DDDD,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        daily_new_colors_count: 3,
        end_time: 1000000,
        daily_quests_count: 3,
    }
        .serialize(ref calldata);
    let contract_addr = contract.deploy_at(@calldata, utils::ART_PEACE_CONTRACT()).unwrap();
    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS + LEANIENCE_MARGIN);

    contract_addr
}

pub(crate) fn deploy_with_quests_contract(
    daily_quests: Span<ContractAddress>, main_quests: Span<ContractAddress>
) -> ContractAddress {
    deploy_nft_contract();

    let contract = snf::declare("ArtPeace");
    let daily_quests_count = 3;
    let mut calldata = array![];
    InitParams {
        host: utils::HOST(),
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
        votable_colors: array![
            0xDD0000,
            0x00DD00,
            0x0000DD,
            0xDDDD00,
            0xDD00DD,
            0x00DDDD,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        daily_new_colors_count: 3,
        end_time: 1000000,
        daily_quests_count: daily_quests_count,
    }
        .serialize(ref calldata);

    let contract_addr = contract.deploy_at(@calldata, utils::ART_PEACE_CONTRACT()).unwrap();

    snf::start_prank(CheatTarget::One(contract_addr), utils::HOST());
    let art_peace = IArtPeaceDispatcher { contract_address: contract_addr };
    let mut i = 0;
    let mut dayId = 0;
    let mut days_quests: Array<ContractAddress> = array![];
    while i < daily_quests
        .len() {
            days_quests.append(*daily_quests.at(i));
            i += 1;
            if i % daily_quests_count == 0 {
                art_peace.add_daily_quests(dayId, days_quests.span());
                dayId += 1;
                days_quests = array![];
            }
        };
    if days_quests.len() > 0 {
        art_peace.add_daily_quests(dayId, days_quests.span());
    }

    art_peace.add_main_quests(main_quests);
    snf::stop_prank(CheatTarget::One(contract_addr));

    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS + LEANIENCE_MARGIN);

    contract_addr
}

fn deploy_nft_contract() -> ContractAddress {
    let contract = snf::declare("CanvasNFT");
    let mut calldata = array![];
    let name: ByteArray = "CanvasNFTs";
    let symbol: ByteArray = "A/P";
    name.serialize(ref calldata);
    symbol.serialize(ref calldata);
    contract.deploy_at(@calldata, utils::NFT_CONTRACT()).unwrap()
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

    let contract_addr = contract.deploy_at(@calldata, utils::ERC20_MOCK_CONTRACT()).unwrap();

    contract_addr
}

pub(crate) fn warp_to_next_available_time(art_peace: IArtPeaceDispatcher) {
    let last_time = art_peace.get_last_placed_time();
    snf::start_warp(
        CheatTarget::One(art_peace.contract_address),
        last_time + TIME_BETWEEN_PIXELS + LEANIENCE_MARGIN
    );
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
}

// TODO: event spy?
// TODO: Tests assert in code
// TODO: Check pixel owner

#[test]
fn place_pixel_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;
    art_peace.place_pixel(pos, color, now);
    assert!(art_peace.get_pixel_color(pos) == color, "Pixel was not placed correctly at pos");
    assert!(art_peace.get_pixel_xy(x, y).color == color, "Pixel was not placed correctly at xy");

    warp_to_next_available_time(art_peace);
    let x = 15;
    let y = 25;
    let pos = x + y * WIDTH;
    let color = 0x7;
    let now = 20;
    art_peace.place_pixel_xy(x, y, color, now);
    assert!(art_peace.get_pixel_xy(x, y).color == color, "Pixel xy was not placed correctly at xy");
    assert!(art_peace.get_pixel(pos).color == color, "Pixel xy was not placed correctly at pos");
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
        name: 'test',
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: 0,
        reward_token: erc20_mock,
        creator: get_caller_address()
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
    art_peace.place_pixel_blocktime(pos, color);
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
    art_peace.place_pixel_blocktime(pos, color);
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
    art_peace.place_pixel_blocktime(pos, color);
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
    art_peace.place_pixel_blocktime(pos, color);
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

// TODO: Deploy test for nft that checks name, symbol, uri, etc.

#[test]
fn nft_mint_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    let nft_minter = IArtPeaceNFTMinterDispatcher { contract_address: art_peace.contract_address };
    let nft_store = ICanvasNFTStoreDispatcher { contract_address: utils::NFT_CONTRACT() };
    let nft = IERC721Dispatcher { contract_address: utils::NFT_CONTRACT() };
    snf::start_prank(CheatTarget::One(nft_minter.contract_address), utils::HOST());
    nft_minter.add_nft_contract(utils::NFT_CONTRACT());
    snf::stop_prank(CheatTarget::One(nft_minter.contract_address));

    let mint_params = NFTMintParams { position: 10, width: 16, height: 16, };
    snf::start_prank(CheatTarget::One(nft_minter.contract_address), utils::PLAYER1());
    nft_minter.mint_nft(mint_params);
    snf::stop_prank(CheatTarget::One(nft_minter.contract_address));

    let expected_metadata = NFTMetadata {
        position: 10,
        width: 16,
        height: 16,
        image_hash: 0,
        block_number: 2000, // TODO
        minter: utils::PLAYER1(),
    };
    let nft_metadata = nft_store.get_nft_metadata(0);

    assert!(nft_store.get_nfts_count() == 1, "NFTs count is not 1");
    assert!(nft_metadata == expected_metadata, "NFT metadata is not correct");
    assert!(nft.owner_of(0) == utils::PLAYER1(), "NFT owner is not correct");
    assert!(nft.balance_of(utils::PLAYER1()) == 1, "NFT balance is not correct");
    assert!(nft.balance_of(utils::PLAYER2()) == 0, "NFT balance is not correct");

    snf::start_prank(CheatTarget::One(nft.contract_address), utils::PLAYER1());
    nft.transfer_from(utils::PLAYER1(), utils::PLAYER2(), 0);
    snf::stop_prank(CheatTarget::One(nft.contract_address));

    assert!(nft.owner_of(0) == utils::PLAYER2(), "NFT owner is not correct after transfer");
    assert!(nft.balance_of(utils::PLAYER1()) == 0, "NFT balance is not correct after transfer");
    assert!(nft.balance_of(utils::PLAYER2()) == 1, "NFT balance is not correct after transfer");
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
        name: 'test',
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: reward_amount,
        reward_token: erc20_mock,
        creator: get_caller_address(),
    };

    IERC20Dispatcher { contract_address: erc20_mock }.approve(art_peace_address, reward_amount);

    template_store.add_template(template_metadata);

    let art_peace_token_balance = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(art_peace_address);

    assert!(
        art_peace_token_balance == reward_amount, "reward wrongly distributed when adding template"
    );
}

