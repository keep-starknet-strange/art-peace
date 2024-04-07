#[starknet::contract]
pub mod ArtPeace {
    use starknet::ContractAddress;
    use art_peace::IArtPeace;
    use art_peace::quests::interface::{IQuestDispatcher, IQuestDispatcherTrait};

    #[storage]
    struct Storage {
        canvas: LegacyMap::<u128, u32>,
        canvas_width: u128,
        canvas_height: u128,
        total_pixels: u128,
        // Maps the users contract address to the last time they placed a pixel
        last_placed_time: LegacyMap::<ContractAddress, u64>,
        time_between_pixels: u64,
        // Maps the users contract address to the amount of extra pixels they have
        extra_pixels: LegacyMap::<ContractAddress, u32>,
        color_count: u32,
        color_palette: LegacyMap::<u32, u32>,
        creation_time: u64,
        end_time: u64,
        day_index: u32,
        max_days: u32,
        // TODO: Optimize index to be a single u128?
        // Maps the (day_index, quest_id) to the quest contract address
        daily_quests: LegacyMap::<(u32, u32), ContractAddress>,
        main_quests_count: u32,
        main_quests: LegacyMap::<u32, ContractAddress>,
        // Maps (user addr, day index) to the amount of pixels placed that day
        user_pixels_placed: LegacyMap::<(ContractAddress, u32), u32>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PixelPlaced: PixelPlaced,
    }

    #[derive(Drop, starknet::Event)]
    struct PixelPlaced {
        #[key]
        placed_by: ContractAddress,
        #[key]
        pos: u128,
        #[key]
        day: u32,
        color: u32,
    }

    #[derive(Drop, Serde)]
    pub struct InitParams {
        pub canvas_width: u128,
        pub canvas_height: u128,
        pub time_between_pixels: u64,
        pub color_palette: Array<u32>,
        pub end_time: u64,
        pub daily_quests: Span<ContractAddress>,
        pub main_quests: Span<ContractAddress>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams,) {
        self.canvas_width.write(init_params.canvas_width);
        self.canvas_height.write(init_params.canvas_height);
        self.total_pixels.write(init_params.canvas_width * init_params.canvas_height);

        self.time_between_pixels.write(init_params.time_between_pixels);

        self.color_count.write(init_params.color_palette.len());
        let mut i = 0;
        while i < init_params
            .color_palette
            .len() {
                self.color_palette.write(i, *init_params.color_palette.at(i));
                i += 1;
            };

        // TODO: To config
        let daily_quests_count = self.get_daily_quest_count();
        self.creation_time.write(starknet::get_block_timestamp());
        self.end_time.write(init_params.end_time);
        self.day_index.write(0);
        // TODO: change name to quest_days?
        let (mut days, rem_quests) = DivRem::div_rem(
            init_params.daily_quests.len(), daily_quests_count
        );
        if rem_quests > 0 {
            days += 1;
        }
        self.max_days.write(days);

        let mut i = 0;
        while i < init_params
            .daily_quests
            .len() {
                let (day_index, quest_id) = DivRem::div_rem(i, daily_quests_count);
                self.daily_quests.write((day_index, quest_id), *init_params.daily_quests.at(i));
                i += 1;
            };

        self.main_quests_count.write(init_params.main_quests.len());
        let mut i = 0;
        while i < init_params
            .main_quests
            .len() {
                self.main_quests.write(i, *init_params.main_quests.at(i));
                i += 1;
            };
    }

    #[abi(embed_v0)]
    impl ArtPeaceImpl of IArtPeace<ContractState> {
        fn get_pixel(self: @ContractState, pos: u128) -> u32 {
            self.canvas.read(pos)
        }

        fn get_pixel_xy(self: @ContractState, x: u128, y: u128) -> u32 {
            let pos = x + y * self.canvas_width.read();
            self.canvas.read(pos)
        }

