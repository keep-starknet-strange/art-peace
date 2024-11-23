use core::starknet::{ContractAddress};

#[starknet::interface]
pub trait IMultiCanvas<TContractState> {
    fn get_game_master(self: @TContractState) -> ContractAddress;
    fn set_game_master(ref self: TContractState, game_master: ContractAddress);
    fn get_canvas_count(self: @TContractState) -> u32;
    fn get_canvas(self: @TContractState, canvas_id: u32) -> MultiCanvas::CanvasMetadata;
    fn create_canvas(ref self: TContractState, init_params: MultiCanvas::CanvasInitParams) -> u32;
    fn get_host(self: @TContractState, canvas_id: u32) -> ContractAddress;
    fn set_host(ref self: TContractState, canvas_id: u32, host: ContractAddress);
    fn get_name(self: @TContractState, canvas_id: u32) -> felt252;
    fn get_width(self: @TContractState, canvas_id: u32) -> u128;
    fn get_height(self: @TContractState, canvas_id: u32) -> u128;
    fn get_last_placed_time(self: @TContractState, canvas_id: u32, user: ContractAddress) -> u64;
    fn get_time_between_pixels(self: @TContractState, canvas_id: u32) -> u64;
    fn set_time_between_pixels(ref self: TContractState, canvas_id: u32, time_between_pixels: u64);
    fn award_user(ref self: TContractState, canvas_id: u32, user: ContractAddress, amount: u32);
    fn get_color_count(self: @TContractState, canvas_id: u32) -> u8;
    fn get_colors(self: @TContractState, canvas_id: u32) -> Span<u32>;
    fn get_start_time(self: @TContractState, canvas_id: u32) -> u64;
    fn get_end_time(self: @TContractState, canvas_id: u32) -> u64;
    // TODO: add_color function
    // TODO: set_end_time function
    fn check_game_running(self: @TContractState, canvas_id: u32);
    fn check_valid_pixel(self: @TContractState, canvas_id: u32, pos: u128, color: u8);
    fn check_timing(self: @TContractState, now: u64);
    fn place_pixel(ref self: TContractState, canvas_id: u32, pos: u128, color: u8, now: u64);
    fn place_pixel_xy(ref self: TContractState, canvas_id: u32, x: u128, y: u128, color: u8, now: u64);
}

// TODO: Move to factory contract
#[starknet::contract]
pub mod MultiCanvas {
    use core::starknet::{get_caller_address, ContractAddress};

    const MIN_COLOR_COUNT: u32 = 2;
    const MAX_COLOR_COUNT: u32 = 25;
    const MIN_SIZE: u128 = 16;
    const MAX_SIZE: u128 = 1024;

    #[derive(Drop, Serde)]
    pub struct CanvasInitParams {
        pub host: ContractAddress,
        pub name: felt252,
        pub width: u128,
        pub height: u128,
        pub time_between_pixels: u64,
        pub color_palette: Span<u32>,
        pub start_time: u64,
        pub end_time: u64,
    }
    
    #[derive(Drop, Serde, starknet::Store)]
    pub struct CanvasMetadata {
        name: felt252,
        width: u128,
        height: u128,
        start_time: u64,
        end_time: u64,
    }
    
