package routes

import (
	"encoding/json"
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

type FactionChat struct {
    ID        int       `json:"id"`
    Sender    string    `json:"sender"`
    FactionKey int      `json:"faction_key"`
    Message   string    `json:"message"`
    Time      time.Time `json:"time"`
}

func InitFactionRoutes() {
	http.HandleFunc("/send-chat", SendChat)
    http.HandleFunc("/delete-chat", DeleteChat)
    http.HandleFunc("/get-faction-chats", GetFactionChats)
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

func SendChat(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}
    
    // Parse request body
    var chat FactionChat
    err := json.NewDecoder(r.Body).Decode(&chat)
    if err != nil {
        WriteErrorJson(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    defer r.Body.Close()

    // Insert chat into database
	err = core.PostgresExec( r.Context(), "INSERT INTO FactionChats (sender, faction_key, message) VALUES ($1, $2, $3)", chat.Sender, chat.FactionKey, chat.Message)
    if err != nil {
        WriteErrorJson(w, http.StatusInternalServerError, "Failed to send chat")
        return
    }

    w.WriteHeader(http.StatusCreated)
}

func DeleteChat(w http.ResponseWriter, r *http.Request) {
    userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}
    
    // Parse query params
    chatID := r.URL.Query().Get("id")
    if chatID == "" {
        WriteErrorJson(w, http.StatusBadRequest, "Missing chat ID parameter")
        return
    }

	canDelete := false

	// Retrieve the faction leader from the database
	leader, err := core.PostgresQueryOne[string]("SELECT ftns.leader FROM Factions ftns INNER JOIN FactionChats ftcs ON ftns.faction_key = ftcs.key WHERE ftcs.id = $1", chatID)
	if err != nil {
		http.Error(w, "Failed to retrieve faction leader", http.StatusInternalServerError)
		return
	}

	if *leader == userAddress {
		canDelete = true
	}

	if !canDelete {
		sender, err := core.PostgresQueryOne[string]("SELECT sender FROM FactionChats WHERE id = $1", chatID)
        if err != nil {
            http.Error(w, "Failed to retrieve sender", http.StatusInternalServerError)
            return
        }

		if *sender == userAddress {
			canDelete = true
		}

	}

    
	// Check if the authenticated user is the sender or the faction leader
	if !canDelete {
		http.Error(w, "Not authorized to delete this chat", http.StatusForbidden)
		return
	}

    // Delete chat from database
    err = core.PostgresExec(r.Context(), "DELETE FROM FactionChats WHERE id = $1", chatID)
    if err != nil {
        WriteErrorJson(w, http.StatusInternalServerError, "Failed to delete chat")
        return
    }
	w.WriteHeader(http.StatusOK)
}

func GetFactionChats(w http.ResponseWriter, r *http.Request) {
    userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}
    
    // Parse query params
    factionKey := r.URL.Query().Get("faction_key")
    if factionKey == "" {
        WriteErrorJson(w, http.StatusBadRequest, "Missing faction key parameter")
        return
    }

    // Retrieve faction chats from database
    chats, err := core.PostgresQueryJson[FactionChat]("SELECT id, sender, faction_key, message, time FROM FactionChats WHERE faction_key = $1 ORDER BY time ASC", factionKey)
    if err != nil {
        WriteErrorJson(w, http.StatusInternalServerError, "Failed to get faction chats")
        return
    }

    WriteDataJson(w, string(chats))
}
