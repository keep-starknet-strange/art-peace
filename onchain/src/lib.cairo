pub mod art_peace;
pub mod interfaces;
use art_peace::ArtPeace;
use interfaces::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};


mod quests {
    pub mod authority_quest;
    pub mod interfaces;
    pub mod pixel_quest;
    pub mod rainbow_quest;
    pub mod template_quest;
    pub mod unruggable_quest;

    use interfaces::{
        IQuest, IAuthorityQuest, IPixelQuest, IRainbowQuest, IUnruggableQuest, QuestClaimed,
        IQuestDispatcher, IQuestDispatcherTrait, IUnruggableMemecoin, IUnruggableMemecoinDispatcher,
        IUnruggableMemecoinDispatcherTrait
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
    pub(crate) mod erc20_mock;
    pub(crate) mod unruggable_token;
}

#[cfg(test)]
mod tests {
    mod art_peace;
    mod username_store;
    mod template_quest;
    mod authority_quest;
    pub(crate) mod rainbow_quest;
    pub(crate) mod utils;
}

