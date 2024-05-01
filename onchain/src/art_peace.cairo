#[starknet::contract]
pub mod ArtPeace {
    use starknet::ContractAddress;
    use art_peace::{IArtPeace, Pixel};
    use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};
    use art_peace::nfts::interfaces::{
        IArtPeaceNFTMinter, NFTMetadata, NFTMintParams, ICanvasNFTAdditionalDispatcher,
        ICanvasNFTAdditionalDispatcherTrait
    };
    use art_peace::templates::component::TemplateStoreComponent;
    use art_peace::templates::interfaces::{ITemplateVerifier, ITemplateStore, TemplateMetadata};

    component!(path: TemplateStoreComponent, storage: templates, event: TemplateEvent);

    #[abi(embed_v0)]
    impl TemplateStoreComponentImpl =
        TemplateStoreComponent::TemplateStoreImpl<ContractState>;

    #[storage]
    struct Storage {
        canvas: LegacyMap::<u128, Pixel>,
        canvas_width: u128,
        canvas_height: u128,
        total_pixels: u128,
        // Map: user's address -> last time they placed a pixel
        last_placed_time: LegacyMap::<ContractAddress, u64>,
        time_between_pixels: u64,
        // Map: user's address -> amount of extra pixels they have
        extra_pixels: LegacyMap::<ContractAddress, u32>,
        color_count: u8,
        // Map: color index -> color value in RGBA
        color_palette: LegacyMap::<u8, u32>,
        creation_time: u64,
        end_time: u64,
        day_index: u32,
        start_day_time: u64,
        // Map: (day_index, quest_id) -> quest contract address
        daily_quests: LegacyMap::<(u32, u32), ContractAddress>,
        main_quests_count: u32,
        // Map: quest index -> quest contract address
        main_quests: LegacyMap::<u32, ContractAddress>,
        nft_contract: ContractAddress,
        // Map: (day_index, user's address, color index) -> amount of pixels placed
        user_pixels_placed: LegacyMap::<(u32, ContractAddress, u8), u32>,
        #[substorage(v0)]
        templates: TemplateStoreComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Newday: NewDay,
        PixelPlaced: PixelPlaced,
        #[flat]
        TemplateEvent: TemplateStoreComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct NewDay {
        #[key]
        day_index: u32,
        start_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PixelPlaced {
        #[key]
        placed_by: ContractAddress,
        #[key]
        pos: u128,
        #[key]
        day: u32,
        color: u8,
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

    const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams) {
        self.canvas_width.write(init_params.canvas_width);
        self.canvas_height.write(init_params.canvas_height);
        self.total_pixels.write(init_params.canvas_width * init_params.canvas_height);

        self.time_between_pixels.write(init_params.time_between_pixels);

        let color_count: u8 = init_params.color_palette.len().try_into().unwrap();
        self.color_count.write(color_count);
        let mut i: u8 = 0;
        while i < color_count {
            self.color_palette.write(i, *init_params.color_palette.at(i.into()));
            i += 1;
        };

        self.creation_time.write(starknet::get_block_timestamp());
        self.start_day_time.write(starknet::get_block_timestamp());
        self.end_time.write(init_params.end_time);
        self.day_index.write(0);
        self.emit(NewDay { day_index: 0, start_time: starknet::get_block_timestamp() });

        // TODO: Dev only - remove
        let test_address = starknet::contract_address_const::<
            0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
        >();
        self.extra_pixels.write(test_address, 1000);

        // TODO: To config
        let daily_quests_count = self.get_daily_quest_count();
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
        fn get_pixel(self: @ContractState, pos: u128) -> Pixel {
            self.canvas.read(pos)
        }

        fn get_pixel_color(self: @ContractState, pos: u128) -> u8 {
            self.canvas.read(pos).color
        }

        fn get_pixel_owner(self: @ContractState, pos: u128) -> ContractAddress {
            self.canvas.read(pos).owner
        }

        fn get_pixel_xy(self: @ContractState, x: u128, y: u128) -> Pixel {
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

        fn place_pixel(ref self: ContractState, pos: u128, color: u8) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
            assert(pos < self.total_pixels.read(), 'Position out of bounds');
            assert(color < self.color_count.read(), 'Color out of bounds');
            // TODO: Use sender not caller?
            let caller = starknet::get_caller_address();
            // TODO: Only if the user has placed a pixel before?
            assert(
                now - self.last_placed_time.read(caller) >= self.time_between_pixels.read(),
                'Pixel not available'
            );
            let pixel = Pixel { color, owner: caller };
            self.canvas.write(pos, pixel);
            self.last_placed_time.write(caller, now);
            let day = self.day_index.read();
            self
                .user_pixels_placed
                .write(
                    (day, caller, color), self.user_pixels_placed.read((day, caller, color)) + 1
                );
            self.emit(PixelPlaced { placed_by: caller, pos, day, color });
        }

        fn place_pixel_xy(ref self: ContractState, x: u128, y: u128, color: u8) {
            let pos = x + y * self.canvas_width.read();
            self.place_pixel(pos, color);
        }

        fn place_extra_pixels(ref self: ContractState, positions: Array<u128>, colors: Array<u8>) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
            let pixel_count = positions.len();
            assert(pixel_count == colors.len(), 'Positions & Colors must match');
            let caller = starknet::get_caller_address();
            let extra_pixels = self.extra_pixels.read(caller);
            assert(pixel_count <= extra_pixels, 'Not enough extra pixels');
            let color_palette_count = self.color_count.read();
            let total_pixels = self.total_pixels.read();
            let day = self.day_index.read();
            let mut i = 0;
            while i < pixel_count {
                let pos = *positions.at(i);
                let color = *colors.at(i);
                assert(pos < total_pixels, 'Position out of bounds');
                assert(color < color_palette_count, 'Color out of bounds');
                let pixel = Pixel { color, owner: caller };
                self.canvas.write(pos, pixel);
                self
                    .user_pixels_placed
                    .write(
                        (day, caller, color), self.user_pixels_placed.read((day, caller, color)) + 1
                    );
                i += 1;
                self.emit(PixelPlaced { placed_by: caller, pos, day, color });
            };
            self.extra_pixels.write(caller, extra_pixels - pixel_count);
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

        fn get_creation_time(self: @ContractState) -> u64 {
            self.creation_time.read()
        }

        fn get_end_time(self: @ContractState) -> u64 {
            self.end_time.read()
        }

        fn get_day(self: @ContractState) -> u32 {
            self.day_index.read()
        }

        fn increase_day_index(ref self: ContractState) {
            let block_timestamp = starknet::get_block_timestamp();
            let start_day_time = self.start_day_time.read();

            assert(block_timestamp >= start_day_time + DAY_IN_SECONDS, 'day has not passed');

            self.day_index.write(self.day_index.read() + 1);
            self.start_day_time.write(block_timestamp);
            self.emit(NewDay { day_index: self.day_index.read(), start_time: block_timestamp });
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

        fn claim_daily_quest(
            ref self: ContractState, day_index: u32, quest_id: u32, calldata: Span<felt252>
        ) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), '');
            // TODO: Only allow to claim the quest of the current day
            let quest = self.daily_quests.read((day_index, quest_id));
            let user = starknet::get_caller_address();
            let reward = IQuestDispatcher { contract_address: quest }.claim(user, calldata);
            if reward > 0 {
                self
                    .extra_pixels
                    .write(
                        starknet::get_caller_address(),
                        self.extra_pixels.read(starknet::get_caller_address()) + reward
                    );
            }
        }

        fn claim_today_quest(ref self: ContractState, quest_id: u32, calldata: Span<felt252>) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
            let quest = self.daily_quests.read((self.day_index.read(), quest_id));
            let user = starknet::get_caller_address();
            let reward = IQuestDispatcher { contract_address: quest }.claim(user, calldata);
            if reward > 0 {
                self
                    .extra_pixels
                    .write(
                        starknet::get_caller_address(),
                        self.extra_pixels.read(starknet::get_caller_address()) + reward
                    );
            }
        }

        fn claim_main_quest(ref self: ContractState, quest_id: u32, calldata: Span<felt252>) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
            let quest = self.main_quests.read(quest_id);
            let user = starknet::get_caller_address();
            let reward = IQuestDispatcher { contract_address: quest }.claim(user, calldata);
            if reward > 0 {
                self
                    .extra_pixels
                    .write(
                        starknet::get_caller_address(),
                        self.extra_pixels.read(starknet::get_caller_address()) + reward
                    );
            }
        }

        fn get_nft_contract(self: @ContractState) -> ContractAddress {
            self.nft_contract.read()
        }

        fn get_user_pixels_placed(self: @ContractState, user: ContractAddress) -> u32 {
            let mut i = 0;
            let mut total = 0;
            let last_day = self.day_index.read() + 1;
            let color_count = self.color_count.read();
            while i < last_day {
                let mut j = 0;
                while j < color_count {
                    total += self.user_pixels_placed.read((i, user, j));
                    j += 1;
                };
                i += 1;
            };

            total
        }

        fn get_user_pixels_placed_day(
            self: @ContractState, user: ContractAddress, day: u32
        ) -> u32 {
            let mut total = 0;
            let color_count = self.color_count.read();
            let mut i = 0;
            while i < color_count {
                total += self.user_pixels_placed.read((day, user, i));
                i += 1;
            };

            total
        }

        fn get_user_pixels_placed_color(
            self: @ContractState, user: ContractAddress, color: u8
        ) -> u32 {
            let mut total = 0;
            let last_day = self.day_index.read() + 1;
            let mut i = 0;
            while i < last_day {
                total += self.user_pixels_placed.read((i, user, color));
                i += 1;
            };
            total
        }

        fn get_user_pixels_placed_day_color(
            self: @ContractState, user: ContractAddress, day: u32, color: u8
        ) -> u32 {
            self.user_pixels_placed.read((day, user, color))
        }
    }

    #[abi(embed_v0)]
    impl ArtPeaceNFTMinter of IArtPeaceNFTMinter<ContractState> {
        fn add_nft_contract(ref self: ContractState, nft_contract: ContractAddress) {
            let zero_address = starknet::contract_address_const::<0>();
            assert(self.nft_contract.read() == zero_address, 'NFT contract already set');
            self.nft_contract.write(nft_contract);
            ICanvasNFTAdditionalDispatcher { contract_address: nft_contract }
                .set_canvas_contract(starknet::get_contract_address());
        }

        fn mint_nft(self: @ContractState, mint_params: NFTMintParams) {
            let metadata = NFTMetadata {
                position: mint_params.position,
                width: mint_params.width,
                height: mint_params.height,
                image_hash: 0, // TODO
                block_number: starknet::get_block_number(),
                minter: starknet::get_caller_address(),
            };
            ICanvasNFTAdditionalDispatcher { contract_address: self.nft_contract.read(), }
                .mint(metadata, starknet::get_caller_address());
        }
    }


    #[abi(embed_v0)]
    impl ArtPeaceTemplateVerifier of ITemplateVerifier<ContractState> {
        // TODO: Check template function
        fn complete_template(ref self: ContractState, template_id: u32, template_image: Span<u8>) {
            assert(template_id < self.get_templates_count(), 'Template ID out of bounds');
            assert(!self.is_template_complete(template_id), 'Template already completed');
            // TODO: ensure template_image matches the template size & hash
            let template_metadata: TemplateMetadata = self.get_template(template_id);
            let non_zero_width: core::zeroable::NonZero::<u128> = template_metadata
                .width
                .try_into()
                .unwrap();
            let (template_pos_y, template_pos_x) = DivRem::div_rem(
                template_metadata.position, non_zero_width
            );
            let canvas_width = self.canvas_width.read();
            let (mut x, mut y) = (0, 0);
            let mut matches = 0;
            while y < template_metadata
                .height {
                    x = 0;
                    while x < template_metadata
                        .width {
                            let pos = template_pos_x + x + (template_pos_y + y) * canvas_width;
                            let color = *template_image
                                .at((x + y * template_metadata.width).try_into().unwrap());
                            // TODO: Check if the color is transparent
                            if color == self.canvas.read(pos).color {
                                matches += 1;
                            }
                            x += 1;
                        };
                    y += 1;
                };

            // TODO: Allow some threshold?
            if matches == template_metadata.width * template_metadata.height {
                self.templates.completed_templates.write(template_id, true);
            // TODO: Distribute rewards
            // self.emit(Event::TemplateEvent::TemplateCompleted { template_id });
            }
        }
    }
}

