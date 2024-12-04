use core::starknet::{ContractAddress};

#[starknet::interface]
pub trait ICanvas<TContractState> {
    fn get_host(self: @TContractState) -> ContractAddress;
    fn set_host(ref self: TContractState, host: ContractAddress);
    fn get_name(self: @TContractState) -> felt252;
    fn get_width(self: @TContractState) -> u128;
    fn get_height(self: @TContractState) -> u128;
    fn get_last_placed_time(self: @TContractState, user: ContractAddress) -> u64;
    fn get_time_between_pixels(self: @TContractState) -> u64;
    fn set_time_between_pixels(ref self: TContractState, time_between_pixels: u64);
    fn award_user(ref self: TContractState, user: ContractAddress, amount: u32);
    fn get_color_count(self: @TContractState) -> u8;
    fn get_colors(self: @TContractState) -> Array<u32>;
    fn get_start_time(self: @TContractState) -> u64;
    fn get_end_time(self: @TContractState) -> u64;
    // TODO: set_end_time function
    fn check_game_running(self: @TContractState);
    fn check_valid_pixel(self: @TContractState, pos: u128, color: u8);
    fn check_timing(self: @TContractState, now: u64);
    fn place_pixel(ref self: TContractState, pos: u128, color: u8, now: u64);
    fn place_pixel_xy(ref self: TContractState, x: u128, y: u128, color: u8, now: u64);
}

#[starknet::contract]
pub mod Canvas {
    use core::starknet::{get_caller_address, ContractAddress};

    const MAX_COLOR_COUNT: u32 = 25;
    const MAX_WIDTH: u128 = 1024;
    const MAX_HEIGHT: u128 = 1024;

    #[storage]
    struct Storage {
        host: ContractAddress,
        name: felt252,
        width: u128,
        height: u128,
        // Map: user's address -> last time they placed a pixel
        last_placed_time: LegacyMap::<ContractAddress, u64>,
        time_between_pixels: u64,
        // Map: user's address -> amount of extra pixels they have
        extra_pixels: LegacyMap::<ContractAddress, u32>,
        color_count: u8,
        // Map: color index -> color value in RGBA
        color_palette: LegacyMap::<u8, u32>,
        start_time: u64,
        end_time: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ColorAdded: ColorAdded,
        PixelPlaced: PixelPlaced,
        BasicPixelPlaced: BasicPixelPlaced,
        ExtraPixelsPlaced: ExtraPixelsPlaced,
        HostAwardedUser: HostAwardedUser,
    }

