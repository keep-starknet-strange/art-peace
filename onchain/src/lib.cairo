#[starknet::interface]
trait IArtPeace<TContractState> {
    fn place_pixel(ref self: TContractState, pos: u128, color: u8);
    fn place_pixel_xy(ref self: TContractState, x: u128, y: u128, color: u8);
    fn place_extra_pixels(ref self: TContractState, positions: Array<u128>, colors: Array<u8>);

    fn get_pixel(self: @TContractState, pos: u128) -> u8;
    fn get_pixel_xy(self: @TContractState, x: u128, y: u128) -> u8;

    fn get_total_pixels(self: @TContractState) -> u128;
    fn get_width(self: @TContractState) -> u128;
    fn get_height(self: @TContractState) -> u128;

    fn get_last_placed_time(self: @TContractState) -> u64;
    fn get_user_last_placed_time(self: @TContractState, user: starknet::ContractAddress) -> u64;
    fn get_time_between_pixels(self: @TContractState) -> u64;

    fn get_extra_pixels_count(self: @TContractState) -> u32;
    fn get_user_extra_pixels_count(self: @TContractState, user: starknet::ContractAddress) -> u32;

    fn get_color_count(self: @TContractState) -> u8;
    fn get_colors(self: @TContractState) -> Array<u32>;
}

#[starknet::contract]
mod ArtPeace {
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        canvas: LegacyMap::<u128, u8>,
        canvas_width: u128,
        canvas_height: u128,
        total_pixels: u128,
        // Maps the users contract address to the last time they placed a pixel
        last_placed_time: LegacyMap::<ContractAddress, u64>,
        time_between_pixels: u64,
        // Maps the users contract address to the amount of extra pixels they have
        extra_pixels: LegacyMap::<ContractAddress, u32>,
        // 3 byte HEX colors
        color_count: u8, // TODO: Remove and use colors.len()?
        colors: LegacyMap::<u32, u32>, // TODO
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
        color: u8,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, canvas_width: u128, canvas_height: u128, time_between_pixels: u64
    ) {
        self.canvas_width.write(canvas_width);
        self.canvas_height.write(canvas_height);
        self.total_pixels.write(canvas_width * canvas_height);

        self.time_between_pixels.write(time_between_pixels);

        // TODO
        self.color_count.write(12);
    //self.color_count.write(colors.len().try_into().unwrap());
    //let mut i = 0;
    //while i < colors.len() {
    //    self.colors.write(i, *colors.at(i));
    //    i += 1;
    //}
    }

    #[abi(embed_v0)]
    impl ArtPeaceImpl of super::IArtPeace<ContractState> {
        fn place_pixel(ref self: ContractState, pos: u128, color: u8) {
            assert!(pos < self.total_pixels.read());
            assert!(
                color < self.color_count.read()
            ); // TODO: remove and consider outside range as base color?
            let now = starknet::get_block_timestamp();
            let caller = starknet::get_caller_address();
            // TODO: Only if the user has placed a pixel before?
            assert!(now - self.last_placed_time.read(caller) >= self.time_between_pixels.read());
            self.canvas.write(pos, color);
            self.last_placed_time.write(caller, now);
            self.emit(PixelPlaced { placed_by: caller, pos, color });
        }

        fn place_pixel_xy(ref self: ContractState, x: u128, y: u128, color: u8) {
            let pos = x + y * self.canvas_width.read();
            self.place_pixel(pos, color);
        }

        fn place_extra_pixels(ref self: ContractState, positions: Array<u128>, colors: Array<u8>) {
            assert!(positions.len() == colors.len());
            let caller = starknet::get_caller_address();
            let extra_pixels = self.extra_pixels.read(caller);
            let pixel_count = positions.len();
            assert!(pixel_count <= extra_pixels);
            let mut i = 0;
            while i < pixel_count {
                let pos = *positions.at(i);
                let color = *colors.at(i);
                assert!(pos < self.total_pixels.read());
                assert!(color < self.color_count.read());
                self.canvas.write(pos, color);
                self.emit(PixelPlaced { placed_by: caller, pos, color });
                i += 1;
            };
            self.extra_pixels.write(caller, extra_pixels - pixel_count);
        }

        fn get_pixel(self: @ContractState, pos: u128) -> u8 {
            self.canvas.read(pos)
        }

        fn get_pixel_xy(self: @ContractState, x: u128, y: u128) -> u8 {
            let pos = x + y * self.canvas_width.read();
            self.canvas.read(pos)
        }

        fn get_total_pixels(self: @ContractState) -> u128 {
            self.total_pixels.read()
        }

        fn get_width(self: @ContractState) -> u128 {
            self.canvas_width.read()
        }

        fn get_height(self: @ContractState) -> u128 {
            self.canvas_height.read()
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
                // TODO
                colors.append(0x000000);
                //colors.append(self.colors.read(i));
                i += 1;
            };
            colors
        }
    }
}

#[cfg(test)]
mod tests {
    mod art_peace;
}
