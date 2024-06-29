package routes

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitContractRoutes() {
	http.HandleFunc("/get-contract-address", getContractAddress)
	http.HandleFunc("/set-contract-address", setContractAddress)
  http.HandleFunc("/get-game-data", getGameData)
}

func getContractAddress(w http.ResponseWriter, r *http.Request) {
	contractAddress := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	routeutils.WriteDataJson(w, "\""+contractAddress+"\"")
}

// TODO: Set env var on infra level in production
func setContractAddress(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to set contract address
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	data, err := io.ReadAll(r.Body)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}
	os.Setenv("ART_PEACE_CONTRACT_ADDRESS", string(data))
	routeutils.WriteResultJson(w, "Contract address set")
}

type GameData struct {
  Day int `json:"day"`
  EndTime int `json:"endTime"`
}

func getGameData(w http.ResponseWriter, r *http.Request) {
  day, err := core.PostgresQueryOne[int](`SELECT day_index from days ORDER BY day_index DESC LIMIT 1`)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get day")
    return
  }

  endTime := os.Getenv("ART_PEACE_END_TIME")
  if endTime == "" {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get end time")
    return
  }
  endTimeInt, err := strconv.Atoi(endTime)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert end time to int")
    return
  }

  gameData := GameData{
    Day: *day,
    EndTime: endTimeInt,
  }
  jsonGameData, err := json.Marshal(gameData)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal game data")
    return
  }

  routeutils.WriteDataJson(w, string(jsonGameData))
}
