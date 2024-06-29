package quests

import "github.com/keep-starknet-strange/art-peace/backend/core"

// Quest types
const (
	AuthorityQuestType = iota
	HodlQuestType
	NFTMintQuestType
	PixelQuestType
	RainbowQuestType
	TemplateQuestType
	UnruggableQuestType
	VoteQuestType
	ChainFactionQuestType
	FactionQuestType
	UsernameQuestType
)

var OnchainQuestTypes = map[string]int{
	"AuthorityQuest":    AuthorityQuestType,
	"HodlQuest":         HodlQuestType,
	"NFTMintQuest":      NFTMintQuestType,
	"PixelQuest":        PixelQuestType,
	"RainbowQuest":      RainbowQuestType,
	"TemplateQuest":     TemplateQuestType,
	"UnruggableQuest":   UnruggableQuestType,
	"VoteQuest":         VoteQuestType,
	"ChainFactionQuest": ChainFactionQuestType,
	"FactionQuest":      FactionQuestType,
	"UsernameQuest":     UsernameQuestType,
}

type Quest struct {
	Type      int
	InputData []int
}

func (q *Quest) GetType() int {
	return q.Type
}

func (q *Quest) GetInputData() []int {
	return q.InputData
}

func NewDailyQuest(questIdx int, dayIdx int) *Quest {
	questTypeString, err := core.PostgresQueryOne[string]("SELECT quest_type FROM DailyQuests WHERE day_index = $1 AND quest_id = $2", dayIdx, questIdx)
	if err != nil {
		return nil
	}
	questType := OnchainQuestTypes[*questTypeString]

	questInputData, err := core.PostgresQuery[int]("SELECT input_value FROM DailyQuestsInput WHERE day_index = $1 AND quest_id = $2 ORDER BY input_key", dayIdx, questIdx)
	if err != nil {
		return nil
	}

	return &Quest{
		Type:      questType,
		InputData: questInputData,
	}
}

func NewDailyQuestWithType(questIdx int, questTypeStr string, dayIdx int) *Quest {
	questType := OnchainQuestTypes[questTypeStr]

	questInputData, err := core.PostgresQuery[int]("SELECT input_value FROM DailyQuestsInput WHERE day_index = $1 AND quest_id = $2 ORDER BY input_key", dayIdx, questIdx)
	if err != nil {
		return nil
	}

	return &Quest{
		Type:      questType,
		InputData: questInputData,
	}
}

func NewTodayQuestWithType(questIdx int, questTypeStr string) *Quest {
	questType := OnchainQuestTypes[questTypeStr]

	questInputData, err := core.PostgresQuery[int]("SELECT input_value FROM DailyQuestsInput WHERE day_index = (SELECT MAX(day_index) FROM Days) AND quest_id = $1 ORDER BY input_key", questIdx)
	if err != nil {
		return nil
	}

	return &Quest{
		Type:      questType,
		InputData: questInputData,
	}
}

func NewMainQuest(questIdx int) *Quest {
	questTypeString, err := core.PostgresQueryOne[string]("SELECT quest_type FROM MainQuests WHERE quest_id = $1", questIdx)
	if err != nil {
		return nil
	}
	questType := OnchainQuestTypes[*questTypeString]

	questInputData, err := core.PostgresQuery[int]("SELECT input_value FROM MainQuestsInput WHERE quest_id = $1 ORDER BY input_key", questIdx)
	if err != nil {
		return nil
	}

	return &Quest{
		Type:      questType,
		InputData: questInputData,
	}
}

func NewMainQuestWithType(questIdx int, questTypeStr string) *Quest {
	questType := OnchainQuestTypes[questTypeStr]

	questInputData, err := core.PostgresQuery[int]("SELECT input_value FROM MainQuestsInput WHERE quest_id = $1 ORDER BY input_key", questIdx)
	if err != nil {
		return nil
	}

	return &Quest{
		Type:      questType,
		InputData: questInputData,
	}
}
