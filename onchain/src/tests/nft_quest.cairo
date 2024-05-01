use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::nft_quest::NFTMintQuest::NFTMintQuestInitParams;
 use art_peace::nfts::interfaces::{ICanvasNFTStore, NFTMetadata};
use art_peace::nfts::interfaces::{ICanvasNFTStoreDispatcher, ICanvasNFTStoreDispatcherTrait};
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;
use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
use snforge_std as snf;
use snforge_std::{declare, CheatTarget, ContractClassTrait};

const reward_amt: u32 = 18;

fn SINGLE_CALLDATA() -> Span<felt252> {
    array![1].span()
}

fn deploy_nft_quest() -> ContractAddress {
    let contract = declare("CanvasNFT");

    let mut nft_quest_calldata = array![];
    NFTMintQuestInitParams { CanvasNFT: utils::NFT_CONTRACT(), reward: reward_amt, }
        .serialize(ref nft_quest_calldata);

    contract.deploy(@nft_quest_calldata).unwrap()
}

#[test]
fn test_get_reward() {
    let contract_address = deploy_nft_quest();
    let dispatcher = IQuestDispatcher { contract_address };
    let current_reward = dispatcher.get_reward();

    let test_reward = 18;

    assert(current_reward == test_reward, 'Reward Not set');
}

#[test]
fn test_is_claimable() {
    let contract_address = deploy_nft_quest();
    let dispatcher = IQuestDispatcher { contract_address };
    // let calldata: Array<felt252> = array![0];
    let test_is_claim = dispatcher.is_claimable(contract_address_const::<1>(), SINGLE_CALLDATA());

    let is_claim = false;

    assert(is_claim == test_is_claim, 'Cannot Claim Mint NFT Quest');
}

#[test]
fn test_claim() {
    let contract_address = deploy_nft_quest();
    let dispatcher = IQuestDispatcher { contract_address };
    // let calldata: Array<felt252> = array![0]; calldata.span()
    let test_claim_reward = dispatcher.claim(contract_address_const::<1>(), SINGLE_CALLDATA());

    let claim_reward = 18;

    assert(claim_reward != test_claim_reward, 'Mint NFT Reward not Claim');
}
