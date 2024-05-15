#[starknet::contract]
pub mod PixelQuest {
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::quests::{IQuest, IPixelQuest};

    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        art_peace: IArtPeaceDispatcher,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
        pixels_needed: u32,
        // Quest types
        is_daily: bool, // If the quest is a daily quest
        // The day idx the quest can be claimed ( if daily )
        claim_day: u32,
        is_color: bool, // If the quest is for a specific color
        color: u8,
    }

    #[derive(Drop, Serde)]
    pub struct PixelQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
        pub pixels_needed: u32,
        pub is_daily: bool,
        pub claim_day: u32,
        pub is_color: bool,
        pub color: u8,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: PixelQuestInitParams) {
        self.art_peace.write(IArtPeaceDispatcher { contract_address: init_params.art_peace });
        self.reward.write(init_params.reward);
        self.pixels_needed.write(init_params.pixels_needed);
        self.is_daily.write(init_params.is_daily);
        self.claim_day.write(init_params.claim_day);
        self.is_color.write(init_params.is_color);
        self.color.write(init_params.color);
    }

    #[abi(embed_v0)]
    impl PixelQuestImpl of IPixelQuest<ContractState> {
        fn is_claimed(self: @ContractState, user: ContractAddress) -> bool {
            self.claimed.read(user)
        }

        fn get_pixels_needed(self: @ContractState) -> u32 {
            self.pixels_needed.read()
        }

        fn is_daily(self: @ContractState) -> bool {
            self.is_daily.read()
        }

        fn claim_day(self: @ContractState) -> u32 {
            self.claim_day.read()
        }

        fn is_color(self: @ContractState) -> bool {
            return self.is_color.read();
        }

        fn color(self: @ContractState) -> u8 {
            return self.color.read();
        }
    }

    #[abi(embed_v0)]
    impl PixelQuest of IQuest<ContractState> {
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

            // Daily Pixel Quest
            if self.is_daily.read() {
                let day = art_peace.get_day();
                if day != self.claim_day.read() {
                    return false;
                }

                if self.is_color.read() {
                    let placement_count = art_peace
                        .get_user_pixels_placed_day_color(user, day, self.color.read());
                    return placement_count >= self.pixels_needed.read();
                } else { // Daily Pixel Quest
                    let placement_count = art_peace.get_user_pixels_placed_day(user, day);
                    return placement_count >= self.pixels_needed.read();
                }
            } // Main Pixel Quest
            else {
                if self.is_color.read() {
                    let placement_count = art_peace
                        .get_user_pixels_placed_color(user, self.color.read());
                    return placement_count >= self.pixels_needed.read();
                } else {
                    let placement_count = art_peace.get_user_pixels_placed(user);
                    return placement_count >= self.pixels_needed.read();
                }
            }
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            assert(
                get_caller_address() == self.art_peace.read().contract_address,
                'Only ArtPeace can claim quests'
            );

            assert(self.is_claimable(user, calldata), 'Quest not claimable');

            self.claimed.write(user, true);
            let reward = self.reward.read();

            reward
        }
    }
}
