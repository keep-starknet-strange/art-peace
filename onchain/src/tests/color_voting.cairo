use core::traits::Into;
use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};

use art_peace::tests::art_peace::deploy_contract;
use art_peace::tests::utils;

use art_peace::ArtPeace;
use art_peace::ArtPeace::color_votesContractMemberStateTrait;

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, storage_access::storage_address_from_base};

const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);

#[test]
#[should_panic(expected: ('Color 0 indicates no vote',))]
fn vote_color_no_vote_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(0);
    snf::stop_prank(CheatTarget::One(art_peace_address));
}

#[test]
#[should_panic(expected: ('Color out of bounds',))]
fn vote_color_out_of_bounds_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let votable_colors = art_peace.get_votable_colors();
    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(votable_colors.len().try_into().unwrap() + 1);
    snf::stop_prank(CheatTarget::One(art_peace_address));
}

#[test]
fn vote_color_only_2_votes_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let vote_player1 = 1;
    let vote_player2 = 2;

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(vote_player1);
    snf::stop_prank(CheatTarget::One(art_peace_address));
    assert_eq!(art_peace.get_color_votes(vote_player1), 1, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(vote_player2), 0, "Wrong number of votes");

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER2());
    art_peace.vote_color(vote_player2);
    snf::stop_prank(CheatTarget::One(art_peace_address));
    assert_eq!(art_peace.get_color_votes(vote_player1), 1, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(vote_player2), 1, "Wrong number of votes");
}

#[test]
fn color_votes_are_reset_for_next_day_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let vote_player1 = 1;
    let vote_player2 = 2;
    let vote_player3 = 3;
    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(vote_player1);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER2());
    art_peace.vote_color(vote_player2);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER3());
    art_peace.vote_color(vote_player3);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    assert_eq!(art_peace.get_color_votes(vote_player1), 1, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(vote_player2), 1, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(vote_player3), 1, "Wrong number of votes");

    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    assert_eq!(art_peace.get_color_votes(vote_player1), 0, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(vote_player2), 0, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(vote_player3), 0, "Wrong number of votes");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

#[test]
fn color_palette_is_updated_according_to_votes_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let vote_player1 = 2; // 0x00DD00,
    let color_player1 = 0x00DD00;
    let vote_player2 = 3; // 0x0000DD,
    let color_player2 = 0x0000DD;
    let vote_player3 = 4; // 0xDDDD00,
    let color_player3 = 0xDDDD00;

    let old_colors_count = art_peace.get_color_count();
    let old_colors = art_peace.get_colors();

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(vote_player1);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER2());
    art_peace.vote_color(vote_player2);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER3());
    art_peace.vote_color(vote_player3);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    let colors_count = art_peace.get_color_count();
    let colors = art_peace.get_colors().span();
    assert_eq!(colors_count, old_colors_count + 3, "Number of colors not updated");
    let mut found: u8 = 0;
    let mut index: u8 = 0;
    while index < old_colors_count {
        assert_eq!(colors.at(index.into()), old_colors.at(index.into()), "Color mistmached");
        index += 1;
    };
    while index < colors_count {
        let color = colors.at(index.into());
        if *color == color_player1 {
            found += 1;
        }
        if *color == color_player2 {
            found += 2;
        }
        if *color == color_player3 {
            found += 4;
        }
        index += 1;
    };
    assert_eq!(found, 7, "Missing new color");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

#[test]
fn color_palette_is_updated_according_to_votes_multi_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };

    let old_colors_count = art_peace.get_color_count();
    let old_colors = art_peace.get_colors();

    let day = art_peace.get_day();

    set_vote(day, 1, 5, art_peace_address);
    set_vote(day, 2, 8, art_peace_address);
    set_vote(day, 3, 7, art_peace_address);
    set_vote(day, 4, 5, art_peace_address);
    set_vote(day, 5, 4, art_peace_address);

    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    let colors_count = art_peace.get_color_count();
    let colors = art_peace.get_colors().span();
    assert_eq!(colors_count, old_colors_count + 4, "Number of colors not updated");
    let mut found: u8 = 0;
    let mut index: u8 = 0;
    while index < old_colors_count {
        assert_eq!(colors.at(index.into()), old_colors.at(index.into()), "Color mistmached");
        index += 1;
    };
    while index < colors_count {
        let color = colors.at(index.into());
        if *color == 0xDD0000 {
            found += 1;
        }
        if *color == 0x00DD00 {
            found += 2;
        }
        if *color == 0x0000DD {
            found += 4;
        }
        if *color == 0xDDDD00 {
            found += 8;
        }
        index += 1;
    };
    assert_eq!(found, 15, "Missing new color");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

