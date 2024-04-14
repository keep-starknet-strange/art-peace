pub mod art_peace;
pub mod username_store;
pub mod interface;
use art_peace::ArtPeace;
use interface::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};
use username_store::UsernameStore;


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

#[cfg(test)]
mod tests {
    mod art_peace;
    mod username_store;
}
