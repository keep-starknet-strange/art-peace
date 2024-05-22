#[starknet::contract]
pub mod ArtPeace {
    use starknet::ContractAddress;
    use art_peace::{IArtPeace, Pixel, Faction, MemberMetadata};
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
        host: ContractAddress,
        canvas: LegacyMap::<u128, Pixel>,
        canvas_width: u128,
        canvas_height: u128,
        total_pixels: u128,
        // Map: user's address -> last time they placed a pixel
        last_placed_time: LegacyMap::<ContractAddress, u64>,
        time_between_pixels: u64,
        // Map: user's address -> amount of extra pixels they have
        extra_pixels: LegacyMap::<ContractAddress, u32>,
        time_between_member_pixels: u64,
        factions_count: u32,
        // Map: faction id -> faction data
        factions: LegacyMap::<u32, Faction>,
        // Map: faction id -> amount of members
        faction_member_counts: LegacyMap::<u32, u32>,
        // Map: (faction id, member index) -> member's metadata
        faction_members: LegacyMap::<(u32, u32), MemberMetadata>,
        // Map: member address -> amount of faction memberships
        user_memberships_count: LegacyMap::<ContractAddress, u32>,
        // Map: (member address, membership index) -> (faction id, member index)
        user_memberships: LegacyMap::<(ContractAddress, u32), (u32, u32)>,
        color_count: u8,
        // Map: color index -> color value in RGBA
        color_palette: LegacyMap::<u8, u32>,
        // Map: (day index) -> number of votable colors
        votable_colors_count: LegacyMap::<u32, u8>,
        // Map: (votable color index, day index) -> color value in RGBA
        votable_colors: LegacyMap::<(u8, u32), u32>,
        // Map: (votable color index, day index) -> amount of votes
        color_votes: LegacyMap::<(u8, u32), u32>,
        // Map: (user's address, day_index) -> color index
        user_votes: LegacyMap::<(ContractAddress, u32), u8>,
        daily_new_colors_count: u32,
        creation_time: u64,
        end_time: u64,
        day_index: u32,
        start_day_time: u64,
        daily_quests_count: u32,
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
        NewDay: NewDay,
        PixelPlaced: PixelPlaced,
        BasicPixelPlaced: BasicPixelPlaced,
        MemberPixelsPlaced: MemberPixelsPlaced,
        ExtraPixelsPlaced: ExtraPixelsPlaced,
        DailyQuestClaimed: DailyQuestClaimed,
        MainQuestClaimed: MainQuestClaimed,
        VoteColor: VoteColor,
        FactionCreated: FactionCreated,
        MemberReplaced: MemberReplaced,
        // TODO: Integrate template event
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

