use art_peace::templates::interfaces::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher,
    ITemplateVerifierDispatcherTrait, TemplateMetadata
};

use core::array::Span;
use core::traits::{TryInto, Into};

#[starknet::contract]
pub mod TemplateQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::quests::{IQuest, QuestClaimed};
    use art_peace::templates::component::TemplateStoreComponent;

    // Declare the component
    component!(path: TemplateStoreComponent, storage: templates, event: TemplateEvent);

    #[abi(embed_v0)]
    impl TemplateStoreComponentImpl =
        TemplateStoreComponent::TemplateStoreImpl<ContractState>;

    #[storage]
    struct Storage {
        art_peace: IArtPeaceDispatcher,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
        #[substorage(v0)]
        templates: TemplateStoreComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        TemplateEvent: TemplateStoreComponent::Event,
        QuestClaimed: QuestClaimed,
    }


    #[derive(Drop, Serde)]
    pub struct TemplateQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: TemplateQuestInitParams) {
        self.reward.write(init_params.reward);
        self.art_peace.write(IArtPeaceDispatcher { contract_address: init_params.art_peace });
    }

    #[abi(embed_v0)]
    impl TemplateQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let template_id_felt = *calldata.at(0);

            let template_id: u32 = template_id_felt.try_into().unwrap();

            let template = self.templates.get_template(template_id);

            if template.creator != user {
                return false;
            }

            return true;
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            assert(
                get_caller_address() == self.art_peace.read().contract_address,
                'Only ArtPeace can claim quests'
            );
            // TODO: should we revert if the quest is not claimable?
            if !self.is_claimable(user, calldata) {
                return 0;
            }

            self.claimed.write(user, true);
            let reward = self.reward.read();
            self.emit(QuestClaimed { user, reward, calldata });

            reward
        }
    }
}