#[test]
fn player_can_update_his_vote_color_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let first_vote = 1;
    let second_vote = 2;

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(first_vote);
    snf::stop_prank(CheatTarget::One(art_peace_address));
    assert_eq!(art_peace.get_color_votes(first_vote), 1, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(second_vote), 0, "Wrong number of votes");

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(second_vote);
    snf::stop_prank(CheatTarget::One(art_peace_address));
    assert_eq!(art_peace.get_color_votes(first_vote), 0, "Wrong number of votes");
    assert_eq!(art_peace.get_color_votes(second_vote), 1, "Wrong number of votes");
}

#[test]
fn get_votable_colors_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let votable_colors = art_peace.get_votable_colors();
    let expected_colors = array![
        0xDD0000,
        0x00DD00,
        0x0000DD,
        0xDDDD00,
        0xDD00DD,
        0x00DDDD,
        0x880000,
        0x008800,
        0x000088,
        0x888800,
    ];
    assert_eq!(votable_colors.len(), expected_colors.len(), "Wrong number of votable colors");
    assert_eq!(votable_colors, expected_colors, "Wrong votable colors");
}

#[test]
fn votable_colors_is_updated_according_to_votes_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let vote_player1 = 2; // 0x00DD00,
    let vote_player2 = 3; // 0x0000DD,
    let vote_player3 = 4; // 0xDDDD00,

    let expected_colors = array![
        0xDD0000, // 0x00DD00,
         // 0x0000DD,
        // 0xDDDD00,
        0xDD00DD, 0x00DDDD, 0x880000, 0x008800, 0x000088, 0x888800,
    ];

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER1());
    art_peace.vote_color(vote_player1);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER2());
    art_peace.vote_color(vote_player2);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    snf::start_prank(CheatTarget::One(art_peace_address), utils::PLAYER3());
    art_peace.vote_color(vote_player3);
    snf::stop_prank(CheatTarget::One(art_peace_address));

    let old_votable_colors_count = art_peace.get_votable_colors().len();
    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    let votable_colors = art_peace.get_votable_colors();
    assert_eq!(
        votable_colors.len() + 3, old_votable_colors_count, "Number of votable colors not updated"
    );
    assert_eq!(votable_colors, expected_colors, "Votable colors mismatch");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

#[test]
fn votable_colors_is_updated_according_to_votes_multi_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };

    let expected_colors = array![ // 0xDD0000, 
        // 0x00DD00,
        // 0x0000DD,
        // 0xDDDD00,
        0xDD00DD, 0x00DDDD, 0x880000, 0x008800, 0x000088, 0x888800,
    ];

    let day = art_peace.get_day();

    set_vote(day, 1, 5, art_peace_address);
    set_vote(day, 2, 8, art_peace_address);
    set_vote(day, 3, 7, art_peace_address);
    set_vote(day, 4, 5, art_peace_address);
    set_vote(day, 5, 4, art_peace_address);

    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    let votable_colors = art_peace.get_votable_colors();
    assert_eq!(votable_colors, expected_colors, "Votable colors mismatch");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

#[test]
fn no_vote_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let previous_votable_colors = art_peace.get_votable_colors();
    let previous_palette = art_peace.get_colors();
    snf::start_warp(CheatTarget::One(art_peace_address), DAY_IN_SECONDS);
    art_peace.increase_day_index();
    let votable_colors = art_peace.get_votable_colors();
    let palette = art_peace.get_colors();
    assert_eq!(votable_colors, previous_votable_colors, "Votable colors mismatch");
    assert_eq!(palette, previous_palette, "Palette colors mismatch");
    snf::stop_warp(CheatTarget::One(art_peace_address));
}

fn set_vote(day: u32, color_index: u8, vote: u32, contract_address: ContractAddress) {
    let mut state = ArtPeace::contract_state_for_testing();
    let storage_address: felt252 = storage_address_from_base(
        state.color_votes.address((color_index, day))
    )
        .into();
    let storage_value: Span<felt252> = array![vote.into()].span();
    snf::store(contract_address, storage_address, storage_value);
}
