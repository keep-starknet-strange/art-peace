#[starknet::interface]
trait IPixelQuest<TContractState> {
    fn is_claimed(self: @TContractState, user: starknet::ContractAddress) -> bool;
    fn get_pixels_needed(self: @TContractState) -> u32;
    fn is_daily(self: @TContractState) -> bool;
    fn claim_day(self: @TContractState) -> u32;
}

#[starknet::contract]
mod PixelQuest {
    use starknet::{ContractAddress, get_caller_address};
    use art_peace::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use art_peace::quests::{IQuest, QuestClaimed};
    use super::IPixelQuest;

    #[storage]
    struct Storage {
        art_peace: IArtPeaceDispatcher,
        reward: u32,
        claimed: LegacyMap<ContractAddress, bool>,
        pixels_needed: u32,
        is_daily: bool,
        // The day idx the quest can be claimed ( if daily )
        claim_day: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        QuestClaimed: QuestClaimed,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        art_peace: ContractAddress,
        reward: u32,
        pixels_needed: u32,
        is_daily: bool,
        claim_day: u32
    ) {
        self.art_peace.write(IArtPeaceDispatcher { contract_address: art_peace });
        self.reward.write(reward);
        self.pixels_needed.write(pixels_needed);
        self.is_daily.write(is_daily);
        self.claim_day.write(claim_day);
    }

    #[abi(embed_v0)]
    impl PixelQuestImpl of IPixelQuest<ContractState> {
        fn is_claimed(self: @ContractState, user: ContractAddress) -> bool {
            return self.claimed.read(user);
        }

        fn get_pixels_needed(self: @ContractState) -> u32 {
            return self.pixels_needed.read();
        }

        fn is_daily(self: @ContractState) -> bool {
            return self.is_daily.read();
        }

        fn claim_day(self: @ContractState) -> u32 {
            return self.claim_day.read();
        }
    }

    // TODO: Test all
    #[abi(embed_v0)]
    impl PixelQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            return self.reward.read();
        }

        fn is_claimable(self: @ContractState, user: ContractAddress) -> bool {
            let art_peace = self.art_peace.read();
            if self.claimed.read(user) {
                return false;
            }
            if self.is_daily.read() {
                // Daily Pixel Quest
                let day = art_peace.get_day();
                if day != self.claim_day.read() {
                    return false;
                }
                let placement_count = art_peace.get_user_pixels_placed_day(user, day);
                return placement_count >= self.pixels_needed.read();
            } else {
                // Main Pixel Quest
                let placement_count = art_peace.get_user_pixels_placed(user);
                return placement_count >= self.pixels_needed.read();
            }
        }

        fn claim(ref self: ContractState, user: ContractAddress) -> u32 {
            assert(
                get_caller_address() == self.art_peace.read().contract_address,
                'Only ArtPeace can claim quests'
            );
            if !self.is_claimable(user) {
                return 0;
            }

            self.claimed.write(user, true);
            let reward = self.reward.read();
            self.emit(QuestClaimed { user: user, reward: reward });
            return reward;
        }
    }
}