        fn get_width(self: @ContractState) -> u128 {
            self.canvas_width.read()
        }

        fn get_height(self: @ContractState) -> u128 {
            self.canvas_height.read()
        }

        fn get_total_pixels(self: @ContractState) -> u128 {
            self.total_pixels.read()
        }

        fn place_pixel(ref self: ContractState, pos: u128, color: u32) {
            let now = starknet::get_block_timestamp();
            assert!(now <= self.end_time.read());
            assert!(pos < self.total_pixels.read());
            assert!(color < self.color_count.read());
            // TODO: Use sender not caller?
            let caller = starknet::get_caller_address();
            // TODO: Only if the user has placed a pixel before?
            assert!(now - self.last_placed_time.read(caller) >= self.time_between_pixels.read());
            self.canvas.write(pos, color);
            self.last_placed_time.write(caller, now);
            let day = self.day_index.read();
            self
                .user_pixels_placed
                .write((caller, day), self.user_pixels_placed.read((caller, day)) + 1);
            self.emit(PixelPlaced { placed_by: caller, pos, day, color });
        }

        fn place_pixel_xy(ref self: ContractState, x: u128, y: u128, color: u32) {
            let pos = x + y * self.canvas_width.read();
            self.place_pixel(pos, color);
        }

        fn place_extra_pixels(ref self: ContractState, positions: Array<u128>, colors: Array<u32>) {
            let now = starknet::get_block_timestamp();
            assert!(now <= self.end_time.read());
            let pixel_count = positions.len();
            assert!(pixel_count == colors.len());
            let caller = starknet::get_caller_address();
            let extra_pixels = self.extra_pixels.read(caller);
            assert!(pixel_count <= extra_pixels);
            let color_palette_count = self.color_count.read();
            let total_pixels = self.total_pixels.read();
            let mut i = 0;
            while i < pixel_count {
                let pos = *positions.at(i);
                let color = *colors.at(i);
                assert!(pos < total_pixels);
                assert!(color < color_palette_count);
                self.canvas.write(pos, color);
                i += 1;
            };
            self.extra_pixels.write(caller, extra_pixels - pixel_count);
            let day = self.day_index.read();
            self
                .user_pixels_placed
                .write((caller, day), self.user_pixels_placed.read((caller, day)) + pixel_count);
        //TODO: to extra pixel self.emit(ExtraPixelsPlaced { placed_by: caller, positions, day, colors });
        }

        fn get_last_placed_time(self: @ContractState) -> u64 {
            self.last_placed_time.read(starknet::get_caller_address())
        }

        fn get_user_last_placed_time(self: @ContractState, user: ContractAddress) -> u64 {
            self.last_placed_time.read(user)
        }

        fn get_time_between_pixels(self: @ContractState) -> u64 {
            self.time_between_pixels.read()
        }

        fn get_extra_pixels_count(self: @ContractState) -> u32 {
            self.extra_pixels.read(starknet::get_caller_address())
        }

        fn get_user_extra_pixels_count(self: @ContractState, user: ContractAddress) -> u32 {
            self.extra_pixels.read(user)
        }