    #[storage]
    struct Storage {
        // TODO: Game master to host & control extra pixels & ...
        game_master: ContractAddress,
        canvas_count: u32,
        // Map: canvas_id -> canvas metadata
        canvases: LegacyMap::<u32, CanvasMetadata>,
        // Map: canvas_id -> host address
        hosts: LegacyMap::<u32, ContractAddress>,
        // Map: (canvas_id, user's address) -> last time they placed a pixel
        last_placed_times: LegacyMap::<(u32, ContractAddress), u64>,
        // Map: canvas_id -> time between pixels
        time_between_pixels: LegacyMap::<u32, u64>,
        // Map: (canvas_id, user's address) -> amount of extra pixels they have
        extra_pixels: LegacyMap::<(u32, ContractAddress), u32>,
        // Map: canvas_id -> color count
        color_counts: LegacyMap::<u32, u8>,
        // Map: (canvas_id, color_id) -> color value in RGBA
        color_palettes: LegacyMap::<(u32, u8), u32>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CanvasCreated: CanvasCreated,
        CanvasHostChanged: CanvasHostChanged,
        CanvasTimeBetweenPixelsChanged: CanvasTimeBetweenPixelsChanged,
        CanvasColorAdded: CanvasColorAdded,
        CanvasPixelPlaced: CanvasPixelPlaced,
        CanvasBasicPixelPlaced: CanvasBasicPixelPlaced,
        // TODO: Extra pixels place do
        CanvasExtraPixelsPlaced: CanvasExtraPixelsPlaced,
        CanvasHostAwardedUser: CanvasHostAwardedUser,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasCreated {
        #[key]
        canvas_id: u32,
        init_params: CanvasInitParams,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasHostChanged {
        #[key]
        canvas_id: u32,
        old_host: ContractAddress,
        new_host: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasTimeBetweenPixelsChanged {
        #[key]
        canvas_id: u32,
        old_time: u64,
        new_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasColorAdded {
        #[key]
        canvas_id: u32,
        #[key]
        color_key: u8,
        color: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasPixelPlaced {
        #[key]
        canvas_id: u32,
        #[key]
        placed_by: ContractAddress,
        #[key]
        pos: u128,
        color: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasBasicPixelPlaced {
        #[key]
        canvas_id: u32,
        #[key]
        placed_by: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasExtraPixelsPlaced {
        #[key]
        canvas_id: u32,
        #[key]
        placed_by: ContractAddress,
        extra_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasHostAwardedUser {
        #[key]
        canvas_id: u32,
        #[key]
        user: ContractAddress,
        amount: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, game_master: ContractAddress) {
        self.game_master.write(game_master);
        self.canvas_count.write(0);
    }

    #[abi(embed_v0)]
    impl MultiCanvasImpl of super::IMultiCanvas<ContractState> {
        fn get_game_master(self: @ContractState) -> ContractAddress {
            self.game_master.read()
        }

        fn set_game_master(ref self: ContractState, game_master: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can change');
            self.game_master.write(game_master);
        }

        fn get_canvas_count(self: @ContractState) -> u32 {
            self.canvas_count.read()
        }

        fn get_canvas(self: @ContractState, canvas_id: u32) -> CanvasMetadata {
            self.canvases.read(canvas_id)
        }

        fn create_canvas(ref self: ContractState, init_params: CanvasInitParams) -> u32 {
            assert(init_params.width >= MIN_SIZE, 'Width too small');
            assert(init_params.height >= MIN_SIZE, 'Height too small');
            assert(init_params.width <= MAX_SIZE, 'Width too large');
            assert(init_params.height <= MAX_SIZE, 'Height too large');
            assert(init_params.color_palette.len() >= MIN_COLOR_COUNT, 'Too few colors');
            assert(init_params.color_palette.len() <= MAX_COLOR_COUNT, 'Too many colors');
            let canvas_id = self.canvas_count.read();
            self.canvases.write(canvas_id, CanvasMetadata {
                name: init_params.name,
                width: init_params.width,
                height: init_params.height,
                start_time: init_params.start_time,
                end_time: init_params.end_time,
            });
            self.hosts.write(canvas_id, init_params.host);
            self.time_between_pixels.write(canvas_id, init_params.time_between_pixels);
            let color_count = init_params.color_palette.len().try_into().unwrap();
            self.color_counts.write(canvas_id, color_count);
            let mut i: u8 = 0;
            while i < color_count {
                self.color_palettes.write((canvas_id, i), *init_params.color_palette.at(i.into()));
                self.emit(CanvasColorAdded { canvas_id, color_key: i, color: *init_params.color_palette.at(i.into()) });
                i += 1;
            };
            self.canvas_count.write(canvas_id + 1);
            self.emit(CanvasCreated { canvas_id, init_params });
            canvas_id
        }

        fn get_host(self: @ContractState, canvas_id: u32) -> ContractAddress {
            self.hosts.read(canvas_id)
        }

        fn set_host(ref self: ContractState, canvas_id: u32, host: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.hosts.read(canvas_id), 'Only host can change host');
            self.hosts.write(canvas_id, host);
            self.emit(CanvasHostChanged { canvas_id, old_host: caller, new_host: host });
        }

        fn get_name(self: @ContractState, canvas_id: u32) -> felt252 {
            self.canvases.read(canvas_id).name
        }

        fn get_width(self: @ContractState, canvas_id: u32) -> u128 {
            self.canvases.read(canvas_id).width
        }

        fn get_height(self: @ContractState, canvas_id: u32) -> u128 {
            self.canvases.read(canvas_id).height
        }

        fn get_last_placed_time(self: @ContractState, canvas_id: u32, user: ContractAddress) -> u64 {
            self.last_placed_times.read((canvas_id, user))
        }

        fn get_time_between_pixels(self: @ContractState, canvas_id: u32) -> u64 {
            self.time_between_pixels.read(canvas_id)
        }

        fn set_time_between_pixels(ref self: ContractState, canvas_id: u32, time_between_pixels: u64) {
            let caller = get_caller_address();
            assert(caller == self.hosts.read(canvas_id), 'Only host can change timer');
            let old_time = self.time_between_pixels.read(canvas_id);
            self.time_between_pixels.write(canvas_id, time_between_pixels);
            self.emit(CanvasTimeBetweenPixelsChanged { canvas_id, old_time, new_time: time_between_pixels });
        }

        fn award_user(ref self: ContractState, canvas_id: u32, user: ContractAddress, amount: u32) {
            // TODO
            // let caller = get_caller_address();
            // assert(caller == self.hosts.read(canvas_id), 'Only host can award users');
            // self.extra_pixels.write((canvas_id, user), self.extra_pixels.read((canvas_id, user)) + amount);
            // self.emit(CanvasHostAwardedUser { canvas_id, user, amount });
        }

        fn get_color_count(self: @ContractState, canvas_id: u32) -> u8 {
            self.color_counts.read(canvas_id)
        }

        fn get_colors(self: @ContractState, canvas_id: u32) -> Span<u32> {
            let color_count = self.color_counts.read(canvas_id);
            let mut colors = array![];
            let mut i = 0;
            while i < color_count {
                colors.append(self.color_palettes.read((canvas_id, i)));
                i += 1;
            };
            colors.span()
        }

        fn get_start_time(self: @ContractState, canvas_id: u32) -> u64 {
            self.canvases.read(canvas_id).start_time
        }

        fn get_end_time(self: @ContractState, canvas_id: u32) -> u64 {
            self.canvases.read(canvas_id).end_time
        }

        fn check_game_running(self: @ContractState, canvas_id: u32) {
            let block_timestamp = starknet::get_block_timestamp();
            assert(block_timestamp <= self.canvases.read(canvas_id).end_time, 'Game over');
        }

        fn check_valid_pixel(self: @ContractState, canvas_id: u32, pos: u128, color: u8) {
            let canvas = self.canvases.read(canvas_id);
            let total_pixels = canvas.width * canvas.height;
            assert(pos < total_pixels, 'Position out of bounds');
            assert(color < self.color_counts.read(canvas_id), 'Invalid color');
        }

        fn check_timing(self: @ContractState, now: u64) {
            let block_timestamp = starknet::get_block_timestamp();
            // TODO: To config?
            let leanience_margin = 20; // 20 seconds
            let expected_block_time = 30; // 30 seconds
            assert(now >= block_timestamp - leanience_margin, 'Timestamp too far behind');
            assert(now <= block_timestamp + 2 * expected_block_time, 'Timestamp too far ahead');
        }

        fn place_pixel(ref self: ContractState, canvas_id: u32, pos: u128, color: u8, now: u64) {
            self.check_game_running(canvas_id);
            self.check_timing(now);
            let caller = starknet::get_caller_address();
            assert(
                now - self.last_placed_times.read((canvas_id, caller)) >= self.time_between_pixels.read(canvas_id),
                'Pixel not available'                                                                   );

            place_basic_pixel_inner(ref self, canvas_id, pos, color, now);
        }

        fn place_pixel_xy(ref self: ContractState, canvas_id: u32, x: u128, y: u128, color: u8, now: u64) {
            let pos = x + y * self.canvases.read(canvas_id).width;
            self.place_pixel(canvas_id, pos, color, now);
        }
    }

    fn place_pixel_inner(ref self: ContractState, canvas_id: u32, pos: u128, color: u8) {
        self.check_valid_pixel(canvas_id, pos, color);

        let caller = starknet::get_caller_address();
        // TODO: let pixel = Pixel { color, owner: caller };
        // TODO: self.canvas.write(pos, pixel);                                                     let day = self.day_index.read();
        // self
        //     .user_pixels_placed
        //     .write((day, caller, color), self.user_pixels_placed.read((day, caller, color)) + 1);
        // TODO: Optimize?
        self.emit(CanvasPixelPlaced { canvas_id, placed_by: caller, pos, color });
    }

    // TODO: Make the function internal
    fn place_basic_pixel_inner(ref self: ContractState, canvas_id: u32, pos: u128, color: u8, now: u64) {
        place_pixel_inner(ref self, canvas_id, pos, color);
        let caller = starknet::get_caller_address();
        self.last_placed_times.write((canvas_id, caller), now);
        self.emit(CanvasBasicPixelPlaced { canvas_id, placed_by: caller, timestamp: now });
    }

    // TODO: Extra pixels
}