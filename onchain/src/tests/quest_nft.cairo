// use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
// use art_peace::quests::template_quest::TemplateQuest::TemplateQuestInitParams;
// use art_peace::templates::interfaces::{
//     ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, TemplateMetadata
// };
// use art_peace::tests::art_peace::deploy_with_quests_contract;
// use art_peace::tests::utils;
// use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
// use snforge_std as snf;
// use snforge_std::{declare, CheatTarget, ContractClassTrait};

// const reward_amt: u32 = 18;

// // fn deploy_template_quest() -> ContractAddress {
// //     let contract = declare("TemplateQuest");

// //     let mut template_calldata = array![];
// //     TemplateQuestInitParams { art_peace: utils::ART_PEACE_CONTRACT(), reward: reward_amt, }
// //         .serialize(ref template_calldata);

// //     contract.deploy(@template_calldata).unwrap()
// // }

// fn deploy_nft_quest() -> ContractAddress {
//     let contract = declare("NFTMintQuest");

//     let mut nft_quest_calldata = array![];
//     NFTMintQuestInitParams {
//         CanvasNFT: utils::NFT_QUEST_CONTRACT(),
//         art_peace: utils::ART_PEACE_CONTRACT(),
//         reward: reward_amt,
//     }
//         .serialize(ref nft_quest_calldata);

//     contract.deploy(@nft_quest_calldata).unwrap()
// }

// #[test]
// fn deploy_nft_quest_test() {
//     let nft_quest = deploy_nft_quest();
//     let art_peace = IArtPeaceDispatcher {
//         contract_address: deploy_with_quests_contract(
//             array![].span(), array![nft_quest].span()
//         )
//     };

//     let zero_address = contract_address_const::<0>();

//     assert!(
//         art_peace.get_days_quests(0) == array![zero_address, zero_address, zero_address].span(),
//         "Daily quests were not set correctly"
//     );
//     assert!(
//         art_peace.get_main_quests() == array![nft_quest].span(),
//         "Main quests were not set correctly"
//     );
// }

// #[test]
// fn nft_quest_test() {
//     let nft_quest = deploy_nft_quest();
//     let art_peace = IArtPeaceDispatcher {
//         contract_address: deploy_with_quests_contract(
//             array![].span(), array![nft_quest].span()
//         )
//     };
//     // let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };

//     // let template_metadata = TemplateMetadata {
//     //     name: 'test',
//     //     hash: 0,
//     //     position: 0,
//     //     width: 2,
//     //     height: 2,
//     //     reward: 0,
//     //     reward_token: contract_address_const::<0>(),
//     //     creator: utils::PLAYER1()
//     // };
//     // template_store.add_template(template_metadata);

//     let calldata: Array<felt252> = array![0];
//     snf::start_prank(CheatTarget::One(art_peace.contract_address), utils::PLAYER1());
//     art_peace.claim_main_quest(0, calldata.span());
//     snf::stop_prank(CheatTarget::One(art_peace.contract_address));

//     assert!(
//         art_peace.get_user_extra_pixels_count(utils::PLAYER1()) == reward_amt,
//         "Extra pixels are wrong after main quest claim"
//     );
// }

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

fn deploy_nft_contract() -> ContractAddress {
    let contract = snf::declare("CanvasNFT");
    let mut calldata = array![];
    let name: ByteArray = "CanvasNFTs";
    let symbol: ByteArray = "A/P";
    name.serialize(ref calldata);
    symbol.serialize(ref calldata);
    contract.deploy_at(@calldata, utils::NFT_CONTRACT()).unwrap()
}


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
fn test_get_reward() {
    let contract_address = deploy_nft_quest();
    let dispatcher = IQuestDispatcher { contract_address };
    let current_reward = dispatcher.get_reward();

    let test_reward = 18;

    assert(current_reward == test_reward, 'Reward Not set');
}

// #[test]
// fn test_is_claimable() {
//     // let nft_contract_address = 
//     deploy_nft_contract();
//     // let nft_dispacher = ICanvasNFTStoreDispatcher { nft_contract_address };

//     let contract_address = deploy_nft_quest();
//     let dispatcher = IQuestDispatcher { contract_address };
//     // let calldata: Array<felt252> = array![0];
//     let test_is_claim = dispatcher.is_claimable(contract_address_const::<1>(), SINGLE_CALLDATA());

//     let is_claim = false;

//     assert(is_claim == test_is_claim, 'Cannot Claim Mint NFT Quest');
// }

#[test]
fn test_claim() {
    let contract_address = deploy_nft_quest();
    let dispatcher = IQuestDispatcher { contract_address };
    // let calldata: Array<felt252> = array![0]; calldata.span()
    let test_claim_reward = dispatcher.claim(contract_address_const::<1>(), SINGLE_CALLDATA());

    let claim_reward = 18;

    assert(claim_reward != test_claim_reward, 'Mint NFT Reward not Claim');
}


#[test]
#[should_panic(expected: ('Quest not claimable',))]
fn authority_quest_double_claim_test() {
    let main_authority_quest = deploy_authority_quest_main();

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_authority_quest].span()
        )
    };

    let main_authority_quest = IAuthorityQuestDispatcher { contract_address: main_authority_quest };

    let calldata: Span<felt252> = array![utils::PLAYER1().try_into().unwrap()].span();
    main_authority_quest.mark_claimable(calldata);

    snf::start_prank(
        target: CheatTarget::One(art_peace.contract_address), caller_address: utils::PLAYER1()
    );
    art_peace.claim_main_quest(0, calldata);

    assert!(
        art_peace.get_extra_pixels_count() == 20, "Extra pixels are wrong after main quest claim"
    );

    art_peace.claim_main_quest(0, calldata);
}
