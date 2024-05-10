package routes

import (
	"context"
	"net/http"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

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

type QuestContractConfig struct {
  Type string `json:"type"`
  InitParams []string `json:"initParams"`
}

type QuestConfig struct {
  Name string `json:"name"`
  Description string `json:"description"`
  Reward int `json:"reward"`
  ContractConfig QuestContractConfig `json:"questContract"`
}

type DailyQuestConfig struct {
  Day int `json:"day"`
  Quests []QuestConfig `json:"quests"`
}

type QuestsConfig struct {
  DailyQuests struct {
    DailyQuestsCount int `json:"dailyQuestsCount"`
    Quests []DailyQuestConfig `json:"dailyQuests"`
  } `json:"daily"`
  MainQuests struct {
    Quests []QuestConfig `json:"mainQuests"`
  } `json:"main"`
}

func InitQuestsRoutes() {
  http.HandleFunc("/init-quests", InitQuests)
	http.HandleFunc("/get-daily-quests", GetDailyQuests)
	http.HandleFunc("/get-main-quests", GetMainQuests)
	http.HandleFunc("/get-todays-quests", getTodaysQuests)
	http.HandleFunc("/get-completed-daily-quests", GetCompletedDailyQuests)
	http.HandleFunc("/get-completed-main-quests", GetCompletedMainQuests)
	http.HandleFunc("/get-today-start-time", GetTodayStartTime)
}

func InitQuests(w http.ResponseWriter, r *http.Request) {
  // Only allow admin to initialize colors
  if AdminMiddleware(w, r) {
    return
  }

  // TODO: check if quests already exist
  questJson, err := ReadJsonBody[QuestsConfig](r)
  if err != nil {
    WriteErrorJson(w, http.StatusBadRequest, "Failed to parse request body")
    return
  }

  for _, dailyQuestConfig := range questJson.DailyQuests.Quests {
    for _, questConfig := range dailyQuestConfig.Quests {
      _, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO DailyQuests (name, description, reward, day_index) VALUES ($1, $2, $3, $4)", questConfig.Name, questConfig.Description, questConfig.Reward, dailyQuestConfig.Day - 1)
      if err != nil {
        WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert daily quest")
        return
      }
    }
  }

  for _, questConfig := range questJson.MainQuests.Quests {
    _, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO MainQuests (name, description, reward) VALUES ($1, $2, $3)", questConfig.Name, questConfig.Description, questConfig.Reward)
    if err != nil {
      WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert main quest")
      return
    }
  }

  WriteResultJson(w, "Initialized quests successfully")
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
	quests, err := core.PostgresQueryJson[MainQuest]("SELECT key, name, description, reward FROM MainQuests ORDER BY key ASC")
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quests")
		return
	}

	WriteDataJson(w, string(quests))
}

// Get today's quests based on the current day index.
func getTodaysQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQueryJson[DailyQuest]("SELECT key, name, description, reward, day_index FROM DailyQuests WHERE day_index = (SELECT MAX(day_index) FROM Days) ORDER BY key ASC")
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's quests")
		return
	}
  if len(quests) == 0 {
    WriteDataJson(w, "[]")
    return
  }

	WriteDataJson(w, string(quests))
}

func GetCompletedMainQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[MainQuest]("SELECT key, name, description, reward FROM MainQuests WHERE key = (SELECT questKey FROM UserMainQuests WHERE userAddress = $1 AND completed = TRUE)", userAddress)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get completed main quests")
		return
	}

	WriteDataJson(w, string(quests))
}

func GetCompletedDailyQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[DailyQuest]("SELECT key, name, description, reward, day_index FROM DailyQuests WHERE key = (SELECT questKey FROM UserDailyQuests WHERE userAddress = $1 AND completed = TRUE)", userAddress)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get completed daily quests")
		return
	}

	WriteDataJson(w, string(quests))
}

func GetTodayStartTime(w http.ResponseWriter, r *http.Request) {
	todayStartTime, err := core.PostgresQueryOne[*time.Time]("SELECT day_start FROM days WHERE day_index = (SELECT MAX(day_index) FROM days)")
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's start time")
		return
	}

	WriteDataJson(w, "\""+string((*todayStartTime).UTC().Format(time.RFC3339))+"\"")
}
