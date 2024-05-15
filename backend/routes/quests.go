package routes

import (
	"encoding/json"
	"context"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

type DailyUserQuest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Reward      int    `json:"reward"`
	DayIndex    int    `json:"dayIndex"`
	QuestId     int    `json:"questId"`
	Completed   bool   `json:"completed"`
}

type DailyQuest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Reward      int    `json:"reward"`
	DayIndex    int    `json:"dayIndex"`
	QuestId     int    `json:"questId"`
}

type MainUserQuest struct {
	Key         int    `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Reward      int    `json:"reward"`
	Completed   bool   `json:"completed"`
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
	http.HandleFunc("/init-quests", InitQuests)
	http.HandleFunc("/get-daily-quests", GetDailyQuests)
	http.HandleFunc("/get-main-quests", GetMainQuests)
	http.HandleFunc("/get-main-user-quests", GetMainUserQuests)
	http.HandleFunc("/get-todays-quests", getTodaysQuests)
	http.HandleFunc("/get-todays-user-quests", getTodaysUserQuests)
	http.HandleFunc("/get-completed-daily-quests", GetCompletedDailyQuests)
	http.HandleFunc("/get-completed-main-quests", GetCompletedMainQuests)
	http.HandleFunc("/get-today-start-time", GetTodayStartTime)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/claim-today-quest-devnet", ClaimTodayQuestDevnet)
	}
}

func InitQuests(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize colors
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	// TODO: check if quests already exist
	questJson, err := routeutils.ReadJsonBody[QuestsConfig](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to parse request body")
		return
	}

	for _, dailyQuestConfig := range questJson.DailyQuests.Quests {
		for idx, questConfig := range dailyQuestConfig.Quests {
			_, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO DailyQuests (name, description, reward, day_index, quest_id) VALUES ($1, $2, $3, $4, $5)", questConfig.Name, questConfig.Description, questConfig.Reward, dailyQuestConfig.Day-1, idx)
			if err != nil {
				routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert daily quest")
				return
			}
		}
	}

	for _, questConfig := range questJson.MainQuests.Quests {
		_, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO MainQuests (name, description, reward) VALUES ($1, $2, $3)", questConfig.Name, questConfig.Description, questConfig.Reward)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert main quest")
			return
		}
	}

	routeutils.WriteResultJson(w, "Initialized quests successfully")
}

func GetDailyQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQueryJson[DailyQuest]("SELECT name, description, reward, day_index, quest_id FROM DailyQuests ORDER BY day_index ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quests")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

func GetMainQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQueryJson[MainQuest]("SELECT key, name, description, reward FROM MainQuests ORDER BY key ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quests")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

func GetMainUserQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[MainUserQuest]("SELECT m.name, m.description, m.reward, m.key, COALESCE(u.completed, false) as completed FROM MainQuests m LEFT JOIN UserMainQuests u ON u.quest_id = m.key - 1 AND u.user_address = $1", userAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main user quests")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

// Get today's quests based on the current day index.
func getTodaysQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQueryJson[DailyQuest]("SELECT name, description, reward, day_index, quest_id FROM DailyQuests WHERE day_index = (SELECT MAX(day_index) FROM Days) ORDER BY quest_id ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's quests")
		return
	}
	if len(quests) == 0 {
		routeutils.WriteDataJson(w, "[]")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

func getTodaysUserQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[DailyUserQuest]("SELECT d.name, d.description, d.reward, d.day_index, d.quest_id, COALESCE(u.completed, false) as completed FROM DailyQuests d LEFT JOIN UserDailyQuests u ON d.quest_id = u.quest_id AND d.day_index = u.day_index AND u.user_address = $1 WHERE d.day_index = (SELECT MAX(day_index) FROM Days)", userAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's user quests")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

func GetCompletedMainQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[MainQuest]("SELECT key, name, description, reward FROM MainQuests WHERE key = (SELECT quest_id FROM UserMainQuests WHERE user_address = $1 AND completed = TRUE)", userAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get completed main quests")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

func GetCompletedDailyQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[DailyQuest]("SELECT name, description, reward, day_index, quest_id FROM DailyQuests WHERE quest_id = (SELECT quest_id FROM UserDailyQuests WHERE user_address = $1 AND completed = TRUE)", userAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get completed daily quests")
		return
	}

	routeutils.WriteDataJson(w, string(quests))
}

func GetTodayStartTime(w http.ResponseWriter, r *http.Request) {
	todayStartTime, err := core.PostgresQueryOne[*time.Time]("SELECT day_start FROM days WHERE day_index = (SELECT MAX(day_index) FROM days)")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's start time")
		return
	}

	routeutils.WriteDataJson(w, "\""+string((*todayStartTime).UTC().Format(time.RFC3339))+"\"")
}

func ClaimTodayQuestDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Method only allowed in non-production mode")
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	questId, err := strconv.Atoi((*jsonBody)["questId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid quest id")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.ClaimTodayQuestDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "claim_today_quest", strconv.Itoa(questId), "0")
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to claim today quest on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Today quest claimed")
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
