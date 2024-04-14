#[derive(Drop, Serde)]
pub struct NFTMintParams {
    pub position: u128,
    pub width: u128,
    pub height: u128,
}

#[derive(Drop, Serde, PartialEq, starknet::Store)]
pub struct NFTMetadata {
    pub position: u128,
    pub width: u128,
    pub height: u128,
    pub image_hash: felt252,
    pub block_number: u64,
    pub minter: starknet::ContractAddress,
}

#[starknet::interface]
pub trait ICanvasNFTStore<TContractState> {
    // Returns the on-chain metadata of the NFT.
    fn get_nft_metadata(self: @TContractState, token_id: u256) -> NFTMetadata;
    fn get_nft_minter(self: @TContractState, token_id: u256) -> starknet::ContractAddress;
    fn get_nft_image_hash(self: @TContractState, token_id: u256) -> felt252;

    // Returns the number of NFTs stored in the contract state.
    fn get_nfts_count(self: @TContractState) -> u256;
}

#[starknet::interface]
pub trait ICanvasNFTAdditional<TContractState> {
    // Mint a new NFT called by the ArtPeaceNFTMinter contract.
    fn mint(ref self: TContractState, metadata: NFTMetadata, receiver: starknet::ContractAddress);
}

#[starknet::interface]
pub trait IArtPeaceNFTMinter<TContractState> {
    // Mints a new NFT from the canvas using init params, and returns the token ID.
    fn mint_nft(self: @TContractState, mint_params: NFTMintParams);
}
