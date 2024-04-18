use art_peace::templates::interfaces::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher,
    ITemplateVerifierDispatcherTrait, TemplateMetadata
};

#[starknet::contract]
pub mod TemplateQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::quests::{IQuest, QuestClaimed};

       #[storage]
    struct Storage {
        art_peace: IArtPeaceDispatcher,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }


    #[abi(embed_v0)]
    impl TemplateQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            let art_peace = self.art_peace.read();

            if self.claimed.read(user) {
                return false;
            }
            
            let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };

            let template_id = calldata[0];

            let template = template_store.get_template(template_id);

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