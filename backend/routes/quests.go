package routes

import (
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

// the Quest struct will represent the structure for both Daily and Main Quests data
type DailyQuest struct {
	Key         int    `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Reward      int    `json:"reward"`
	DayIndex    int    `json:"dayIndex"`
}

type MainQuest struct {
  Key         int    `json:"key"`
  Name        string `json:"name"`
  Description string `json:"description"`
  Reward      int    `json:"reward"`
}

func InitQuestsRoutes() {
	http.HandleFunc("/getDailyQuests", GetDailyQuests)
	http.HandleFunc("/getMainQuests", GetMainQuests)
}

func GetDailyQuests(w http.ResponseWriter, r *http.Request) {
  quests, err := core.PostgresQueryJson[DailyQuest]("SELECT key, name, description, reward, day_index FROM DailyQuests ORDER BY day_index ASC")
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quests")
    return
  }

  WriteDataJson(w, string(quests))
}

func GetMainQuests(w http.ResponseWriter, r *http.Request) {
  quests, err := core.PostgresQueryJson[MainQuest]("SELECT key, name, description, reward FROM MainQuests")
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quests")
    return
  }

  WriteDataJson(w, string(quests))
}