        fn get_color_count(self: @ContractState) -> u32 {
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

        fn get_creation_time(self: @ContractState) -> u64 {
            self.creation_time.read()
        }

        fn get_end_time(self: @ContractState) -> u64 {
            self.end_time.read()
        }

        fn get_day(self: @ContractState) -> u32 {
            self.day_index.read()
        }

        fn get_max_days(self: @ContractState) -> u32 {
            self.max_days.read()
        }

        fn get_daily_quest_count(self: @ContractState) -> core::zeroable::NonZero::<u32> {
            // TODO: hardcoded 3 daily quests
            3
        }

        fn get_daily_quest(self: @ContractState, day_index: u32, quest_id: u32) -> ContractAddress {
            self.daily_quests.read((day_index, quest_id))
        }

        fn get_days_quests(self: @ContractState, day_index: u32) -> Span<ContractAddress> {
            let mut i = 0;
            let mut quests = array![];
            let quest_count = self.get_daily_quest_count().into();
            while i < quest_count {
                quests.append(self.daily_quests.read((day_index, i)));
                i += 1;
            };
            quests.span()
        }

        fn get_today_quests(self: @ContractState) -> Span<ContractAddress> {
            let day = self.day_index.read();
            let mut quests = array![];
            let mut i = 0;
            let quest_count = self.get_daily_quest_count().into();
            while i < quest_count {
                quests.append(self.daily_quests.read((day, i)));
                i += 1;
            };
            quests.span()
        }

        fn get_daily_quests(self: @ContractState) -> Span<ContractAddress> {
            let mut i = 0;
            let mut quests = array![];
            let max_days = self.max_days.read();
            let quest_count = self.get_daily_quest_count().into();
            while i < max_days {
                let mut j = 0;
                while j < quest_count {
                    quests.append(self.daily_quests.read((i, j)));
                    j += 1;
                };
                i += 1;
            };
            quests.span()
        }

        fn get_main_quest_count(self: @ContractState) -> u32 {
            self.main_quests_count.read()
        }

        fn get_main_quest(self: @ContractState, quest_id: u32) -> ContractAddress {
            self.main_quests.read(quest_id)
        }

        fn get_main_quests(self: @ContractState) -> Span<ContractAddress> {
            let mut i = 0;
            let mut quests = array![];
            let quest_count = self.main_quests_count.read();
            while i < quest_count {
                quests.append(self.main_quests.read(i));
                i += 1;
            };
            quests.span()
        }

        fn claim_daily_quest(ref self: ContractState, day_index: u32, quest_id: u32) {
            let now = starknet::get_block_timestamp();
            assert!(now <= self.end_time.read());
            // TODO: Only allow to claim the quest of the current day
            let quest = self.daily_quests.read((day_index, quest_id));
            let user = starknet::get_caller_address();
            let reward = IQuestDispatcher { contract_address: quest }.claim(user);
            if reward > 0 {
                self
                    .extra_pixels
                    .write(
                        starknet::get_caller_address(),
                        self.extra_pixels.read(starknet::get_caller_address()) + reward
                    );
            }
        }

        fn claim_today_quest(ref self: ContractState, quest_id: u32) {
            let now = starknet::get_block_timestamp();
            assert!(now <= self.end_time.read());
            let quest = self.daily_quests.read((self.day_index.read(), quest_id));
            let user = starknet::get_caller_address();
            let reward = IQuestDispatcher { contract_address: quest }.claim(user);
            if reward > 0 {
                self
                    .extra_pixels
                    .write(
                        starknet::get_caller_address(),
                        self.extra_pixels.read(starknet::get_caller_address()) + reward
                    );
            }
        }

        fn claim_main_quest(ref self: ContractState, quest_id: u32) {
            let now = starknet::get_block_timestamp();
            assert!(now <= self.end_time.read());
            let quest = self.main_quests.read(quest_id);
            let user = starknet::get_caller_address();
            let reward = IQuestDispatcher { contract_address: quest }.claim(user);
            if reward > 0 {
                self
                    .extra_pixels
                    .write(
                        starknet::get_caller_address(),
                        self.extra_pixels.read(starknet::get_caller_address()) + reward
                    );
            }
        }

        fn get_user_pixels_placed(self: @ContractState, user: ContractAddress) -> u32 {
            let mut i = 0;
            let mut total = 0;
            let last_day = self.day_index.read() + 1;
            while i < last_day {
                total += self.user_pixels_placed.read((user, i));
                i += 1;
            };
            total
        }

        fn get_user_pixels_placed_day(
            self: @ContractState, user: ContractAddress, day: u32
        ) -> u32 {
            self.user_pixels_placed.read((user, day))
        }
    }
}
