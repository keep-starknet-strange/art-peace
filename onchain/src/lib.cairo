pub mod art_peace;
pub mod interfaces;
use art_peace::ArtPeace;
use interfaces::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};


mod quests {
    pub mod interfaces;
    pub mod pixel_quest;
    pub mod unruggable_quest;

    use interfaces::{
        IQuest, IPixelQuest, IUnruggableQuest, QuestClaimed, IQuestDispatcher,
        IQuestDispatcherTrait, IUnruggableMemecoin, IUnruggableMemecoinDispatcher, IUnruggableMemecoinDispatcherTrait
    };
}

mod templates {
    pub mod interfaces;
    pub mod component;

    use interfaces::{
        TemplateMetadata, ITemplateVerifier, ITemplateStoreDispatcher,
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
        IArtPeaceNFTMinterDispatcherTrait, ICanvasNFTAdditional, ICanvasNFTAdditionalDispatcher,
        ICanvasNFTAdditionalDispatcherTrait
    };
}

mod username_store {
    pub mod interfaces;
    pub mod username_store;

    use interfaces::{IUsernameStore, IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait};
    use username_store::UsernameStore;
}

mod mocks {
    pub mod erc20_mock;
}

#[cfg(test)]
mod tests {
    mod art_peace;
    mod username_store;
    pub(crate) mod utils;
}

