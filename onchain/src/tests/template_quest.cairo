use snforge_std::{declare, ContractClassTrait};
use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};
use art_peace::quests::template_quest::TemplateQuest::TemplateQuestInitParams;

use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};


const reward_decimals: u32 = 18_u32;

fn deploy_contract() -> ContractAddress {
    let contract = declare("TemplateQuest");

    let mut template_calldata = array![];
    TemplateQuestInitParams { art_peace: contract_address_const::<1>(), reward: reward_decimals, }
        .serialize(ref template_calldata);

    return contract.deploy(@template_calldata).unwrap();
}


#[test]
fn test_get_reward() {
    let contract_address = deploy_contract();
    let dispatcher = IQuestDispatcher { contract_address };
    let current_reward = dispatcher.get_reward();

    let test_reward = 18;

    assert(current_reward == test_reward, 'Reward Not set');
}
