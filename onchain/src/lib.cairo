pub mod art_peace;
pub mod username_store;
pub mod interfaces;
use art_peace::ArtPeace;
use interface::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};
use username_store::UsernameStore;


mod quests {
    pub mod interfaces;
    pub mod pixel_quest;

    use interfaces::{IQuest, IPixelQuest, QuestClaimed, IQuestDispatcher, IQuestDispatcherTrait};
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


mod mocks {
    pub mod erc20_mock;
}

#[cfg(test)]
mod tests {
    mod art_peace;
    pub mod username_store;
    pub(crate) mod utils;
}