    #[derive(Drop, starknet::Event)]
    struct ColorAdded {
        #[key]
        color_key: u8,
        color: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct PixelPlaced {
        #[key]
        placed_by: ContractAddress,
        #[key]
        pos: u128,
        // #[key]
        // day: u32,
        color: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct BasicPixelPlaced {
        #[key]
        placed_by: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct ExtraPixelsPlaced {
        #[key]
        placed_by: ContractAddress,
        extra_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct HostAwardedUser {
        #[key]
        user: ContractAddress,
        amount: u32,
    }

    #[derive(Drop, Serde)]
    pub struct InitParams {
        pub host: ContractAddress,
        pub name: felt252,
        pub width: u128,
        pub height: u128,
        pub time_between_pixels: u64,
        pub color_palette: Span<u32>,
        pub start_time: u64,
        pub end_time: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams) {
        self.host.write(init_params.host);
        self.name.write(init_params.name);
        assert(init_params.width <= MAX_WIDTH, 'Width too large');
        self.width.write(init_params.width);
        assert(init_params.height <= MAX_HEIGHT, 'Height too large');
        self.height.write(init_params.height);
        self.time_between_pixels.write(init_params.time_between_pixels);
        assert(init_params.color_palette.len() <= MAX_COLOR_COUNT, 'Too many colors');
        let color_count = init_params.color_palette.len().try_into().unwrap();
        self.color_count.write(color_count);
        let mut i = 0;
        while i < color_count {
            self.color_palette.write(i, *init_params.color_palette.at(i.into()));
            self.emit(ColorAdded { color_key: i, color: *init_params.color_palette.at(i.into()) });
            i += 1;
        };
        self.start_time.write(init_params.start_time);
        self.end_time.write(init_params.end_time);
    }

    #[abi(embed_v0)]
    impl CanvasImpl of super::ICanvas<ContractState> {
        fn get_host(self: @ContractState) -> ContractAddress {
            self.host.read()
        }

        fn set_host(ref self: ContractState, host: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.host.read(), 'Only host can change host');
            self.host.write(host);
        }

        fn get_name(self: @ContractState) -> felt252 {
            self.name.read()
        }

        fn get_width(self: @ContractState) -> u128 {
            self.width.read()
        }

        fn get_height(self: @ContractState) -> u128 {
            self.height.read()
        }

        fn get_last_placed_time(self: @ContractState, user: ContractAddress) -> u64 {
            self.last_placed_time.read(user)
        }

        fn get_time_between_pixels(self: @ContractState) -> u64 {
            self.time_between_pixels.read()
        }

        fn set_time_between_pixels(ref self: ContractState, time_between_pixels: u64) {
            let caller = get_caller_address();
            assert(caller == self.host.read(), 'Only host can change timer');
            self.time_between_pixels.write(time_between_pixels);
        }

        fn award_user(ref self: ContractState, user: ContractAddress, amount: u32) {
            let caller = get_caller_address();
            assert(caller == self.host.read(), 'Only host can award users');
            self.extra_pixels.write(user, self.extra_pixels.read(user) + amount);
            self.emit(HostAwardedUser { user, amount });
        }

        fn get_color_count(self: @ContractState) -> u8 {
            self.color_count.read()
        }

        fn get_colors(self: @ContractState) -> Array<u32> {
            let color_count = self.color_count.read();
            let mut colors = array![];
            let mut i = 0;
            while i < color_count {
                colors.append(self.color_palette.read(i));
                i += 1;
            };
            colors
        }

        fn get_start_time(self: @ContractState) -> u64 {
            self.start_time.read()
        }

        fn get_end_time(self: @ContractState) -> u64 {
            self.end_time.read()
        }

        fn check_game_running(self: @ContractState) {
            let block_timestamp = starknet::get_block_timestamp();
            assert(block_timestamp <= self.end_time.read(), 'This canvas\'s game has ended');
        }

        fn check_valid_pixel(self: @ContractState, pos: u128, color: u8) {
            let total_pixels = self.width.read() * self.height.read();
            assert(pos < total_pixels, 'Position out of bounds');
            assert(color < self.color_count.read(), 'Color out of bounds');
        }

        fn check_timing(self: @ContractState, now: u64) {
            let block_timestamp = starknet::get_block_timestamp();
            // TODO: To config?
            let leanience_margin = 20; // 20 seconds
            let expected_block_time = 30; // 30 seconds
            assert(now >= block_timestamp - leanience_margin, 'Timestamp too far behind');
            assert(now <= block_timestamp + 2 * expected_block_time, 'Timestamp too far ahead');
        }

        fn place_pixel(ref self: ContractState, pos: u128, color: u8, now: u64) {
            self.check_game_running();
            self.check_timing(now);
            let caller = starknet::get_caller_address();
            assert(
                now - self.last_placed_time.read(caller) >= self.time_between_pixels.read(),
                'Pixel not available'
            );

            place_basic_pixel_inner(ref self, pos, color, now);
        }

        fn place_pixel_xy(ref self: ContractState, x: u128, y: u128, color: u8, now: u64) {
            let pos = x + y * self.width.read();
            self.place_pixel(pos, color, now);
        }
    }

    fn place_pixel_inner(ref self: ContractState, pos: u128, color: u8) {
        self.check_valid_pixel(pos, color);

        let caller = starknet::get_caller_address();
        // TODO: let pixel = Pixel { color, owner: caller };
        // TODO: self.canvas.write(pos, pixel);                                                     let day = self.day_index.read();
        // self
        //     .user_pixels_placed
        //     .write((day, caller, color), self.user_pixels_placed.read((day, caller, color)) + 1);
        // TODO: Optimize?
        self.emit(PixelPlaced { placed_by: caller, pos, color });
    }

    // TODO: Make the function internal
    fn place_basic_pixel_inner(ref self: ContractState, pos: u128, color: u8, now: u64) {
        place_pixel_inner(ref self, pos, color);
        let caller = starknet::get_caller_address();
        self.last_placed_time.write(caller, now);
        self.emit(BasicPixelPlaced { placed_by: caller, timestamp: now });
    }
}

