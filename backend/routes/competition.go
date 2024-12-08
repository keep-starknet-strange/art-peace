package routes

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"

	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

type CompetitionConfig struct {
	Round3 struct {
		Timer     int    `json:"timer"`
		StartTime string `json:"startTime"`
		EndTime   string `json:"endTime"`
	} `json:"round3"`
}

func InitCompetitionRoutes() {
	http.HandleFunc("/get-competition-config", getCompetitionConfig)
}

func getCompetitionConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Read config file
	configPath := filepath.Join("configs", "competition.config.json")
	configFile, err := os.ReadFile(configPath)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to read competition config")
		return
	}

	var config CompetitionConfig
	if err := json.Unmarshal(configFile, &config); err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to parse competition config")
		return
	}

	// Convert to JSON and send response
	jsonResponse, err := json.Marshal(config)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create response")
		return
	}

	routeutils.WriteDataJson(w, string(jsonResponse))
}
