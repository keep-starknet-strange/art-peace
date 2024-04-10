#[starknet::component]
mod TemplateStoreComponent {
    use art_peace::templates::interface::{ITemplateStore, TemplateMetadata};

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
    enum Event {
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
    impl TemplateStore<TContractState, +HasComponent<TContractState>> of ITemplateStore<ComponentState<TContractState>> {
        fn get_templates_count(self: @ComponentState<TContractState>) -> u32 {
            return self.templates_count.read();
        }

        fn get_template(self: @ComponentState<TContractState>, template_id: u32) -> TemplateMetadata {
            return self.templates.read(template_id);
        }

        fn get_template_hash(self: @ComponentState<TContractState>, template_id: u32) -> felt252 {
            let metadata: TemplateMetadata = self.templates.read(template_id);
            return metadata.hash;
        }
        
        // TODO: Return idx of the template?
        fn add_template(ref self: ComponentState<TContractState>, template_metadata: TemplateMetadata) {
            let template_id = self.templates_count.read();
            self.templates.write(template_id, template_metadata);
            self.templates_count.write(template_id + 1);
            self.emit(TemplateAdded { id: template_id, metadata: template_metadata });
        }

        fn is_template_complete(self: @ComponentState<TContractState>, template_id: u32) -> bool {
            return self.completed_templates.read(template_id);
        }
    }
}
