package routes

import (
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

func InitQuestsRoutes() {
	http.HandleFunc("/get-daily-quests", GetDailyQuests)
	http.HandleFunc("/get-main-quests", GetMainQuests)
	http.HandleFunc("/get-todays-quests", getTodaysQuests)
	http.HandleFunc("/get-completed-daily-quests", GetCompletedDailyQuests)
	http.HandleFunc("/get-completed-main-quests", GetCompletedMainQuests)
	http.HandleFunc("/get-today-start-time", GetTodayStartTime)
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

// Get today's quests based on the current day index.
func getTodaysQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQueryJson[DailyQuest]("SELECT key, name, description, reward, day_index FROM DailyQuests WHERE day_index = (SELECT MAX(day_index) FROM Days)")
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's quests")
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
	todayStartTime, err := core.PostgresQueryOne[time.Time]("SELECT day_start FROM days WHERE day_index = (SELECT MAX(day_index) FROM days)")
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's start time")
		return
	}

	WriteDataJson(w, "\""+string(todayStartTime.UTC().Format(time.RFC3339))+"\"")
}
