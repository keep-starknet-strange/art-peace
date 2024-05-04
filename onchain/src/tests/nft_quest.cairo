use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::template_quest::TemplateQuest::TemplateQuestInitParams;
use art_peace::quests::nft_quest::NFTMintQuest::NFTMintQuestInitParams;
// use art_peace::quests::nft_quest::{INFTMintQuestDispatcher, INFTMintQuestDispatcherTrait} // NFTMintQuest::NFTMintQuestInitParams;
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};
use art_peace::templates::interfaces::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, TemplateMetadata
};
use art_peace::tests::art_peace::deploy_with_quests_contract;
use art_peace::tests::utils;
use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
use snforge_std as snf;
use snforge_std::{declare, CheatTarget, ContractClassTrait};

const reward_amt: u32 = 18;


fn deploy_nft_quest() -> ContractAddress {
    let contract = declare("NFTMintQuest");

    let mut nft_quest_calldata = array![];
    NFTMintQuestInitParams {
        CanvasNFT: utils::NFT_QUEST_CONTRACT(),
        art_peace: utils::ART_PEACE_CONTRACT(),
        reward: reward_amt,
    }
        .serialize(ref nft_quest_calldata);

    contract.deploy(@nft_quest_calldata).unwrap()
}


#[test]
fn deploy_nft_quest_test() {
    let nft_quest = deploy_nft_quest();
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


fn nft_quest_test() {
    let nft_mint_quest = deploy_nft_quest();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![nft_mint_quest].span()
        )
    };

    let nft_mint_quest = IQuestDispatcher { contract_address: nft_mint_quest };

    let calldata: Span<felt252> = array![
        utils::PLAYER1().try_into().unwrap(), utils::PLAYER2().try_into().unwrap()
    ]
        .span();
    nft_mint_quest.is_claimable(contract_address_const::<1>(), calldata);

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
