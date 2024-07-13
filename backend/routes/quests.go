package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	"github.com/keep-starknet-strange/art-peace/backend/quests"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

type DailyUserQuest struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Reward      int           `json:"reward"`
	DayIndex    int           `json:"dayIndex"`
	QuestId     int           `json:"questId"`
	Completed   bool          `json:"completed"`
	ClaimParams []ClaimParams `json:"claimParams"`
}

type DailyQuest struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Reward      int           `json:"reward"`
	DayIndex    int           `json:"dayIndex"`
	QuestId     int           `json:"questId"`
	ClaimParams []ClaimParams `json:"claimParams"`
}

type MainUserQuest struct {
	QuestId     int           `json:"questId"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Reward      int           `json:"reward"`
	Completed   bool          `json:"completed"`
	ClaimParams []ClaimParams `json:"claimParams"`
}

type MainQuest struct {
	QuestId     int           `json:"questId"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Reward      int           `json:"reward"`
	ClaimParams []ClaimParams `json:"claimParams"`
}

type QuestContractConfig struct {
	Type        string             `json:"type"`
	InitParams  []string           `json:"initParams"`
	StoreParams []int              `json:"storeParams"`
	ClaimParams []ClaimParamConfig `json:"claimParams"`
}

type ClaimParams struct {
	QuestId   int    `json:"questId"`
	ClaimType string `json:"claimType"`
	Name      string `json:"name"`
	Example   string `json:"example"`
	Input     bool   `json:"input"`
}

type ClaimParamConfig struct {
	Type    string `json:"type"`
	Name    string `json:"name"`
	Example string `json:"example"`
	Input   bool   `json:"input"`
}

type QuestConfig struct {
	Name           string              `json:"name"`
	Description    string              `json:"description"`
	Reward         int                 `json:"reward"`
	ContractConfig QuestContractConfig `json:"questContract"`
}

type DailyQuestConfig struct {
	Day    int           `json:"day"`
	Quests []QuestConfig `json:"quests"`
}

type QuestsConfig struct {
	DailyQuests struct {
		DailyQuestsCount int                `json:"dailyQuestsCount"`
		Quests           []DailyQuestConfig `json:"dailyQuests"`
	} `json:"daily"`
	MainQuests struct {
		Quests []QuestConfig `json:"mainQuests"`
	} `json:"main"`
}

type QuestStatus struct {
	Progress int `json:"progress"`
	Needed   int `json:"needed"`
}

type QuestTypes struct {
	QuestId   int    `json:"questId"`
	QuestType string `json:"questType"`
}

