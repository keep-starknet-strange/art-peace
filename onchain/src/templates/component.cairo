#[starknet::component]
pub mod TemplateStoreComponent {
    use art_peace::templates::interfaces::{ITemplateStore, TemplateMetadata};
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        templates_count: u32,
        // Map: template_id -> template_metadata
        templates: LegacyMap::<u32, TemplateMetadata>,
        // Map: template_id -> is_completed
        completed_templates: LegacyMap::<u32, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TemplateAdded: TemplateAdded,
        TemplateCompleted: TemplateCompleted,
    }

    #[derive(Drop, starknet::Event)]
    struct TemplateAdded {
        #[key]
        id: u32,
        metadata: TemplateMetadata,
    }

    #[derive(Drop, starknet::Event)]
    struct TemplateCompleted {
        #[key]
        id: u32,
    // TODO: Users rewarded, ...
    }

    #[embeddable_as(TemplateStoreImpl)]
    impl TemplateStore<
        TContractState, +HasComponent<TContractState>
    > of ITemplateStore<ComponentState<TContractState>> {
        fn get_templates_count(self: @ComponentState<TContractState>) -> u32 {
            self.templates_count.read()
        }

        fn get_template(
            self: @ComponentState<TContractState>, template_id: u32
        ) -> TemplateMetadata {
            self.templates.read(template_id)
        }

        fn get_template_hash(self: @ComponentState<TContractState>, template_id: u32) -> felt252 {
            let metadata: TemplateMetadata = self.templates.read(template_id);

            metadata.hash
        }

        // TODO: Return idx of the template?
        fn add_template(
            ref self: ComponentState<TContractState>, template_metadata: TemplateMetadata
        ) {
            let template_id = self.templates_count.read();
            self.templates.write(template_id, template_metadata);
            self.templates_count.write(template_id + 1);

            if !template_metadata.reward_token.is_zero() && template_metadata.reward != 0 {
                self.deposit(template_metadata.reward_token, template_metadata.reward);
            }

            self.emit(TemplateAdded { id: template_id, metadata: template_metadata });
        }

        fn is_template_complete(self: @ComponentState<TContractState>, template_id: u32) -> bool {
            self.completed_templates.read(template_id)
        }
    }

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn deposit(
            ref self: ComponentState<TContractState>,
            reward_token: ContractAddress,
            reward_amount: u256
        ) {
            let caller_address = get_caller_address();
            let contract_address = starknet::get_contract_address();
            assert(!get_caller_address().is_zero(), 'Invalid caller');

            let erc20_dispatcher = IERC20Dispatcher { contract_address: reward_token };
            let allowance = erc20_dispatcher.allowance(caller_address, contract_address);
            assert(allowance >= reward_amount, 'Insufficient allowance');

            let success = erc20_dispatcher
                .transfer_from(caller_address, contract_address, reward_amount);
            assert(success, 'Transfer failed');
        }
    }
}