    #[derive(Drop, starknet::Event)]
    struct BasicPixelPlaced {
        #[key]
        placed_by: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct MemberPixelsPlaced {
        #[key]
        faction_id: u32,
        #[key]
        member_id: u32,
        placed_time: u64,
        member_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct ExtraPixelsPlaced {
        #[key]
        placed_by: ContractAddress,
        extra_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DailyQuestClaimed {
        #[key]
        pub day_index: u32,
        #[key]
        pub quest_id: u32,
        #[key]
        pub user: ContractAddress,
        pub reward: u32,
        pub calldata: Span<felt252>,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MainQuestClaimed {
        #[key]
        pub quest_id: u32,
        #[key]
        pub user: ContractAddress,
        pub reward: u32,
        pub calldata: Span<felt252>,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteColor {
        #[key]
        voted_by: ContractAddress,
        #[key]
        day: u32,
        #[key]
        color: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionCreated {
        #[key]
        faction_id: u32,
        name: felt252,
        leader: ContractAddress,
        pool: u32,
        members: Span<ContractAddress>,
    }

    #[derive(Drop, starknet::Event)]
    struct MemberReplaced {
        #[key]
        faction_id: u32,
        #[key]
        member_id: u32,
        new_member: ContractAddress,
    }

    #[derive(Drop, Serde)]
    pub struct InitParams {
        pub host: ContractAddress,
        pub canvas_width: u128,
        pub canvas_height: u128,
        pub time_between_pixels: u64,
        pub color_palette: Array<u32>,
        pub votable_colors: Array<u32>,
        pub daily_new_colors_count: u32,
        pub end_time: u64,
        pub daily_quests_count: u32,
    }

    const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams) {
        self.host.write(init_params.host);

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

        let votable_colors_count: u8 = init_params.votable_colors.len().try_into().unwrap();
        self.votable_colors_count.write(0, votable_colors_count);
        let mut i: u8 = 0;
        while i < votable_colors_count {
            self.votable_colors.write((i + 1, 0), *init_params.votable_colors.at(i.into()));
            i += 1;
        };
        self.daily_new_colors_count.write(init_params.daily_new_colors_count);

        self.creation_time.write(starknet::get_block_timestamp());
        self.start_day_time.write(starknet::get_block_timestamp());
        self.end_time.write(init_params.end_time);
        self.day_index.write(0);
        self.emit(NewDay { day_index: 0, start_time: starknet::get_block_timestamp() });

        // TODO: Dev only - remove
        let test_address = starknet::contract_address_const::<
            0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
        >();
        let zero_address = starknet::contract_address_const::<0>();
        self.extra_pixels.write(test_address, 1000);
        self
            .init_faction(
                'RealmsWorld',
                test_address,
                10,
                array![test_address, test_address, zero_address, zero_address, zero_address].span()
            );
        self
            .init_faction(
                'briq', test_address, 9, array![test_address, zero_address, zero_address].span()
            );

        self.daily_quests_count.write(init_params.daily_quests_count);
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

        fn check_game_running(self: @ContractState) {
            let block_timestamp = starknet::get_block_timestamp();
            assert(block_timestamp <= self.end_time.read(), 'ArtPeace game has ended');
        }

        fn check_valid_pixel(self: @ContractState, pos: u128, color: u8) {
            assert(pos < self.total_pixels.read(), 'Position out of bounds');
            assert(color < self.color_count.read(), 'Color out of bounds');
        }

        fn check_timing(self: @ContractState, now: u64) {
            let block_timestamp = starknet::get_block_timestamp();
            // TODO: To config?
            let leanience_margin = 20; // 20 seconds
            let expected_block_time = 6 * 60; // 6 minutes
            assert(now >= block_timestamp - leanience_margin, 'Block timestamp is too old');
            assert(
                now <= block_timestamp + 2 * expected_block_time, 'Passed timestamp too far ahead'
            );
        }

        fn place_pixel_inner(ref self: ContractState, pos: u128, color: u8) {
            self.check_valid_pixel(pos, color);

            let caller = starknet::get_caller_address();
            let pixel = Pixel { color, owner: caller };
            self.canvas.write(pos, pixel);
            let day = self.day_index.read();
            self
                .user_pixels_placed
                .write(
                    (day, caller, color), self.user_pixels_placed.read((day, caller, color)) + 1
                );
            // TODO: Optimize?
            self.emit(PixelPlaced { placed_by: caller, pos, day, color });
        }

        // TODO: Make the function internal only
        fn place_basic_pixel_inner(ref self: ContractState, pos: u128, color: u8, now: u64) {
            self.place_pixel_inner(pos, color);
            let caller = starknet::get_caller_address();
            self.last_placed_time.write(caller, now);
            self.emit(BasicPixelPlaced { placed_by: caller, timestamp: now });
        }

        fn place_member_pixels_inner(
            ref self: ContractState,
            faction_id: u32,
            member_id: u32,
            positions: Span<u128>,
            colors: Span<u8>,
            mut offset: u32,
            now: u64
        ) -> u32 {
            let pixel_count = positions.len();
            let member_pixels = self.get_faction_members_pixels(faction_id, member_id, now);
            let mut member_pixels_left = member_pixels;
            while member_pixels_left > 0 {
                let pos = *positions.at(offset);
                let color = *colors.at(offset);
                self.place_pixel_inner(pos, color);
                offset += 1;
                member_pixels_left -= 1;
                if offset == pixel_count {
                    break;
                }
            };
            let caller = starknet::get_caller_address();
            if member_pixels != 0 {
                // TODO: Optimize
                if member_pixels_left == 0 {
                    let new_member_metadata = MemberMetadata {
                        address: caller, member_placed_time: now, member_pixels: 0
                    };
                    self.faction_members.write((faction_id, member_id), new_member_metadata);
                    self
                        .emit(
                            MemberPixelsPlaced {
                                faction_id, member_id, placed_time: now, member_pixels: 0
                            }
                        );
                } else {
                    let last_placed_time = self
                        .faction_members
                        .read((faction_id, member_id))
                        .member_placed_time;
                    let new_member_metadata = MemberMetadata {
                        address: caller,
                        member_placed_time: last_placed_time,
                        member_pixels: member_pixels_left
                    };
                    self.faction_members.write((faction_id, member_id), new_member_metadata);
                    self
                        .emit(
                            MemberPixelsPlaced {
                                faction_id,
                                member_id,
                                placed_time: last_placed_time,
                                member_pixels: member_pixels_left
                            }
                        );
                }
            }
            return offset;
        }

        fn place_pixel(ref self: ContractState, pos: u128, color: u8, now: u64) {
            self.check_game_running();
            self.check_timing(now);
            let caller = starknet::get_caller_address();
            assert(
                now - self.last_placed_time.read(caller) >= self.time_between_pixels.read(),
                'Pixel not available'
            );

            self.place_basic_pixel_inner(pos, color, now);
        }

        fn place_pixel_xy(ref self: ContractState, x: u128, y: u128, color: u8, now: u64) {
            let pos = x + y * self.canvas_width.read();
            self.place_pixel(pos, color, now);
        }

        fn place_pixel_blocktime(ref self: ContractState, pos: u128, color: u8) {
            let block_timestamp = starknet::get_block_timestamp();
            self.place_pixel(pos, color, block_timestamp);
        }

        fn place_extra_pixels(
            ref self: ContractState, positions: Span<u128>, colors: Span<u8>, now: u64
        ) {
            self.check_game_running();
            self.check_timing(now);
            let pixel_count = positions.len();
            assert(pixel_count == colors.len(), 'Positions & Colors must match');

            // Order to use pixels : user base pixel -> member pixels -> extra pixels
            let caller = starknet::get_caller_address();
            let mut pixels_placed = 0;

            // Use base pixel if available
            if now - self.last_placed_time.read(caller) >= self.time_between_pixels.read() {
                let pos = *positions.at(pixels_placed);
                let color = *colors.at(pixels_placed);
                self.place_basic_pixel_inner(pos, color, now);
                pixels_placed += 1;
                if pixels_placed == pixel_count {
                    return;
                }
            }

            // Use member pixels if available
            let membership_count = self.user_memberships_count.read(caller);
            let mut i = 0;
            while i < membership_count {
                let (faction_id, member_id) = self.user_memberships.read((caller, i));
                pixels_placed = self
                    .place_member_pixels_inner(
                        faction_id, member_id, positions, colors, pixels_placed, now
                    );
                if pixels_placed == pixel_count {
                    break;
                }
                i += 1;
            };
            if pixels_placed == pixel_count {
                return;
            }

            // TODO: place_extra_pixels_inner
            // Use extra pixels
            let extra_pixels = self.extra_pixels.read(caller);
            let prior_pixels = pixels_placed;
            assert(extra_pixels >= pixel_count - prior_pixels, 'Not enough extra pixels');
            while pixels_placed < pixel_count {
                let pos = *positions.at(pixels_placed);
                let color = *colors.at(pixels_placed);
                self.place_pixel_inner(pos, color);
                pixels_placed += 1;
            };
            let extra_pixels_placed = pixel_count - prior_pixels;
            self.extra_pixels.write(caller, extra_pixels - extra_pixels_placed);
            self.emit(ExtraPixelsPlaced { placed_by: caller, extra_pixels: extra_pixels_placed });
        }

        // TODO: Place extra pixels cheaper func: pass pixels to use instead of checking all

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

        fn get_factions_count(self: @ContractState) -> u32 {
            self.factions_count.read()
        }

        fn get_faction(self: @ContractState, faction_id: u32) -> Faction {
            self.factions.read(faction_id)
        }

        fn get_faction_leader(self: @ContractState, faction_id: u32) -> ContractAddress {
            self.factions.read(faction_id).leader
        }

        fn init_faction(
            ref self: ContractState,
            name: felt252,
            leader: ContractAddress,
            pool: u32,
            members: Span<ContractAddress>
        ) {
            // TODO
            //assert(
            //    starknet::get_caller_address() == self.host.read(), 'Factions are set by the host'
            //);
            assert(members.len() <= pool, 'Invalid faction members count');
            let faction_id = self.factions_count.read();
            let faction = Faction { name, leader, pixel_pool: pool };
            self.factions.write(faction_id, faction);
            self.factions_count.write(faction_id + 1);
            let mut i = 0;
            while i < members
                .len() {
                    let member_address = *members.at(i);
                    let member = MemberMetadata {
                        address: member_address, member_placed_time: 0, member_pixels: 0
                    };
                    let member_membership_count = self.user_memberships_count.read(member_address);
                    self.faction_members.write((faction_id, i), member);
                    self
                        .user_memberships
                        .write((member_address, member_membership_count), (faction_id, i));
                    self.user_memberships_count.write(member_address, member_membership_count + 1);
                    i += 1;
                };
            self.faction_member_counts.write(faction_id, members.len());
            self.emit(FactionCreated { faction_id, name, leader, pool, members });
        }

        // TODO: Tests and integration
        // TODO: Infinite replacement exploit
        fn replace_member(
            ref self: ContractState, faction_id: u32, member_id: u32, new_member: ContractAddress
        ) {
            assert(
                starknet::get_caller_address() == self.get_faction_leader(faction_id),
                'Only leader can replace members'
            );
            let member_count = self.faction_member_counts.read(faction_id);
            assert(member_id < member_count, 'Member ID out of bounds');

            let old_member = self.faction_members.read((faction_id, member_id));
            let old_member_address = old_member.address;

            let old_member_membership_count = self.user_memberships_count.read(old_member.address);
            let mut member_id = 0;
            while member_id < old_member_membership_count {
                let (fid, mid) = self.user_memberships.read((old_member_address, member_id));
                if fid == faction_id && mid == member_id {
                    break;
                }
                member_id += 1;
            };
            let last_member_membership = self
                .user_memberships
                .read((old_member.address, old_member_membership_count - 1));
            self.user_memberships.write((old_member.address, member_id), last_member_membership);
            self.user_memberships_count.write(old_member.address, old_member_membership_count - 1);

            let member = MemberMetadata {
                address: new_member, member_placed_time: 0, member_pixels: 0
            };
            self.faction_members.write((faction_id, member_id), member);

            let new_member_membership_count = self.user_memberships_count.read(new_member);
            self
                .user_memberships
                .write((new_member, new_member_membership_count), (faction_id, member_id));
            self.user_memberships_count.write(new_member, new_member_membership_count + 1);
            self.emit(MemberReplaced { faction_id, member_id, new_member });
        }

        //fn add_faction_member(ref self: ContractState, faction_id: u32, member: ContractAddress) {
        //    assert(
        //        starknet::get_caller_address() == self.get_faction_owner(faction_id),
        //        'Only the faction owner can add members'
        //    );
        //    let faction = self.factions.read(faction_id);
        //    let member_count = self.faction_member_counts.read(faction_id);
        //    assert(member_count < faction.pixel_pool, 'Faction is full');
        //    let member_data = MemberMetadata { address: member, member_placed_time: 0, member_pixels: 0 };
        //    self.faction_members.write((faction_id, member_count), member_data);
        //    self.faction_member_counts.write(faction_id, member_count + 1);
        //}

        //fn remove_faction_member(ref self: ContractState, faction_id: u32, member_id: u32) {
        //    assert(
        //        starknet::get_caller_address() == self.get_faction_owner(faction_id),
        //        'Only the faction owner can remove members'
        //    );
        //    let member_count = self.faction_member_counts.read(faction_id);
        //    // Replace the removed member with the last member
        //    let last_member = self.faction_members.read((faction_id, member_count - 1));
        //    self.faction_members.write((faction_id, member_id), last_member);
        //    self.faction_member_counts.write(faction_id, member_count - 1);
        //}

        fn get_faction_members(self: @ContractState, faction_id: u32) -> Span<ContractAddress> {
            let member_count = self.faction_member_counts.read(faction_id);
            let mut i = 0;
            let mut members = array![];
            while i < member_count {
                members.append(self.faction_members.read((faction_id, i)).address);
                i += 1;
            };

            members.span()
        }

        fn get_faction_member_count(self: @ContractState, faction_id: u32) -> u32 {
            self.faction_member_counts.read(faction_id)
        }

        fn get_faction_members_pixels(
            self: @ContractState, faction_id: u32, member_id: u32, now: u64
        ) -> u32 {
            let member_count = self.faction_member_counts.read(faction_id);
            let pixel_pool = self.factions.read(faction_id).pixel_pool;
            let member_metadata = self.faction_members.read((faction_id, member_id));
            if member_id >= member_count {
                return 0;
            }
            if member_metadata.member_pixels > 0 {
                // TODO: If member_pixels > 0 && < allocation && enough time has passed, return allocation instead of member_pixels
                return member_metadata.member_pixels;
            } else {
                let time_since_last_pixel = now - member_metadata.member_placed_time;
                // TODO: Setup time_between_member_pixels
                if time_since_last_pixel < self.time_between_member_pixels.read() {
                    return 0;
                } else {
                    // TODO: Think about when pixel_pool % member_count != 0
                    return pixel_pool / member_count.into();
                }
            }
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

        fn vote_color(ref self: ContractState, color: u8) {
            let now = starknet::get_block_timestamp();
            let day = self.day_index.read();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
            assert(color != 0, 'Color 0 indicates no vote');
            assert(color <= self.votable_colors_count.read(day), 'Color out of bounds');
            let caller = starknet::get_caller_address();
            let users_vote = self.user_votes.read((caller, day));
            if users_vote != color {
                if users_vote != 0 {
                    let old_vote = self.color_votes.read((users_vote, day));
                    self.color_votes.write((users_vote, day), old_vote - 1);
                }
                let new_vote = self.color_votes.read((color, day));
                self.color_votes.write((color, day), new_vote + 1);
                self.user_votes.write((caller, day), color);
                self.emit(VoteColor { voted_by: caller, day, color });
            }
        }

        fn get_color_votes(self: @ContractState, color: u8) -> u32 {
            let day = self.day_index.read();
            self.color_votes.read((color, day))
        }

        fn get_votable_colors(self: @ContractState) -> Array<u32> {
            let day = self.day_index.read();
            let votable_colors_count = self.votable_colors_count.read(day);
            let mut votable_colors = array![];
            let mut i = 1;
            while i <= votable_colors_count {
                votable_colors.append(self.votable_colors.read((i, day)));
                i += 1;
            };

            votable_colors
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

        // TODO: Integrate call into backend
        fn increase_day_index(ref self: ContractState) {
            let block_timestamp = starknet::get_block_timestamp();
            let start_day_time = self.start_day_time.read();

            assert(block_timestamp >= start_day_time + DAY_IN_SECONDS, 'day has not passed');
            finalize_color_votes(ref self);

            self.day_index.write(self.day_index.read() + 1);
            self.start_day_time.write(block_timestamp);
            self.emit(NewDay { day_index: self.day_index.read(), start_time: block_timestamp });
        }

        fn get_daily_quests_count(self: @ContractState) -> u32 {
            self.daily_quests_count.read()
        }

        fn get_daily_quest(self: @ContractState, day_index: u32, quest_id: u32) -> ContractAddress {
            self.daily_quests.read((day_index, quest_id))
        }

        fn get_days_quests(self: @ContractState, day_index: u32) -> Span<ContractAddress> {
            let mut i = 0;
            let mut quests = array![];
            let quest_count = self.get_daily_quests_count();
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
            let quest_count = self.get_daily_quests_count();
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

        fn add_daily_quests(
            ref self: ContractState, day_index: u32, quests: Span<ContractAddress>
        ) {
            assert(
                starknet::get_caller_address() == self.host.read(), 'Quests are set by the host'
            );
            assert(quests.len() <= self.get_daily_quests_count(), 'Invalid daily quests count');
            let zero_address = starknet::contract_address_const::<0>();
            assert(
                self.daily_quests.read((day_index, 0)) == zero_address, 'Daily quests already set'
            );
            let mut i = 0;
            while i < quests
                .len() {
                    self.daily_quests.write((day_index, i), *quests.at(i));
                    i += 1;
                };
        }

        fn add_main_quests(ref self: ContractState, quests: Span<ContractAddress>) {
            assert(
                starknet::get_caller_address() == self.host.read(), 'Quests are set by the host'
            );
            let mut i = self.main_quests_count.read();
            let end = i + quests.len();
            while i < end {
                self.main_quests.write(i, *quests.at(i));
                i += 1;
            };
            self.main_quests_count.write(end);
        }

        fn claim_daily_quest(
            ref self: ContractState, day_index: u32, quest_id: u32, calldata: Span<felt252>
        ) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
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
            self.emit(DailyQuestClaimed { day_index, quest_id, user, reward, calldata });
        }

        fn claim_today_quest(ref self: ContractState, quest_id: u32, calldata: Span<felt252>) {
            let now = starknet::get_block_timestamp();
            assert(now <= self.end_time.read(), 'ArtPeace game has ended');
            let day_index = self.day_index.read();
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
            self.emit(DailyQuestClaimed { day_index, quest_id, user, reward, calldata });
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
            self.emit(MainQuestClaimed { quest_id, user, reward, calldata });
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
            assert(
                starknet::get_caller_address() == self.host.read(),
                'NFT contract is set by the host'
            );
            let zero_address = starknet::contract_address_const::<0>();
            assert(self.nft_contract.read() == zero_address, 'NFT contract already set');
            self.nft_contract.write(nft_contract);
            ICanvasNFTAdditionalDispatcher { contract_address: nft_contract }
                .set_canvas_contract(starknet::get_contract_address());
        }

        fn mint_nft(ref self: ContractState, mint_params: NFTMintParams) {
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

    /// Internals
    fn finalize_color_votes(ref self: ContractState) {
        let daily_new_colors_count = self.daily_new_colors_count.read();
        let day = self.day_index.read();
        let votable_colors_count = self.votable_colors_count.read(day);

        let mut max_scores: Felt252Dict<u32> = Default::default();
        let mut votable_index: u8 = 1; // 0 means no vote
        while votable_index <= votable_colors_count {
            let vote = self.color_votes.read((votable_index, day));
            if vote <= max_scores.get(daily_new_colors_count.into() - 1) {
                votable_index += 1;
                continue;
            }
            // update max scores if needed
            let mut max_scores_index: u32 = 0;
            while max_scores_index < daily_new_colors_count {
                if max_scores.get(max_scores_index.into()) < vote {
                    // shift scores
                    let mut i: u32 = daily_new_colors_count - 1;
                    while i > max_scores_index {
                        max_scores.insert(i.into(), max_scores.get(i.into() - 1));
                        i -= 1;
                    };
                    max_scores.insert(max_scores_index.into(), vote);
                    break;
                }
                max_scores_index += 1;
            };
            votable_index += 1;
        };

        // find threshold
        let mut threshold: u32 = 0;
        let mut min_index = daily_new_colors_count;
        while threshold == 0
            && min_index > 0 {
                min_index -= 1;
                threshold = max_scores.get(min_index.into());
            };
        if threshold == 0 {
            // No votes
            return;
        }

        // update palette & votable colors
        let next_day = day + 1;
        let mut color_index = self.color_count.read();
        let mut next_day_votable_index = 1;
        votable_index = 1;
        while votable_index <= votable_colors_count {
            let vote = self.color_votes.read((votable_index, day));
            let color = self.votable_colors.read((votable_index, day));
            if vote >= threshold {
                self.color_palette.write(color_index, color);
                color_index += 1;
            } else {
                self.votable_colors.write((next_day_votable_index, next_day), color);
                next_day_votable_index += 1;
            }
            votable_index += 1;
        };
        self.color_count.write(color_index);
        self.votable_colors_count.write(next_day, next_day_votable_index - 1);
    }
}

