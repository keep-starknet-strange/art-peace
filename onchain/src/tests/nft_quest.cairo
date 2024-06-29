use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::nft_quest::NFTMintQuest::NFTMintQuestInitParams;
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};
use art_peace::nfts::interfaces::{
    NFTMintParams, IArtPeaceNFTMinterDispatcher, IArtPeaceNFTMinterDispatcherTrait
};
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;

use snforge_std as snf;
use snforge_std::{CheatTarget, ContractClassTrait};

use starknet::{ContractAddress, contract_address_const};

const reward_amt: u32 = 18;

fn deploy_normal_nft_quest() -> ContractAddress {
    let contract = snf::declare("NFTMintQuest");

    let mut nft_quest_calldata = array![];
    NFTMintQuestInitParams {
        canvas_nft: utils::NFT_CONTRACT(),
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: reward_amt,
        is_daily: false,
        day_index: 0,
    }
        .serialize(ref nft_quest_calldata);

    contract.deploy(@nft_quest_calldata).unwrap()
}

fn deploy_daily_nft_quest() -> ContractAddress {
    let contract = snf::declare("NFTMintQuest");

    let mut nft_quest_calldata = array![];
    NFTMintQuestInitParams {
        canvas_nft: utils::NFT_CONTRACT(),
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: reward_amt,
        is_daily: true,
        day_index: 0,
    }
        .serialize(ref nft_quest_calldata);

    contract.deploy(@nft_quest_calldata).unwrap()
}

#[test]
fn deploy_normal_nft_quest_test() {
    let nft_quest = deploy_normal_nft_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(array![].span(), array![nft_quest].span())
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(
        art_peace.get_main_quests() == array![nft_quest].span(),
        "Main quests were not set correctly"
    );
}

#[test]
fn deploy_daily_nft_quest_test() {
    let nft_quest = deploy_daily_nft_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(array![nft_quest].span(), array![].span())
    };

    let zero_address = contract_address_const::<0>();

    assert!(
        art_peace.get_days_quests(0) == array![nft_quest, zero_address, zero_address].span(),
        "Daily quests were not set correctly"
    );
    assert!(art_peace.get_main_quests() == array![].span(), "Main quests were not set correctly");
}

#[test]
fn nft_quest_test() {
    let nft_mint_quest = deploy_normal_nft_quest();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![nft_mint_quest].span()
        )
    };
    let art_peace_nft_minter = IArtPeaceNFTMinterDispatcher {
        contract_address: art_peace.contract_address
    };
    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::HOST());
    art_peace_nft_minter.add_nft_contract(utils::NFT_CONTRACT());
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));

    let calldata: Array<felt252> = array![0];

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());
    let mint_params = NFTMintParams { height: 2, width: 2, position: 10, name: 'test' };
    art_peace_nft_minter.mint_nft(mint_params);
    art_peace.claim_main_quest(0, calldata.span());

    assert!(
        art_peace.get_extra_pixels_count() == reward_amt,
        "Extra pixels are wrong after main quest claim"
    );
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));
}

#[test]
#[should_panic(expected: ('Quest not claimable',))]
fn nft_quest_claim_if_not_claimable_test() {
    let nft_mint_quest = deploy_normal_nft_quest();
    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![nft_mint_quest].span()
        )
    };
    let art_peace_nft_minter = IArtPeaceNFTMinterDispatcher {
        contract_address: art_peace.contract_address
    };

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::HOST());
    art_peace_nft_minter.add_nft_contract(utils::NFT_CONTRACT());
    snf::stop_prank(CheatTarget::One(art_peace.contract_address));

    let calldata: Array<felt252> = array![0];

    snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());
    art_peace.claim_main_quest(0, calldata.span());
}
