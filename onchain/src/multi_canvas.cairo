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
    fn place_pixel_xy(
        ref self: TContractState, canvas_id: u32, x: u128, y: u128, color: u8, now: u64
    );
    fn favorite_canvas(ref self: TContractState, canvas_id: u32);
    fn unfavorite_canvas(ref self: TContractState, canvas_id: u32);
    fn get_stencil_count(self: @TContractState, canvas_id: u32) -> u32;
    fn get_stencil(
        self: @TContractState, canvas_id: u32, stencil_id: u32
    ) -> MultiCanvas::StencilMetadata;
    fn add_stencil(
        ref self: TContractState, canvas_id: u32, stencil: MultiCanvas::StencilMetadata
    ) -> u32;
    fn remove_stencil(ref self: TContractState, canvas_id: u32, stencil_id: u32);
    fn favorite_stencil(ref self: TContractState, canvas_id: u32, stencil_id: u32);
    fn unfavorite_stencil(ref self: TContractState, canvas_id: u32, stencil_id: u32);
}

// TODO: Move to factory contract
#[starknet::contract]
pub mod MultiCanvas {
    use core::starknet::{get_caller_address, ContractAddress};

    const MIN_COLOR_COUNT: u32 = 2;
    const MAX_COLOR_COUNT: u32 = 25;
    const MIN_SIZE: u128 = 16;
    const MAX_SIZE: u128 = 1024;
    const MIN_STENCIL_SIZE: u128 = 5;
    const MAX_STENCIL_SIZE: u128 = 256;

    #[derive(Drop, Serde)]
    pub struct CanvasInitParams {
        pub host: ContractAddress,
        pub name: felt252,
        pub unique_name: felt252,
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
        unique_name: felt252,
        width: u128,
        height: u128,
        start_time: u64,
        end_time: u64,
    }

    #[derive(Drop, Clone, Serde, starknet::Store)]
    pub struct StencilMetadata {
        hash: felt252,
        width: u128,
        height: u128,
        position: u128
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
        // Maps: (canvas_id, user addr) -> if favorited
        canvas_favorites: LegacyMap::<(u32, ContractAddress), bool>,
        // Maps: unique_name -> is taken
        unique_names: LegacyMap::<felt252, bool>,
        // Map: canvas_id -> stencil count
        stencil_counts: LegacyMap::<u32, u32>,
        // Map: (canvas_id, stencil_id) -> stencil metadata
        stencils: LegacyMap::<(u32, u32), StencilMetadata>,
        // Maps: (canvas_id, stencil_id, user addr) -> if favorited
        stencil_favorites: LegacyMap::<(u32, u32, ContractAddress), bool>
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
        CanvasFavorited: CanvasFavorited,
        CanvasUnfavorited: CanvasUnfavorited,
        StencilAdded: StencilAdded,
        StencilRemoved: StencilRemoved,
        StencilFavorited: StencilFavorited,
        StencilUnfavorited: StencilUnfavorited,
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

    #[derive(Drop, starknet::Event)]
    pub struct CanvasFavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CanvasUnfavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilAdded {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        pub stencil: StencilMetadata,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilRemoved {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        pub stencil: StencilMetadata,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilFavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilUnfavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        #[key]
        pub user: ContractAddress,
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
            assert(init_params.start_time < init_params.end_time, 'Invalid time range');
            assert(!self.unique_names.read(init_params.unique_name), 'Unique name already taken');
            assert(validate_unique_name(init_params.unique_name), 'Invalid unique name');
            let canvas_id = self.canvas_count.read();
            self
                .canvases
                .write(
                    canvas_id,
                    CanvasMetadata {
                        name: init_params.name,
                        unique_name: init_params.unique_name,
                        width: init_params.width,
                        height: init_params.height,
                        start_time: init_params.start_time,
                        end_time: init_params.end_time,
                    }
                );
            self.hosts.write(canvas_id, init_params.host);
            self.time_between_pixels.write(canvas_id, init_params.time_between_pixels);
            let color_count = init_params.color_palette.len().try_into().unwrap();
            self.color_counts.write(canvas_id, color_count);
            let mut i: u8 = 0;
            while i < color_count {
                self.color_palettes.write((canvas_id, i), *init_params.color_palette.at(i.into()));
                self
                    .emit(
                        CanvasColorAdded {
                            canvas_id, color_key: i, color: *init_params.color_palette.at(i.into())
                        }
                    );
                i += 1;
            };
            self.canvas_count.write(canvas_id + 1);
            self.unique_names.write(init_params.unique_name, true);

            // Auto-favorite the canvas for the creator
            let caller = get_caller_address();
            self.canvas_favorites.write((canvas_id, caller), true);
            self.emit(Event::CanvasFavorited(CanvasFavorited { canvas_id, user: caller }));

            // Emit canvas created event
            self.emit(CanvasCreated { canvas_id, init_params });

            // Auto-favorite the canvas for the creator
            let caller = get_caller_address();
            self.canvas_favorites.write((canvas_id, caller), true);
            self.emit(Event::CanvasFavorited(CanvasFavorited { canvas_id, user: caller }));
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

        fn get_last_placed_time(
            self: @ContractState, canvas_id: u32, user: ContractAddress
        ) -> u64 {
            self.last_placed_times.read((canvas_id, user))
        }

        fn get_time_between_pixels(self: @ContractState, canvas_id: u32) -> u64 {
            self.time_between_pixels.read(canvas_id)
        }

