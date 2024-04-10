#[derive(Drop, Serde, starknet::Store)]
pub struct Pixel {
    // Color index in the palette
    color: u8,
    // The person that placed the pixel
    owner: starknet::ContractAddress,
}

// TODO: Tests for all
// TODO: Split into components : existing w/ canvas and user info, quests, stats, etc.
#[starknet::interface]
pub trait IArtPeace<TContractState> {
    // Get canvas info
    fn get_pixel(self: @TContractState, pos: u128) -> Pixel;
    fn get_pixel_color(self: @TContractState, pos: u128) -> u8;
    fn get_pixel_owner(self: @TContractState, pos: u128) -> starknet::ContractAddress;
    fn get_pixel_xy(self: @TContractState, x: u128, y: u128) -> Pixel;
    fn get_width(self: @TContractState) -> u128;
    fn get_height(self: @TContractState) -> u128;
    fn get_total_pixels(self: @TContractState) -> u128;

    // Place pixels on the canvas
    fn place_pixel(ref self: TContractState, pos: u128, color: u8);
    fn place_pixel_xy(ref self: TContractState, x: u128, y: u128, color: u8);
    fn place_extra_pixels(ref self: TContractState, positions: Array<u128>, colors: Array<u8>);

    // Get placement info
    fn get_last_placed_time(self: @TContractState) -> u64;
    fn get_user_last_placed_time(self: @TContractState, user: starknet::ContractAddress) -> u64;
    fn get_time_between_pixels(self: @TContractState) -> u64;
    fn get_extra_pixels_count(self: @TContractState) -> u32;
    fn get_user_extra_pixels_count(self: @TContractState, user: starknet::ContractAddress) -> u32;

    // Get color info
    fn get_color_count(self: @TContractState) -> u8;
    fn get_colors(self: @TContractState) -> Array<u32>;

    // Get timing info
    fn get_creation_time(self: @TContractState) -> u64;
    fn get_end_time(self: @TContractState) -> u64;
    fn get_day(self: @TContractState) -> u32;

    // Start a new day
    fn increase_day_index(ref self: TContractState);

    // Get quest info
    fn get_daily_quest_count(self: @TContractState) -> core::zeroable::NonZero::<u32>;
    fn get_daily_quest(
        self: @TContractState, day_index: u32, quest_id: u32
    ) -> starknet::ContractAddress;
    fn get_days_quests(self: @TContractState, day_index: u32) -> Span<starknet::ContractAddress>;
    fn get_today_quests(self: @TContractState) -> Span<starknet::ContractAddress>;

    fn get_main_quest_count(self: @TContractState) -> u32;
    fn get_main_quest(self: @TContractState, quest_id: u32) -> starknet::ContractAddress;
    fn get_main_quests(self: @TContractState) -> Span<starknet::ContractAddress>;

    // Claim quests
    fn claim_daily_quest(ref self: TContractState, day_index: u32, quest_id: u32);
    fn claim_today_quest(ref self: TContractState, quest_id: u32);
    fn claim_main_quest(ref self: TContractState, quest_id: u32);

    // Stats
    fn get_user_pixels_placed(self: @TContractState, user: starknet::ContractAddress) -> u32;
    fn get_user_pixels_placed_day(
        self: @TContractState, user: starknet::ContractAddress, day: u32
    ) -> u32;
    fn get_user_pixels_placed_day_color(
        self: @TContractState, user: starknet::ContractAddress, day: u32, color: u8
    ) -> u32;
}
