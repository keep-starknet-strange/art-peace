pub mod art_peace;
pub mod interface;
use art_peace::ArtPeace;
use interface::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};

mod quests {
    pub mod interfaces;
    mod pixel_quest;

    use interfaces::{IQuest, IQuestDispatcher, IQuestDispatcherTrait};
    use pixel_quest::PixelQuest::QuestClaimed;
}

mod templates {
    pub mod interfaces;
    pub mod component;

    use interfaces::{
        TemplateMetadata, ITemplateVerifier, ITemplateStoreDispatcher,
        ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher, ITemplateVerifierDispatcherTrait
    };
}

#[cfg(test)]
mod tests {
    mod art_peace;
}