        fn set_time_between_pixels(
            ref self: ContractState, canvas_id: u32, time_between_pixels: u64
        ) {
            let caller = get_caller_address();
            assert(caller == self.hosts.read(canvas_id), 'Only host can change timer');
            let old_time = self.time_between_pixels.read(canvas_id);
            self.time_between_pixels.write(canvas_id, time_between_pixels);
            self
                .emit(
                    CanvasTimeBetweenPixelsChanged {
                        canvas_id, old_time, new_time: time_between_pixels
                    }
                );
        }

        fn award_user(
            ref self: ContractState, canvas_id: u32, user: ContractAddress, amount: u32
        ) { // TODO
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
                now
                    - self
                        .last_placed_times
                        .read((canvas_id, caller)) >= self
                        .time_between_pixels
                        .read(canvas_id),
                'Pixel not available'
            );

            place_basic_pixel_inner(ref self, canvas_id, pos, color, now);
        }

        fn place_pixel_xy(
            ref self: ContractState, canvas_id: u32, x: u128, y: u128, color: u8, now: u64
        ) {
            let pos = x + y * self.canvases.read(canvas_id).width;
            self.place_pixel(canvas_id, pos, color, now);
        }

        fn favorite_canvas(ref self: ContractState, canvas_id: u32) {
            let caller = get_caller_address();
            if self.canvas_favorites.read((canvas_id, caller)) {
                return;
            }
            self.canvas_favorites.write((canvas_id, caller), true);
            self.emit(Event::CanvasFavorited(CanvasFavorited { canvas_id, user: caller, }));
        }

        fn unfavorite_canvas(ref self: ContractState, canvas_id: u32) {
            let caller = get_caller_address();
            if !self.canvas_favorites.read((canvas_id, caller)) {
                return;
            }
            self.canvas_favorites.write((canvas_id, caller), false);
            self.emit(Event::CanvasUnfavorited(CanvasUnfavorited { canvas_id, user: caller, }));
        }

        fn get_stencil_count(self: @ContractState, canvas_id: u32) -> u32 {
            self.stencil_counts.read(canvas_id)
        }

        fn get_stencil(self: @ContractState, canvas_id: u32, stencil_id: u32) -> StencilMetadata {
            self.stencils.read((canvas_id, stencil_id))
        }

        fn add_stencil(ref self: ContractState, canvas_id: u32, stencil: StencilMetadata) -> u32 {
            let stencil_id = self.stencil_counts.read(canvas_id);
            assert(stencil.width >= MIN_STENCIL_SIZE, 'Stencil too small');
            assert(stencil.height >= MIN_STENCIL_SIZE, 'Stencil too small');
            assert(stencil.width <= MAX_STENCIL_SIZE, 'Stencil too large');
            assert(stencil.height <= MAX_STENCIL_SIZE, 'Stencil too large');
            self.stencils.write((canvas_id, stencil_id), stencil.clone());
            self.stencil_counts.write(canvas_id, stencil_id + 1);

            // Auto-favorite the stencil for the creator
            let caller = get_caller_address();
            self.stencil_favorites.write((canvas_id, stencil_id, caller), true);
            self.emit(StencilFavorited { canvas_id, stencil_id, user: caller });

            // Emit the stencil added event
            self.emit(StencilAdded { canvas_id, stencil_id, stencil });

            // Auto-favorite the stencil for the creator
            let caller = get_caller_address();
            self.stencil_favorites.write((canvas_id, stencil_id, caller), true);
            self.emit(StencilFavorited { canvas_id, stencil_id, user: caller });

            stencil_id
        }

        fn remove_stencil(ref self: ContractState, canvas_id: u32, stencil_id: u32) {
            let caller = get_caller_address();
            assert(caller == self.hosts.read(canvas_id), 'Only host can remove stencils');
            let stencil = self.stencils.read((canvas_id, stencil_id));
            self.emit(StencilRemoved { canvas_id, stencil_id, stencil });
        }

        fn favorite_stencil(ref self: ContractState, canvas_id: u32, stencil_id: u32) {
            let caller = get_caller_address();
            if self.stencil_favorites.read((canvas_id, stencil_id, caller)) {
                return;
            }
            self.stencil_favorites.write((canvas_id, stencil_id, caller), true);
            self.emit(StencilFavorited { canvas_id, stencil_id, user: caller });
        }

        fn unfavorite_stencil(ref self: ContractState, canvas_id: u32, stencil_id: u32) {
            let caller = get_caller_address();
            if !self.stencil_favorites.read((canvas_id, stencil_id, caller)) {
                return;
            }
            self.stencil_favorites.write((canvas_id, stencil_id, caller), false);
            self.emit(StencilUnfavorited { canvas_id, stencil_id, user: caller });
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
    fn place_basic_pixel_inner(
        ref self: ContractState, canvas_id: u32, pos: u128, color: u8, now: u64
    ) {
        place_pixel_inner(ref self, canvas_id, pos, color);
        let caller = starknet::get_caller_address();
        self.last_placed_times.write((canvas_id, caller), now);
        self.emit(CanvasBasicPixelPlaced { canvas_id, placed_by: caller, timestamp: now });
    }

    fn char_is_number(char: u256) -> bool {
        char >= '0' && char <= '9'
    }

    fn char_is_lowercase_letter(char: u256) -> bool {
        char >= 'a' && char <= 'z'
    }

    fn char_is_valid(char: u256) -> bool {
        // Check unique_name only contains: a-z, 0-9, -, _
        char_is_number(char) || char_is_lowercase_letter(char) || char == '-' || char == '_'
    }

    fn validate_unique_name(unique_name: felt252) -> bool {
        let mut temp: u256 = unique_name.into();
        let mut result = true;
        while temp > 0 {
            let char = temp % 256;
            if !char_is_valid(char) {
                result = false;
                break;
            }
            temp /= 256;
        };
        result
    }
// TODO: Extra pixels
}
