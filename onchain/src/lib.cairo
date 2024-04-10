pub mod art_peace;
pub mod interface;
use art_peace::ArtPeace;
use interface::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait, Pixel};

mod quests {
    pub mod interface;
    mod pixel_quest;

    use interface::{IQuest, QuestClaimed, IQuestDispatcher, IQuestDispatcherTrait};
}

mod templates {
    pub mod interface;
    mod component;

    use interface::{TemplateMetadata, ITemplateVerifier, ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher, ITemplateVerifierDispatcherTrait};
}

#[cfg(test)]
mod tests {
    mod art_peace;
}
