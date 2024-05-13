package routes

import (
	"io"
	"net/http"
	"os"

	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitContractRoutes() {
	http.HandleFunc("/get-contract-address", getContractAddress)
	http.HandleFunc("/set-contract-address", setContractAddress)
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
