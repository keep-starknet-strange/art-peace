use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherImpl};

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};
use starknet::ContractAddress;

const WIDTH: u128 = 100;
const HEIGHT: u128 = 100;
const TIME_BETWEEN_PIXELS: u64 = 10;

fn deploy_contract() -> ContractAddress {
    let contract = snf::declare("ArtPeace");
    let calldata: Array<felt252> = array![WIDTH.into(), HEIGHT.into(), TIME_BETWEEN_PIXELS.into()];
    let contract_addr = contract.deploy(@calldata).unwrap();
    snf::start_warp(CheatTarget::One(contract_addr), TIME_BETWEEN_PIXELS);
    contract_addr
}

fn warp_to_next_available_time(art_peace: IArtPeaceDispatcher) {
    let last_time = art_peace.get_last_placed();
    snf::start_warp(CheatTarget::One(art_peace.contract_address), last_time + TIME_BETWEEN_PIXELS);
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

// TODO: To fuzz test
// TODO: Test out of bounds, other assert failures
// TODO: event spy?
// TODO: all getters & setters

#[test]
fn place_pixel_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    art_peace.place_pixel(pos, color);
    assert!(art_peace.get_pixel(pos) == color, "Pixel was not placed correctly at pos");
    assert!(art_peace.get_pixel_xy(x, y) == color, "Pixel was not placed correctly at xy");

    warp_to_next_available_time(art_peace);
    let x = 15;
    let y = 25;
    let pos = x + y * WIDTH;
    let color = 0x7;
    art_peace.place_pixel_xy(x, y, color);
    assert!(art_peace.get_pixel_xy(x, y) == color, "Pixel xy was not placed correctly at xy");
    assert!(art_peace.get_pixel(pos) == color, "Pixel xy was not placed correctly at pos");
}
