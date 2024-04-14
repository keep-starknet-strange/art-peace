pub mod art_peace;
pub mod interface;
use art_peace::ArtPeace;
use interface::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};

mod quests {
    pub mod interfaces;
    pub mod pixel_quest;

    use interfaces::{IQuest, IPixelQuest, QuestClaimed, IQuestDispatcher, IQuestDispatcherTrait};
}

mod templates {
    pub mod interface;
    pub mod component;

    use interface::{
        TemplateMetadata, ITemplateVerifier, ITemplateStoreDispatcher,
        ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher, ITemplateVerifierDispatcherTrait
    };
}

mod mocks {
    pub mod erc20_mock;
}

#[cfg(test)]
mod tests {
    mod art_peace;
    mod utils;
}
