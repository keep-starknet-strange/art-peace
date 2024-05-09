use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use art_peace::quests::unruggable_quest::UnruggableQuest::UnruggableQuestInitParams;
use art_peace::mocks::unruggable_token::UnruggableMock;
use art_peace::tests::utils;
use art_peace::tests::art_peace::deploy_with_quests_contract;

use snforge_std as snf;
use snforge_std::ContractClassTrait;

use starknet::{ContractAddress, contract_address_const, get_contract_address};

fn UNRUGGABLE_MOCK_CONTRACT() -> ContractAddress {
    contract_address_const::<'Unruggable'>()
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

fn deploy_unruggable_quest_main(unruggable_quest: snf::ContractClass) -> ContractAddress {
    let mut unruggable_calldata = array![];
    UnruggableQuestInitParams { art_peace: utils::ART_PEACE_CONTRACT(), reward: 20, }
        .serialize(ref unruggable_calldata);
    let main_unruggable_quest = unruggable_quest.deploy(@unruggable_calldata).unwrap();

    main_unruggable_quest
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
#[should_panic(expected: 'Index out of bounds')]
fn unruggable_quest_claim_if_not_claimable_test() {
    let unruggable_quest = snf::declare("UnruggableQuest");
    let main_unruggable_quest = deploy_unruggable_quest_main(unruggable_quest);

    let art_peace = IArtPeaceDispatcher {
        contract_address: deploy_with_quests_contract(
            array![].span(), array![main_unruggable_quest].span()
        )
    };

    let calldata: Span<felt252> = array![].span();

    art_peace.claim_main_quest(0, calldata);
}
