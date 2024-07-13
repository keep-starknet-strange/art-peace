#[starknet::contract]
pub mod UnruggableQuest {
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::quests::{
        IQuest, IUnruggableQuest, IUnruggableMemecoinDispatcher, IUnruggableMemecoinDispatcherTrait
    };

    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
    }

    #[derive(Drop, Serde)]
    pub struct UnruggableQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: UnruggableQuestInitParams) {
        self.art_peace.write(init_params.art_peace);
        self.reward.write(init_params.reward);
    }

    #[abi(embed_v0)]
    impl UnruggableQuestImpl of IUnruggableQuest<ContractState> {
        fn is_claimed(self: @ContractState, user: ContractAddress) -> bool {
            self.claimed.read(user)
        }
    }

    #[abi(embed_v0)]
    impl UnruggableQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let coin_address_as_felt252: felt252 = *calldata.at(0);
            let coin = IUnruggableMemecoinDispatcher {
                contract_address: coin_address_as_felt252.try_into().unwrap()
            };

            if coin.is_launched() != true {
                return false;
            }

            true
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

