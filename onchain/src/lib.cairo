pub mod art_peace;
pub mod canvas_factory;
pub mod canvas;
pub mod multi_canvas;
pub mod interfaces;
use art_peace::ArtPeace;
use interfaces::{
    IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel, Faction, ChainFaction,
    MemberMetadata
};

mod quests {
    pub mod authority_quest;
    pub mod interfaces;
    pub mod pixel_quest;
    pub mod username_quest;
    pub mod rainbow_quest;
    pub mod template_quest;
    pub mod unruggable_quest;
    pub mod nft_quest;
    pub mod hodl_quest;
    pub mod faction_quest;
    pub mod chain_faction_quest;
    pub mod vote_quest;

    use interfaces::{
        IQuest, IAuthorityQuest, IPixelQuest, IRainbowQuest, IUnruggableQuest, IQuestDispatcher,
        IQuestDispatcherTrait, IUnruggableMemecoin, IUnruggableMemecoinDispatcher,
        IUnruggableMemecoinDispatcherTrait
    };
}

mod templates {
    pub mod interfaces;
    pub mod component;

    use interfaces::{
        FactionTemplateMetadata, TemplateMetadata, ITemplateVerifier, ITemplateStoreDispatcher,
        ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher, ITemplateVerifierDispatcherTrait
    };
}

mod nfts {
    pub mod interfaces;
    pub mod component;
    mod canvas_nft;

    use interfaces::{
        NFTMintParams, NFTMetadata, IArtPeaceNFTMinter, ICanvasNFTStoreDispatcher,
        ICanvasNFTStoreDispatcherTrait, IArtPeaceNFTMinterDispatcher,
        IArtPeaceNFTMinterDispatcherTrait, ICanvasNFTAdditional, ICanvasNFTLikeAndUnlike,
        ICanvasNFTAdditionalDispatcher, ICanvasNFTAdditionalDispatcherTrait
    };
}

mod username_store {
    pub mod interfaces;
    pub mod username_store;

    use interfaces::{IUsernameStore, IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait};
    use username_store::UsernameStore;
}

mod mocks {
    pub(crate) mod erc20_mock;
    pub(crate) mod unruggable_token;
}

#[cfg(test)]
mod tests {
    pub(crate) mod art_peace;
    pub(crate) mod username_store;
    pub(crate) mod authority_quest;
    pub(crate) mod username_quest;
    pub(crate) mod color_voting;
    pub(crate) mod nft_quest;
    pub(crate) mod hodl_quest;
    pub(crate) mod pixel_quest;
    pub(crate) mod faction_quest;
    pub(crate) mod chain_faction_quest;
    pub(crate) mod rainbow_quest;
    pub(crate) mod template_quest;
    pub(crate) mod unruggable_quest;
    pub(crate) mod vote_quest;
    pub(crate) mod utils;
}