type QuestProgress struct {
	QuestId  int   `json:"questId"`
	Progress int   `json:"progress"`
	Needed   int   `json:"needed"`
	Calldata []int `json:"calldata"`
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
	http.HandleFunc("/get-user-quest-status", GetUserQuestStatus)
	http.HandleFunc("/get-today-start-time", GetTodayStartTime)
	http.HandleFunc("/get-daily-quest-progress", GetDailyQuestProgress)
	http.HandleFunc("/get-today-quest-progress", GetTodayQuestProgress)
	http.HandleFunc("/get-main-quest-progress", GetMainQuestProgress)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/claim-today-quest-devnet", ClaimTodayQuestDevnet)
		http.HandleFunc("/claim-main-quest-devnet", ClaimMainQuestDevnet)
		http.HandleFunc("/increase-day-devnet", IncreaseDayDevnet)
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

	// Setup daily quests tables
	for _, dailyQuestConfig := range questJson.DailyQuests.Quests {
		for idx, questConfig := range dailyQuestConfig.Quests {
			_, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO DailyQuests (name, description, reward, day_index, quest_id, quest_type) VALUES ($1, $2, $3, $4, $5, $6)", questConfig.Name, questConfig.Description, questConfig.Reward, dailyQuestConfig.Day-1, idx, questConfig.ContractConfig.Type)
			if err != nil {
				fmt.Println("Error inserting daily quest, ", idx, err)
				routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert daily quest")
				return
			}

			paramIdx := 0
			for _, storeParam := range questConfig.ContractConfig.StoreParams {
				paramStr := questConfig.ContractConfig.InitParams[storeParam]
				// TODO: More generic
				if paramStr == "$DAY_IDX" {
					paramStr = strconv.Itoa(dailyQuestConfig.Day - 1)
				}

				param, err := strconv.Atoi(paramStr)
				if err != nil {
					routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid store param")
					return
				}

				_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO DailyQuestsInput (day_index, quest_id, input_key, input_value) VALUES ($1, $2, $3, $4)", dailyQuestConfig.Day-1, idx, paramIdx, param)
				if err != nil {
					routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert daily quest input")
					return
				}

				paramIdx++
			}

			claimParamIdx := 0
			for _, claimParam := range questConfig.ContractConfig.ClaimParams {
				_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO DailyQuestsClaimParams (day_index, quest_id, claim_key, claim_type, name, example, input) VALUES ($1, $2, $3, $4, $5, $6, $7)", dailyQuestConfig.Day-1, idx, claimParamIdx, claimParam.Type, claimParam.Name, claimParam.Example, claimParam.Input)
				if err != nil {
					routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert daily quest claim param")
					return
				}

				claimParamIdx++
			}
		}
	}

	// Setup main quests tables
	for idx, questConfig := range questJson.MainQuests.Quests {
		_, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO MainQuests (name, description, reward, quest_type) VALUES ($1, $2, $3, $4)", questConfig.Name, questConfig.Description, questConfig.Reward, questConfig.ContractConfig.Type)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert main quest")
			return
		}

		paramIdx := 0
		for _, storeParam := range questConfig.ContractConfig.StoreParams {
			paramStr := questConfig.ContractConfig.InitParams[storeParam]
			param, err := strconv.Atoi(paramStr)
			if err != nil {
				routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid store param")
				return
			}

			_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO MainQuestsInput (quest_id, input_key, input_value) VALUES ($1, $2, $3)", idx, paramIdx, param)
			if err != nil {
				routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert main quest input")
				return
			}

			paramIdx++
		}

		claimParamIdx := 0
		for _, claimParam := range questConfig.ContractConfig.ClaimParams {
			_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO MainQuestsClaimParams (quest_id, claim_key, claim_type, name, example, input) VALUES ($1, $2, $3, $4, $5, $6)", idx, claimParamIdx, claimParam.Type, claimParam.Name, claimParam.Example, claimParam.Input)
			if err != nil {
				routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert main quest claim param")
				return
			}

			claimParamIdx++
		}
	}

	routeutils.WriteResultJson(w, "Initialized quests successfully")
}

func GetDailyQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQuery[DailyQuest]("SELECT name, description, reward, day_index, quest_id FROM DailyQuests ORDER BY day_index ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quests")
		return
	}

	// Get claim params
	questClaimParams, err := core.PostgresQuery[ClaimParams]("SELECT quest_id, claim_type, name, example, input FROM DailyQuestsClaimParams ORDER BY quest_id ASC, claim_key ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quests claim params")
		return
	}

	// Add claim params to quests
	for _, questClaimParam := range questClaimParams {
		quests[questClaimParam.QuestId].ClaimParams = append(quests[questClaimParam.QuestId].ClaimParams, questClaimParam)
	}

	// Json quest data
	jsonQuests, err := json.Marshal(quests)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal completed daily quests")
		return
	}

	routeutils.WriteDataJson(w, string(jsonQuests))
}

func GetMainQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQuery[MainQuest]("SELECT key - 1 as quest_id, name, description, reward FROM MainQuests ORDER BY quest_id ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quests")
		return
	}

	// Get claim params
	questClaimParams, err := core.PostgresQuery[ClaimParams]("SELECT quest_id, claim_type, name, example, input FROM MainQuestsClaimParams ORDER BY quest_id ASC, claim_key ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quests claim params")
		return
	}

	// Add claim params to quests
	for _, questClaimParam := range questClaimParams {
		quests[questClaimParam.QuestId].ClaimParams = append(quests[questClaimParam.QuestId].ClaimParams, questClaimParam)
	}

	// Json quest data
	jsonQuests, err := json.Marshal(quests)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal completed main quests")
		return
	}

	routeutils.WriteDataJson(w, string(jsonQuests))
}

func GetMainUserQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQuery[MainUserQuest]("SELECT m.name, m.description, m.reward, m.key - 1 as quest_id, COALESCE(u.completed, false) as completed FROM MainQuests m LEFT JOIN UserMainQuests u ON u.quest_id = m.key - 1 AND u.user_address = $1", userAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main user quests")
		return
	}

	// Get claim params
	questClaimParams, err := core.PostgresQuery[ClaimParams]("SELECT quest_id, claim_type, name, example, input FROM MainQuestsClaimParams ORDER BY quest_id ASC, claim_key ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main user quests claim params")
		return
	}

	// Add claim params to quests
	for _, questClaimParam := range questClaimParams {
		// TODO: Assumes no gaps in quest ids
		quests[questClaimParam.QuestId].ClaimParams = append(quests[questClaimParam.QuestId].ClaimParams, questClaimParam)
	}

	// Json quest data
	jsonQuests, err := json.Marshal(quests)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal completed main quests")
		return
	}

	routeutils.WriteDataJson(w, string(jsonQuests))
}

func GetDailyQuestProgress(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	dayIndexStr := r.URL.Query().Get("dayIndex")
	if dayIndexStr == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing dayIndex parameter")
		return
	}

	dayIndex, err := strconv.Atoi(dayIndexStr)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid dayIndex parameter")
		return
	}

	questTypes, err := core.PostgresQuery[QuestTypes](
		"SELECT quest_id, quest_type FROM DailyQuests WHERE day_index = $1",
		dayIndex,
	)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quest status")
		return
	}

	var result []QuestProgress
	for _, quest := range questTypes {
		questItem := quests.NewDailyQuestWithType(quest.QuestId, quest.QuestType, dayIndex)
		if questItem == nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quest")
			return
		}
		progress, needed := questItem.CheckStatus(userAddress)
		var calldata []int
		if progress >= needed {
			calldata = questItem.GetQuestClaimData(userAddress)
		}
		result = append(result, QuestProgress{
			QuestId:  quest.QuestId,
			Progress: progress,
			Needed:   needed,
			Calldata: calldata,
		})
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal response")
		return
	}

	routeutils.WriteDataJson(w, string(jsonResult))
}

func GetTodayQuestProgress(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	questTypes, err := core.PostgresQuery[QuestTypes](
		"SELECT quest_id, quest_type FROM DailyQuests WHERE day_index = (SELECT MAX(day_index) FROM Days)",
	)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quest status")
		return
	}

	var result []QuestProgress
	for _, quest := range questTypes {
		questItem := quests.NewTodayQuestWithType(quest.QuestId, quest.QuestType)
		if questItem == nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quest")
			return
		}
		progress, needed := questItem.CheckStatus(userAddress)
		var calldata []int
		if progress >= needed {
			calldata = questItem.GetQuestClaimData(userAddress)
		}
		result = append(result, QuestProgress{
			QuestId:  quest.QuestId,
			Progress: progress,
			Needed:   needed,
			Calldata: calldata,
		})
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal response")
		return
	}

	routeutils.WriteDataJson(w, string(jsonResult))
}

func GetMainQuestProgress(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	questTypes, err := core.PostgresQuery[QuestTypes]("SELECT key - 1 as quest_id, quest_type FROM MainQuests")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get quest status")
		return
	}

	var result []QuestProgress
	for _, quest := range questTypes {
		questItem := quests.NewMainQuestWithType(quest.QuestId, quest.QuestType)
		if questItem == nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quest")
			return
		}
		progress, needed := questItem.CheckStatus(userAddress)
		var calldata []int
		if progress >= needed {
			calldata = questItem.GetQuestClaimData(userAddress)
		}
		result = append(result, QuestProgress{
			QuestId:  quest.QuestId,
			Progress: progress,
			Needed:   needed,
			Calldata: calldata,
		})
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal response")
		return
	}

	routeutils.WriteDataJson(w, string(jsonResult))
}

// Get today's quests based on the current day index.
func getTodaysQuests(w http.ResponseWriter, r *http.Request) {
	quests, err := core.PostgresQuery[DailyQuest]("SELECT name, description, reward, day_index, quest_id FROM DailyQuests WHERE day_index = (SELECT MAX(day_index) FROM Days) ORDER BY quest_id ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's quests")
		return
	}
	if len(quests) == 0 {
		routeutils.WriteDataJson(w, "[]")
		return
	}

	// Get claim params
	questClaimParams, err := core.PostgresQuery[ClaimParams]("SELECT quest_id, claim_type, name, example, input FROM DailyQuestsClaimParams WHERE day_index = (SELECT MAX(day_index) FROM Days) ORDER BY quest_id ASC, claim_key ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's quests claim params")
		return
	}

	// Add claim params to quests
	for _, questClaimParam := range questClaimParams {
		quests[questClaimParam.QuestId].ClaimParams = append(quests[questClaimParam.QuestId].ClaimParams, questClaimParam)
	}

	// Json quest data
	jsonQuests, err := json.Marshal(quests)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal completed daily quests")
		return
	}
	fmt.Println(string(jsonQuests))

	routeutils.WriteDataJson(w, string(jsonQuests))
}

func getTodaysUserQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQuery[DailyUserQuest]("SELECT d.name, d.description, d.reward, d.day_index, d.quest_id, COALESCE(u.completed, false) as completed FROM DailyQuests d LEFT JOIN UserDailyQuests u ON d.quest_id = u.quest_id AND d.day_index = u.day_index AND u.user_address = $1 WHERE d.day_index = (SELECT MAX(day_index) FROM Days)", userAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's user quests")
		return
	}

	// Get claim params
	questClaimParams, err := core.PostgresQuery[ClaimParams]("SELECT quest_id, claim_type, name, example, input FROM DailyQuestsClaimParams WHERE day_index = (SELECT MAX(day_index) FROM Days) ORDER BY quest_id ASC, claim_key ASC")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get today's user quests claim params")
		return
	}

	// Add claim params to quests
	for _, questClaimParam := range questClaimParams {
		quests[questClaimParam.QuestId].ClaimParams = append(quests[questClaimParam.QuestId].ClaimParams, questClaimParam)
	}

	// Json quest data
	jsonQuests, err := json.Marshal(quests)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal completed daily quests")
		return
	}

	routeutils.WriteDataJson(w, string(jsonQuests))
}

func GetCompletedMainQuests(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	quests, err := core.PostgresQueryJson[MainQuest]("SELECT key - 1 as quest_id, name, description, reward FROM MainQuests WHERE quest_id = (SELECT quest_id FROM UserMainQuests WHERE user_address = $1 AND completed = TRUE)", userAddress)
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

	calldataVal := (*jsonBody)["calldata"]
	calldata := ""
	// TODO: More generic
	if calldataVal != "" {
		calldata = "1 " + calldataVal
	} else {
		calldata = "0"
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.ClaimTodayQuestDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "claim_today_quest", strconv.Itoa(questId), calldata)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to claim today quest on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Today quest claimed")
}

func ClaimMainQuestDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
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

	calldataVal := (*jsonBody)["calldata"]
	calldata := ""
	// TODO: More generic
	if calldataVal != "" {
		calldata = "1 " + calldataVal
	} else {
		calldata = "0"
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.ClaimTodayQuestDevnet // TODO
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "claim_main_quest", strconv.Itoa(questId), calldata)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to claim main quest on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Main quest claimed")
}

func IncreaseDayDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.IncreaseDayDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "increase_day_index")
	_, err := cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to increase day on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Day increased")
}

func GetUserQuestStatus(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	questType := r.URL.Query().Get("type")
	if questType == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing type parameter")
		return
	}

	questIdStr := r.URL.Query().Get("questId")
	if questIdStr == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing questId parameter")
		return
	}

	questId, err := strconv.Atoi(questIdStr)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid questId parameter")
		return
	}

	if questType == "daily" {
		dayIndexStr := r.URL.Query().Get("dayIndex")
		if dayIndexStr == "" {
			routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing dayIndex parameter")
			return
		}

		dayIndex, err := strconv.Atoi(dayIndexStr)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid dayIndex parameter")
			return
		}

		quest := quests.NewDailyQuest(questId, dayIndex)
		if quest == nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get daily quest")
			return
		}

		progress, needed := quest.CheckStatus(userAddress)
		questStatus := QuestStatus{Progress: progress, Needed: needed}
		questStatusBytes, err := json.Marshal(questStatus)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal quest status")
			return
		}

		routeutils.WriteDataJson(w, string(questStatusBytes))
		return
	} else if questType == "main" {
		quest := quests.NewMainQuest(questId)
		if quest == nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get main quest")
			return
		}

		progress, needed := quest.CheckStatus(userAddress)
		questStatus := QuestStatus{Progress: progress, Needed: needed}
		questStatusBytes, err := json.Marshal(questStatus)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal quest status")
			return
		}

		routeutils.WriteDataJson(w, string(questStatusBytes))
		return
	} else {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid quest type")
		return
	}
}
