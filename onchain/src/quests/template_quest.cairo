#[starknet::contract]
pub mod TemplateQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::templates::interfaces::{ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait};
    use art_peace::quests::IQuest;

    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[derive(Drop, Serde)]
    pub struct TemplateQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: TemplateQuestInitParams) {
        self.art_peace.write(init_params.art_peace);
        self.reward.write(init_params.reward);
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

            let template_store = ITemplateStoreDispatcher {
                contract_address: self.art_peace.read()
            };
            let template = template_store.get_template(template_id);

            if template.creator != user {
                return false;
            }

            return true;
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            assert(get_caller_address() == self.art_peace.read(), 'Only ArtPeace can claim quests');

            assert(self.is_claimable(user, calldata), 'Quest not claimable');

            self.claimed.write(user, true);
            let reward = self.reward.read();

            reward
        }
    }
}
