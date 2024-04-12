pub mod art_peace;
pub mod username_store;
pub mod interface;
use art_peace::ArtPeace;
use interface::{IArtPeace, IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use username_store::UsernameStore;


mod quests {
    pub mod interface;
    mod pixel_quest;

    use interface::{IQuest, QuestClaimed, IQuestDispatcher, IQuestDispatcherTrait};
}

#[cfg(test)]
mod tests {
    mod art_peace;
    mod username_store;
}
