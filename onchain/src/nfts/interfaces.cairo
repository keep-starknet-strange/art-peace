#[derive(Drop, Serde)]
pub struct NFTMintParams {
    pub position: u128,
    pub width: u128,
    pub height: u128,
    pub name: felt252,
}

#[derive(Drop, Copy, Serde, PartialEq, starknet::Store)]
pub struct NFTMetadata {
    pub position: u128,
    pub width: u128,
    pub height: u128,
    pub name: felt252,
    pub image_hash: felt252,
    pub block_number: u64,
    pub day_index: u32,
    pub minter: starknet::ContractAddress,
}

#[starknet::interface]
pub trait ICanvasNFTStore<TContractState> {
    // Returns the on-chain metadata of the NFT.
    fn get_nft_metadata(self: @TContractState, token_id: u256) -> NFTMetadata;
    fn get_nft_minter(self: @TContractState, token_id: u256) -> starknet::ContractAddress;
    fn get_nft_image_hash(self: @TContractState, token_id: u256) -> felt252;
    fn get_nft_day_index(self: @TContractState, token_id: u256) -> u32;

    // Returns the number of NFTs stored in the contract state.
    fn get_nfts_count(self: @TContractState) -> u256;
}

#[starknet::interface]
pub trait ICanvasNFTAdditional<TContractState> {
    // Sets up the contract addresses
    fn set_canvas_contract(ref self: TContractState, canvas_contract: starknet::ContractAddress);
    // Mint a new NFT called by the ArtPeaceNFTMinter contract.
    fn mint(ref self: TContractState, metadata: NFTMetadata, receiver: starknet::ContractAddress);
    // Change the base uri of the NFTs.
    fn set_base_uri(ref self: TContractState, base_uri: ByteArray);
}

#[starknet::interface]
pub trait IArtPeaceNFTMinter<TContractState> {
    // Sets up the contract addresses
    fn add_nft_contract(ref self: TContractState, nft_contract: starknet::ContractAddress);
    // Mints a new NFT from the canvas using init params, and returns the token ID.
    fn mint_nft(ref self: TContractState, mint_params: NFTMintParams);
    // Change the base uri of the NFTs.
    fn set_nft_base_uri(ref self: TContractState, base_uri: ByteArray);
}

#[starknet::interface]
pub trait ICanvasNFTLikeAndUnlike<TContractState> {
    fn like_nft(ref self: TContractState, token_id: u256);
    fn unlike_nft(ref self: TContractState, token_id: u256);
}

