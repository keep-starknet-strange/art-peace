#[starknet::contract]
pub mod ArtPeace {
    use core::dict::Felt252DictTrait;
    use starknet::ContractAddress;
    use core::poseidon::PoseidonTrait;
    use core::hash::{HashStateTrait, HashStateExTrait};
    use art_peace::{IArtPeace, Pixel, Faction, ChainFaction, MemberMetadata};
    use art_peace::quests::interfaces::{IQuestDispatcher, IQuestDispatcherTrait};
    use art_peace::nfts::interfaces::{
        IArtPeaceNFTMinter, NFTMetadata, NFTMintParams, ICanvasNFTAdditionalDispatcher,
        ICanvasNFTAdditionalDispatcherTrait, ICanvasNFTLikeAndUnlike,
        ICanvasNFTLikeAndUnlikeDispatcher, ICanvasNFTLikeAndUnlikeDispatcherTrait
    };
    use art_peace::templates::component::TemplateStoreComponent;
    use art_peace::templates::interfaces::{
        ITemplateVerifier, ITemplateStore, FactionTemplateMetadata, TemplateMetadata
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    component!(path: TemplateStoreComponent, storage: templates, event: TemplateEvent);

    #[abi(embed_v0)]
    impl TemplateStoreComponentImpl =
        TemplateStoreComponent::TemplateStoreImpl<ContractState>;

    #[storage]
    struct Storage {
        host: ContractAddress,
        // TODO: Add back canvas: LegacyMap::<u128, Pixel>,
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
        // Map: members address -> faction id ( 0 => no faction )
        users_faction: LegacyMap::<ContractAddress, u32>,
        // Map: members address -> membership metadata
        users_faction_meta: LegacyMap::<ContractAddress, MemberMetadata>,
        chain_factions_count: u32,
        // Map: chain faction id -> chain faction data
        chain_factions: LegacyMap::<u32, ChainFaction>,
        // Map: chain members address -> faction id ( 0 => no faction )
        users_chain_faction: LegacyMap::<ContractAddress, u32>,
        // Map: chain members address -> membership metadata
        users_chain_faction_meta: LegacyMap::<ContractAddress, MemberMetadata>,
        // TODO: Extra factions ( assigned at start with larger allocations )
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
        devmode: bool,
        faction_templates_count: u32,
        // Map: template id -> template metadata
        faction_templates: LegacyMap::<u32, FactionTemplateMetadata>,
        chain_faction_templates_count: u32,
        // Map: template id -> template metadata
        chain_faction_templates: LegacyMap::<u32, FactionTemplateMetadata>,
        #[substorage(v0)]
        templates: TemplateStoreComponent::Storage,
        // Map: (user's address, nft_id) -> boolean indicate the user has liked the nft or not
        liked_nfts: LegacyMap::<(ContractAddress, u256), bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        NewDay: NewDay,
        CanvasScaled: CanvasScaled,
        ColorAdded: ColorAdded,
        PixelPlaced: PixelPlaced,
        BasicPixelPlaced: BasicPixelPlaced,
        FactionPixelsPlaced: FactionPixelsPlaced,
        ChainFactionPixelsPlaced: ChainFactionPixelsPlaced,
        ExtraPixelsPlaced: ExtraPixelsPlaced,
        VoteColor: VoteColor,
        FactionCreated: FactionCreated,
        FactionLeaderChanged: FactionLeaderChanged,
        ChainFactionCreated: ChainFactionCreated,
        FactionJoined: FactionJoined,
        FactionLeft: FactionLeft,
        ChainFactionJoined: ChainFactionJoined,
        VotableColorAdded: VotableColorAdded,
        FactionTemplateAdded: FactionTemplateAdded,
        FactionTemplateRemoved: FactionTemplateRemoved,
        ChainFactionTemplateAdded: ChainFactionTemplateAdded,
        ChainFactionTemplateRemoved: ChainFactionTemplateRemoved,
        // TODO: Integrate template event
        #[flat]
        TemplateEvent: TemplateStoreComponent::Event,
        #[flat]
        ExtraPixelsAwardedEvent: ExtraPixelsAwarded
    }

    #[derive(Drop, starknet::Event)]
    struct ColorAdded {
        #[key]
        color_key: u8,
        color: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct NewDay {
        #[key]
        day_index: u32,
        start_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasScaled {
        old_width: u128,
        new_width: u128,
        old_height: u128,
        new_height: u128
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
    struct FactionPixelsPlaced {
        #[key]
        user: ContractAddress,
        placed_time: u64,
        member_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct ChainFactionPixelsPlaced {
        #[key]
        user: ContractAddress,
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
    enum ExtraPixelsAwarded {
        DailyQuest: DailyQuestClaimed,
        MainQuest: MainQuestClaimed,
        HostAwardedUser: HostAwardedUser,
        LikeNft: LikeNftAwarded,
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
    struct HostAwardedUser {
        #[key]
        user: ContractAddress,
        amount: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct LikeNftAwarded {
        #[key]
        user: ContractAddress,
        amount: u32,
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
    struct VotableColorAdded {
        #[key]
        day: u32,
        #[key]
        color_key: u8,
        color: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionCreated {
        #[key]
        faction_id: u32,
        name: felt252,
        leader: ContractAddress,
        joinable: bool,
        allocation: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionLeaderChanged {
        #[key]
        faction_id: u32,
        new_leader: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct ChainFactionCreated {
        #[key]
        faction_id: u32,
        name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionJoined {
        #[key]
        faction_id: u32,
        #[key]
        user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionLeft {
        #[key]
        faction_id: u32,
        #[key]
        user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct ChainFactionJoined {
        #[key]
        faction_id: u32,
        #[key]
        user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionTemplateAdded {
        #[key]
        template_id: u32,
        template_metadata: FactionTemplateMetadata,
    }

    #[derive(Drop, starknet::Event)]
    struct FactionTemplateRemoved {
        #[key]
        template_id: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct ChainFactionTemplateAdded {
        #[key]
        template_id: u32,
        template_metadata: FactionTemplateMetadata,
    }

    #[derive(Drop, starknet::Event)]
    struct ChainFactionTemplateRemoved {
        #[key]
        template_id: u32,
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
        pub start_time: u64,
        pub end_time: u64,
        pub daily_quests_count: u32,
        pub devmode: bool,
    }

    const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams) {
        self.host.write(init_params.host);

        self.canvas_width.write(init_params.canvas_width);
        self.canvas_height.write(init_params.canvas_height);
        self.total_pixels.write(init_params.canvas_width * init_params.canvas_height);

        self.time_between_pixels.write(init_params.time_between_pixels);
        self.time_between_member_pixels.write(init_params.time_between_pixels);

        let color_count: u8 = init_params.color_palette.len().try_into().unwrap();
        self.color_count.write(color_count);
        let mut i: u8 = 0;
        while i < color_count {
            self.color_palette.write(i, *init_params.color_palette.at(i.into()));
            self.emit(ColorAdded { color_key: i, color: *init_params.color_palette.at(i.into()) });
            i += 1;
        };

        let votable_colors_count: u8 = init_params.votable_colors.len().try_into().unwrap();
        self.votable_colors_count.write(0, votable_colors_count);
        let mut i: u8 = 0;
        while i < votable_colors_count {
            let new_color = *init_params.votable_colors.at(i.into());
            self.votable_colors.write((i + 1, 0), new_color);
            self.emit(VotableColorAdded { day: 0, color_key: i + 1, color: new_color });
            i += 1;
        };
        self.daily_new_colors_count.write(init_params.daily_new_colors_count);

        self.creation_time.write(starknet::get_block_timestamp());
        let mut start_time = init_params.start_time;
        if start_time == 0 {
            start_time = starknet::get_block_timestamp();
        }
        self.end_time.write(init_params.end_time);
        self.day_index.write(0);
        self.emit(NewDay { day_index: 0, start_time: start_time });

        if init_params.devmode {
            let test_address = starknet::contract_address_const::<
                0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
            >();
            self.extra_pixels.write(test_address, 100000);
        }
        self.devmode.write(init_params.devmode);

        self.daily_quests_count.write(init_params.daily_quests_count);
    }

    #[abi(embed_v0)]
    impl ArtPeaceImpl of IArtPeace<ContractState> {
        // fn get_pixel(self: @ContractState, pos: u128) -> Pixel {
        //     self.canvas.read(pos)
        // }

        // fn get_pixel_color(self: @ContractState, pos: u128) -> u8 {
        //     self.canvas.read(pos).color
        // }

        // fn get_pixel_owner(self: @ContractState, pos: u128) -> ContractAddress {
        //     self.canvas.read(pos).owner
        // }

        // fn get_pixel_xy(self: @ContractState, x: u128, y: u128) -> Pixel {
        //     let pos = x + y * self.canvas_width.read();

        //     self.canvas.read(pos)
        // }

        fn get_width(self: @ContractState) -> u128 {
            self.canvas_width.read()
        }

        fn get_height(self: @ContractState) -> u128 {
            self.canvas_height.read()
        }

        fn get_total_pixels(self: @ContractState) -> u128 {
            self.total_pixels.read()
        }

        fn get_host(self: @ContractState) -> ContractAddress {
            self.host.read()
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
                place_basic_pixel_inner(ref self, pos, color, now);
                pixels_placed += 1;
                if pixels_placed == pixel_count {
                    return;
                }
            }

            pixels_placed =
                place_chain_faction_pixels_inner(ref self, positions, colors, pixels_placed, now);
            if pixels_placed == pixel_count {
                return;
            }

            pixels_placed =
                place_user_faction_pixels_inner(ref self, positions, colors, pixels_placed, now);
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
                place_pixel_inner(ref self, pos, color);
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

        // TODO: Tests
        fn init_faction(
            ref self: ContractState,
            name: felt252,
            leader: ContractAddress,
            joinable: bool,
            allocation: u32
        ) {
            // TODO: Init with members?
            assert(
                starknet::get_caller_address() == self.host.read(), 'Factions are set by the host'
            );
            self.check_game_running();
            let faction_id = self.factions_count.read() + 1;
            let faction = Faction { name, leader, joinable, allocation };
            self.factions.write(faction_id, faction);
            self.factions_count.write(faction_id);
            self.emit(FactionCreated { faction_id, name, leader, joinable, allocation });
        }

        fn change_faction_leader(
            ref self: ContractState, faction_id: u32, new_leader: ContractAddress
        ) {
            self.check_game_running();
            assert(faction_id != 0, 'Faction 0 is not changeable');
            assert(faction_id <= self.factions_count.read(), 'Faction does not exist');
            assert(
                starknet::get_caller_address() == self.host.read()
                    || starknet::get_caller_address() == self.factions.read(faction_id).leader,
                'Host or leader changes leader'
            );
            let mut faction = self.factions.read(faction_id);
            faction.leader = new_leader;
            self.factions.write(faction_id, faction);
            self.emit(FactionLeaderChanged { faction_id, new_leader });
        }

        fn init_chain_faction(ref self: ContractState, name: felt252) {
            assert(
                starknet::get_caller_address() == self.host.read(), 'Factions are set by the host'
            );
            self.check_game_running();
            let faction_id = self.chain_factions_count.read() + 1;
            let chain_faction = ChainFaction { name };
            self.chain_factions.write(faction_id, chain_faction);
            self.chain_factions_count.write(faction_id);
            self.emit(ChainFactionCreated { faction_id, name });
        }

        fn join_faction(ref self: ContractState, faction_id: u32) {
            self.check_game_running();
            assert(faction_id != 0, 'Faction 0 is not joinable');
            assert(faction_id <= self.factions_count.read(), 'Faction does not exist');
            assert(
                self.users_faction.read(starknet::get_caller_address()) == 0,
                'User already in a faction'
            );
            let caller = starknet::get_caller_address();
            let faction = self.factions.read(faction_id);
            assert(faction.joinable, 'Faction is not joinable');
            self.users_faction.write(caller, faction_id);
            self.emit(FactionJoined { faction_id, user: caller });
        }

        // TODO
        // fn leave_faction(ref self: ContractState) {
        //     self.check_game_running();
        //     let caller = starknet::get_caller_address();
        //     let faction_id = self.users_faction.read(caller);
        //     self.users_faction.write(caller, 0);
        //     self.emit(FactionLeft { faction_id, user: caller });
        // }

        fn join_chain_faction(ref self: ContractState, faction_id: u32) {
            self.check_game_running();
            assert(faction_id != 0, 'Faction 0 is not joinable');
            assert(faction_id <= self.chain_factions_count.read(), 'Faction does not exist');
            assert(
                self.users_chain_faction.read(starknet::get_caller_address()) == 0,
                'User already in a chain faction'
            );
            let caller = starknet::get_caller_address();
            self.users_chain_faction.write(caller, faction_id);
            self.emit(ChainFactionJoined { faction_id, user: caller });
        }

        fn get_user_faction(self: @ContractState, user: ContractAddress) -> u32 {
            self.users_faction.read(user)
        }

        fn get_user_chain_faction(self: @ContractState, user: ContractAddress) -> u32 {
            self.users_chain_faction.read(user)
        }

        fn get_user_faction_members_pixels(
            self: @ContractState, user: ContractAddress, now: u64
        ) -> u32 {
            let faction_id = self.users_faction.read(user);
            if faction_id == 0 {
                // 0 => no faction
                return 0;
            }
            let member_metadata = self.users_faction_meta.read(user);
            if member_metadata.member_pixels > 0 {
                // TODO: If member_pixels > 0 && < allocation && enough time has passed, return
                // allocation instead of member_pixels
                return member_metadata.member_pixels;
            } else {
                let time_since_last_pixel = now - member_metadata.member_placed_time;
                // TODO: Setup time_between_member_pixels
                if time_since_last_pixel < self.time_between_member_pixels.read() {
                    return 0;
                } else {
                    return self.factions.read(faction_id).allocation;
                }
            }
        }

        fn get_chain_faction_members_pixels(
            self: @ContractState, user: ContractAddress, now: u64
        ) -> u32 {
            let faction_id = self.users_chain_faction.read(user);
            if faction_id == 0 {
                // 0 => no faction
                return 0;
            }
            let member_metadata = self.users_chain_faction_meta.read(user);
            if member_metadata.member_pixels > 0 {
                return member_metadata.member_pixels;
            } else {
                let time_since_last_pixel = now - member_metadata.member_placed_time;
                if time_since_last_pixel < self.time_between_member_pixels.read() {
                    return 0;
                } else {
                    return 2; // Chain faction allocation
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
            self.check_game_running();
            let day = self.day_index.read();
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

        fn get_user_vote(self: @ContractState, user: ContractAddress, day: u32) -> u8 {
            self.user_votes.read((user, day))
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
            self.check_game_running();
            let block_timestamp = starknet::get_block_timestamp();
            let start_day_time = self.start_day_time.read();

            if !self.devmode.read() {
                assert(block_timestamp >= start_day_time + DAY_IN_SECONDS, 'day has not passed');
            }
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
            self.check_game_running();
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
            self.check_game_running();
            assert(
                starknet::get_caller_address() == self.host.read(), 'Quests are set by the host'
            );
            let quest_count = self.main_quests_count.read();
            let mut i = quest_count;
            let end = i + quests.len();
            while i < end {
                self.main_quests.write(i, *quests.at(i - quest_count));
                i += 1;
            };
            self.main_quests_count.write(end);
        }

        fn claim_today_quest(ref self: ContractState, quest_id: u32, calldata: Span<felt252>) {
            self.check_game_running();
            let day_index = self.day_index.read();
            let quest = self.daily_quests.read((day_index, quest_id));
            assert(quest != starknet::contract_address_const::<0>(), 'This quest is unavailable');
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
            self
                .emit(
                    ExtraPixelsAwarded::DailyQuest(
                        DailyQuestClaimed { day_index, quest_id, user, reward, calldata }
                    )
                );
        }

        fn claim_main_quest(ref self: ContractState, quest_id: u32, calldata: Span<felt252>) {
            self.check_game_running();
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
            self
                .emit(
                    ExtraPixelsAwarded::MainQuest(
                        MainQuestClaimed { quest_id, user, reward, calldata }
                    )
                );
        }

        fn get_nft_contract(self: @ContractState) -> ContractAddress {
            self.nft_contract.read()
        }

        fn add_faction_template(
            ref self: ContractState, template_metadata: FactionTemplateMetadata
        ) {
            self.check_game_running();
            assert(
                starknet::get_caller_address() == self.host.read()
                    || starknet::get_caller_address() == self
                        .factions
                        .read(template_metadata.faction_id)
                        .leader,
                'Host or leader sets templates'
            );
            assert(
                template_metadata.position < self.canvas_width.read() * self.canvas_height.read(),
                'Template position out of bounds'
            );
            let MAX_TEMPLATE_SIZE: u128 = 256;
            let MIN_TEMPLATE_SIZE: u128 = 5;
            assert(
                template_metadata.width >= MIN_TEMPLATE_SIZE
                    && template_metadata.width <= MAX_TEMPLATE_SIZE,
                'Template width out of bounds'
            );
            assert(
                template_metadata.height >= MIN_TEMPLATE_SIZE
                    && template_metadata.height <= MAX_TEMPLATE_SIZE,
                'Template height out of bounds'
            );
            assert(
                template_metadata.faction_id <= self.factions_count.read(), 'Faction does not exist'
            );
            let template_id = self.faction_templates_count.read();
            self.faction_templates.write(template_id, template_metadata);
            self.faction_templates_count.write(template_id + 1);
            self.emit(FactionTemplateAdded { template_id, template_metadata });
        }

        fn remove_faction_template(ref self: ContractState, template_id: u32) {
            self.check_game_running();
            let template_metadata = self.faction_templates.read(template_id);
            assert(
                starknet::get_caller_address() == self.host.read()
                    || starknet::get_caller_address() == self
                        .factions
                        .read(template_metadata.faction_id)
                        .leader,
                'Host or leader sets templates'
            );
            // Don't need to actually remove the template, just mark it as removed
            self.emit(FactionTemplateRemoved { template_id });
        }

        fn add_chain_faction_template(
            ref self: ContractState, template_metadata: FactionTemplateMetadata
        ) {
            self.check_game_running();
            assert(starknet::get_caller_address() == self.host.read(), 'Host sets chain templates');
            assert(
                template_metadata.position < self.canvas_width.read() * self.canvas_height.read(),
                'Template position out of bounds'
            );
            let MAX_TEMPLATE_SIZE: u128 = 256;
            let MIN_TEMPLATE_SIZE: u128 = 5;
            assert(
                template_metadata.width >= MIN_TEMPLATE_SIZE
                    && template_metadata.width <= MAX_TEMPLATE_SIZE,
                'Template width out of bounds'
            );
            assert(
                template_metadata.height >= MIN_TEMPLATE_SIZE
                    && template_metadata.height <= MAX_TEMPLATE_SIZE,
                'Template height out of bounds'
            );
            assert(
                template_metadata.faction_id <= self.chain_factions_count.read(),
                'Faction does not exist'
            );
            let template_id = self.chain_faction_templates_count.read();
            self.chain_faction_templates.write(template_id, template_metadata);
            self.chain_faction_templates_count.write(template_id + 1);
            self.emit(ChainFactionTemplateAdded { template_id, template_metadata });
        }

        fn remove_chain_faction_template(ref self: ContractState, template_id: u32) {
            self.check_game_running();
            assert(starknet::get_caller_address() == self.host.read(), 'Host sets chain templates');
            // Don't need to actually remove the template, just mark it as removed
            self.emit(ChainFactionTemplateRemoved { template_id });
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

        fn host_set_timer(ref self: ContractState, time: u64) {
            assert(starknet::get_caller_address() == self.host.read(), 'Host sets timer');
            self.time_between_pixels.write(time);
            self.time_between_member_pixels.write(time);
        }

        fn host_award_user(ref self: ContractState, user: starknet::ContractAddress, amount: u32) {
            assert(starknet::get_caller_address() == self.host.read(), 'Host awards user');
            self.extra_pixels.write(user, self.extra_pixels.read(user) + amount);
            self.emit(ExtraPixelsAwarded::HostAwardedUser(HostAwardedUser { user, amount }));
        }

        fn host_change_end_time(ref self: ContractState, new_end_time: u64) {
            assert(starknet::get_caller_address() == self.host.read(), 'Host changes end time');
            self.end_time.write(new_end_time);
        }

        fn already_liked_nft(self: @ContractState, user: ContractAddress, nft_id: u256) -> bool {
            self.liked_nfts.read((user, nft_id))
        }
    }

    #[abi(embed_v0)]
    impl ArtPeaceNFTMinter of IArtPeaceNFTMinter<ContractState> {
        fn add_nft_contract(ref self: ContractState, nft_contract: ContractAddress) {
            self.check_game_running();
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
            self.check_game_running();
            // TODO: To config?
            let MIN_NFT_SIZE: u128 = 1;
            let MAX_NFT_SIZE: u128 = 256;
            assert(
                mint_params.width >= MIN_NFT_SIZE && mint_params.width <= MAX_NFT_SIZE,
                'NFT width out of bounds'
            );
            assert(
                mint_params.height >= MIN_NFT_SIZE && mint_params.height <= MAX_NFT_SIZE,
                'NFT height out of bounds'
            );
            assert(
                mint_params.position < self.canvas_width.read() * self.canvas_height.read(),
                'NFT position out of bounds'
            );
            let metadata = NFTMetadata {
                position: mint_params.position,
                width: mint_params.width,
                height: mint_params.height,
                name: mint_params.name,
                image_hash: 0, // TODO
                block_number: starknet::get_block_number(),
                day_index: self.day_index.read(),
                minter: starknet::get_caller_address(),
            };
            ICanvasNFTAdditionalDispatcher { contract_address: self.nft_contract.read(), }
                .mint(metadata, starknet::get_caller_address());
        }

        fn set_nft_base_uri(ref self: ContractState, base_uri: ByteArray) {
            // Use incase of changes in the backed routing
            assert(
                starknet::get_caller_address() == self.host.read(),
                'NFT base URI is set by the host'
            );
            ICanvasNFTAdditionalDispatcher { contract_address: self.nft_contract.read() }
                .set_base_uri(base_uri);
        }
    }


    #[abi(embed_v0)]
    impl ArtPeaceTemplateVerifier of ITemplateVerifier<ContractState> {
        fn compute_template_hash(self: @ContractState, template: Span<u8>) -> felt252 {
            let template_len = template.len();
            if template_len == 0 {
                return 0;
            }

            let mut hasher = PoseidonTrait::new();
            let mut i = 0;
            while i < template_len {
                hasher = hasher.update_with(*template.at(i));
                i += 1;
            };

            hasher.finalize()
        }

        fn complete_template(ref self: ContractState, template_id: u32, template_image: Span<u8>) {
            self.check_game_running();
            assert(template_id < self.get_templates_count(), 'Template ID out of bounds');
            assert(!self.is_template_complete(template_id), 'Template already completed');
            let template_metadata: TemplateMetadata = self.get_template(template_id);
            assert(template_metadata.reward == 0, 'Template has a reward');
            let template_hash = self.compute_template_hash(template_image);
            assert(template_hash == template_metadata.hash, 'Template hash mismatch');
            let template_size = template_metadata.width * template_metadata.height;
            assert(template_image.len().into() == template_size, 'Template image size mismatch');

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
                            let _pos = template_pos_x + x + (template_pos_y + y) * canvas_width;
                            let _color = *template_image
                                .at((x + y * template_metadata.width).try_into().unwrap());
                            // TODO: Check if the color is transparent
                            // TODO: Add back
                            // if color == self.canvas.read(pos).color {
                            if false {
                                matches += 1;
                            }
                            x += 1;
                        };
                    y += 1;
                };

            // TODO: Allow some threshold?
            if matches == template_metadata.width * template_metadata.height {
                self.templates.completed_templates.write(template_id, true);
            // self.emit(Event::TemplateEvent::TemplateCompleted { template_id });
            }
        }

        // TODO: Change to have users claim rewards
        fn complete_template_with_rewards(
            ref self: ContractState, template_id: u32, template_image: Span<u8>
        ) {
            self.check_game_running();
            assert(template_id < self.get_templates_count(), 'Template ID out of bounds');
            assert(!self.is_template_complete(template_id), 'Template already completed');
            let template_metadata: TemplateMetadata = self.get_template(template_id);
            assert(template_metadata.reward > 0, 'Template has no reward');
            let template_hash = self.compute_template_hash(template_image);
            assert(template_hash == template_metadata.hash, 'Template hash mismatch');
            let template_size = template_metadata.width * template_metadata.height;
            assert(template_image.len().into() == template_size, 'Template image size mismatch');

            let contract = starknet::get_contract_address();
            let mut pixel_contributors: Array<ContractAddress> = ArrayTrait::new();
            let mut total_pixels_by_user: Felt252Dict<u32> = Default::default();
            let mut pixel_contributors_indexes: Felt252Dict<u32> = Default::default();
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
                            let _pos = template_pos_x + x + (template_pos_y + y) * canvas_width;
                            let _color = *template_image
                                .at((x + y * template_metadata.width).try_into().unwrap());
                            // TODO: Check if the color is transparent
                            // TODO: Add back
                            // if color == self.canvas.read(pos).color {
                            if false {
                                matches += 1;

                                let mut pixel_owner = starknet::contract_address_const::<
                                    0
                                >(); // TODO: self.canvas.read(pos).owner;
                                let user_index = pixel_contributors_indexes.get(pixel_owner.into());

                                if user_index == 0 {
                                    let new_index = pixel_contributors.len() + 1;

                                    pixel_contributors.append(pixel_owner);
                                    pixel_contributors_indexes
                                        .insert(pixel_owner.into(), new_index);
                                    total_pixels_by_user.insert(new_index.into(), 1);
                                } else {
                                    let count = total_pixels_by_user.get(user_index.into());
                                    total_pixels_by_user.insert(user_index.into(), count + 1);
                                }
                            }
                            x += 1;
                        };
                    y += 1;
                };

            // TODO: Allow some threshold?
            if matches == template_metadata.width * template_metadata.height {
                self.templates.completed_templates.write(template_id, true);
                // Distribute rewards
                let mut i = 0;
                while i < pixel_contributors
                    .len() {
                        let reward_token = template_metadata.reward_token;
                        let reward_amount = template_metadata.reward;
                        let total_pixels_in_template = template_metadata.width
                            * template_metadata.height;

                        let mut user = *pixel_contributors.at(i).into();
                        let user_index = (i + 1);
                        let user_total_pixels = total_pixels_by_user.get(user_index.into());

                        // TODO: Handle remainder of funds
                        let user_reward = (reward_amount * user_total_pixels.into())
                            / total_pixels_in_template.into();

                        assert(
                            IERC20Dispatcher { contract_address: reward_token }
                                .balance_of(contract) >= user_reward,
                            'insufficient funds'
                        );
                        let success = IERC20Dispatcher { contract_address: reward_token }
                            .transfer(user, user_reward);
                        assert(success, 'ERC20 transfer fail!');
                        i += 1;
                    };
            // self.emit(Event::TemplateEvent::TemplateCompleted { template_id });
            }
        }
    }

    #[abi(embed_v0)]
    impl ArtPeaceCanvasNFTLikeAndUnlike of ICanvasNFTLikeAndUnlike<ContractState> {
        fn like_nft(ref self: ContractState, token_id: u256) {
            let caller = starknet::get_caller_address();
            assert(!self.already_liked_nft(caller, token_id), 'already liked this nft');
            let nft_address = self.nft_contract.read();
            ICanvasNFTLikeAndUnlikeDispatcher { contract_address: nft_address }.like_nft(token_id);
            let nft_owner = IERC721Dispatcher { contract_address: nft_address }.owner_of(token_id);

            // award the minter of the nft 1 extra pixel each time someone likes the nft
            self.extra_pixels.write(nft_owner, self.extra_pixels.read(nft_owner) + 1);
            self.emit(ExtraPixelsAwarded::LikeNft(LikeNftAwarded { user: nft_owner, amount: 1 }));
            self.liked_nfts.write((caller, token_id), true);
        }
        fn unlike_nft(ref self: ContractState, token_id: u256) {
            ICanvasNFTLikeAndUnlikeDispatcher { contract_address: self.nft_contract.read() }
                .unlike_nft(token_id);
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
            threshold = 1;
        }

        // update palette & votable colors
        let next_day = day + 1;
        let start_day_time = self.start_day_time.read();
        let end_day_time = start_day_time + DAY_IN_SECONDS;
        let end_game_time = self.end_time.read();
        let start_new_vote: bool = end_day_time < end_game_time;
        let mut color_index = self.color_count.read();
        let mut next_day_votable_index = 1;
        votable_index = 1;
        while votable_index <= votable_colors_count {
            let vote = self.color_votes.read((votable_index, day));
            let color = self.votable_colors.read((votable_index, day));
            if vote >= threshold {
                self.color_palette.write(color_index, color);
                self.emit(ColorAdded { color_key: color_index, color });
                color_index += 1;
            } else if start_new_vote {
                self.votable_colors.write((next_day_votable_index, next_day), color);
                self
                    .emit(
                        VotableColorAdded {
                            day: next_day, color_key: next_day_votable_index, color
                        }
                    );
                next_day_votable_index += 1;
            }
            votable_index += 1;
        };
        self.color_count.write(color_index);
        if start_new_vote {
            self.votable_colors_count.write(next_day, next_day_votable_index - 1);
        }
    }

    fn place_pixel_inner(ref self: ContractState, pos: u128, color: u8) {
        self.check_valid_pixel(pos, color);

        let caller = starknet::get_caller_address();
        // TODO: let pixel = Pixel { color, owner: caller };
        // TODO: self.canvas.write(pos, pixel);
        let day = self.day_index.read();
        self
            .user_pixels_placed
            .write((day, caller, color), self.user_pixels_placed.read((day, caller, color)) + 1);
        // TODO: Optimize?
        self.emit(PixelPlaced { placed_by: caller, pos, day, color });
    }

    // TODO: Make the function internal
    fn place_basic_pixel_inner(ref self: ContractState, pos: u128, color: u8, now: u64) {
        place_pixel_inner(ref self, pos, color);
        let caller = starknet::get_caller_address();
        self.last_placed_time.write(caller, now);
        self.emit(BasicPixelPlaced { placed_by: caller, timestamp: now });
    }

    fn place_user_faction_pixels_inner(
        ref self: ContractState, positions: Span<u128>, colors: Span<u8>, mut offset: u32, now: u64
    ) -> u32 {
        let faction_pixels = self
            .get_user_faction_members_pixels(starknet::get_caller_address(), now);
        if faction_pixels == 0 {
            return offset;
        }

        let pixel_count = positions.len();
        let mut faction_pixels_left = faction_pixels;
        while faction_pixels_left > 0 {
            let pos = *positions.at(offset);
            let color = *colors.at(offset);
            place_pixel_inner(ref self, pos, color);
            offset += 1;
            faction_pixels_left -= 1;
            if offset == pixel_count {
                break;
            }
        };
        let caller = starknet::get_caller_address();
        if faction_pixels_left == 0 {
            let new_member_metadata = MemberMetadata { member_placed_time: now, member_pixels: 0 };
            self.users_faction_meta.write(caller, new_member_metadata);
            self.emit(FactionPixelsPlaced { user: caller, placed_time: now, member_pixels: 0 });
        } else {
            let last_placed_time = self.users_faction_meta.read(caller).member_placed_time;
            let new_member_metadata = MemberMetadata {
                member_placed_time: last_placed_time, member_pixels: faction_pixels_left
            };
            self.users_faction_meta.write(caller, new_member_metadata);
            self
                .emit(
                    FactionPixelsPlaced {
                        user: caller,
                        placed_time: last_placed_time,
                        member_pixels: faction_pixels_left
                    }
                );
        }
        return offset;
    }

    fn place_chain_faction_pixels_inner(
        ref self: ContractState, positions: Span<u128>, colors: Span<u8>, mut offset: u32, now: u64
    ) -> u32 {
        let pixel_count = positions.len();
        let caller = starknet::get_caller_address();
        let member_pixels = self.get_chain_faction_members_pixels(caller, now);
        let mut member_pixels_left = member_pixels;
        while member_pixels_left > 0 {
            let pos = *positions.at(offset);
            let color = *colors.at(offset);
            place_pixel_inner(ref self, pos, color);
            offset += 1;
            member_pixels_left -= 1;
            if offset == pixel_count {
                break;
            }
        };
        let caller = starknet::get_caller_address();
        if member_pixels != 0 {
            if member_pixels_left == 0 {
                let new_member_metadata = MemberMetadata {
                    member_placed_time: now, member_pixels: 0
                };
                self.users_chain_faction_meta.write(caller, new_member_metadata);
                self
                    .emit(
                        ChainFactionPixelsPlaced {
                            user: caller, placed_time: now, member_pixels: 0
                        }
                    );
            } else {
                let last_placed_time = self
                    .users_chain_faction_meta
                    .read(caller)
                    .member_placed_time;
                let new_member_metadata = MemberMetadata {
                    member_placed_time: last_placed_time, member_pixels: member_pixels_left
                };
                self.users_chain_faction_meta.write(caller, new_member_metadata);
                self
                    .emit(
                        ChainFactionPixelsPlaced {
                            user: caller,
                            placed_time: last_placed_time,
                            member_pixels: member_pixels_left
                        }
                    );
            }
        }
        return offset;
    }
}
