#[starknet::contract]
pub mod UsernameQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::username_store::interfaces::{
        IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait,
    };
    use art_peace::quests::{IQuest};

    #[storage]
    struct Storage {
        username_store: ContractAddress,
        art_peace: ContractAddress,
        reward: u32,
        username: felt252,
        claimed: LegacyMap<ContractAddress, bool>,
    }


    #[derive(Drop, Serde)]
    pub struct UsernameQuestInitParams {
        pub username_store: ContractAddress,
        pub art_peace: ContractAddress,
        pub username: felt252,
        pub reward: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: UsernameQuestInitParams) {
        self.username_store.write(init_params.username_store);
        self.art_peace.write(init_params.art_peace);
        self.username.write(init_params.username);
        self.reward.write(init_params.reward);
    }

    #[abi(embed_v0)]
    impl UsernameQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let username_store_main = IUsernameStoreDispatcher {
                contract_address: self.username_store.read()
            };

            let claim_username: felt252 = username_store_main.get_username(user);

            if claim_username == 0 {
                return true;
            }

            return false;
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            assert(get_caller_address() == self.art_peace.read(), 'Only Username can claim quests');

            assert(self.is_claimable(user, calldata), 'Quest not claimable');

            self.claimed.write(user, true);
            let reward = self.reward.read();

            reward
        }
    }
}