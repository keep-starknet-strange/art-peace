package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

// Quest represents the structure for both Daily and Main Quests data
type Quest struct {
	Key         int    `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Reward      int    `json:"reward"`
	DayIndex    int    `json:"dayIndex,omitempty"` // Only for daily quests
}

func InitQuestsRoutes() {
	http.HandleFunc("/daily-quests", GetDailyQuests)
	http.HandleFunc("/main-quests", GetMainQuests)
}

func GetDailyQuests(w http.ResponseWriter, r *http.Request) {
	query := `SELECT key, name, description, reward, dayIndex FROM DailyQuests ORDER BY dayIndex ASC`
	handleQuestQuery(w, r, query)
}

func GetMainQuests(w http.ResponseWriter, r *http.Request) {
	query := `SELECT key, name, description, reward FROM MainQuests`
	handleQuestQuery(w, r, query)
}

func handleQuestQuery(w http.ResponseWriter, r *http.Request, query string) {
	var quests []Quest
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), query)
	if err != nil {
		http.Error(w, "Database query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var q Quest
		if err := rows.Scan(&q.Key, &q.Name, &q.Description, &q.Reward, &q.DayIndex); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue // Log and continue to process other rows
		}
		quests = append(quests, q)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Error during rows iteration: %v", err)
		http.Error(w, "Error processing data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	setupCORS(&w, r)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(quests); err != nil {
		http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
	}
}

// setupCORS sets the required headers for CORS and handles pre-flight requests
func setupCORS(w *http.ResponseWriter, r *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == "OPTIONS" {
		(*w).Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
		(*w).WriteHeader(http.StatusOK)
	}
}
