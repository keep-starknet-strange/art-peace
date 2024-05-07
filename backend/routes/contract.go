package routes

import (
	"io"
	"net/http"
	"os"
)

func InitContractRoutes() {
	http.HandleFunc("/get-contract-address", getContractAddress)
	http.HandleFunc("/set-contract-address", setContractAddress)
}

func getContractAddress(w http.ResponseWriter, r *http.Request) {
	contractAddress := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	WriteDataJson(w, "\""+contractAddress+"\"")
}

// TODO: Set env var on infra level in production
func setContractAddress(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to set contract address
	if AdminMiddleware(w, r) {
		return
	}

	data, err := io.ReadAll(r.Body)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}
	os.Setenv("ART_PEACE_CONTRACT_ADDRESS", string(data))
	WriteResultJson(w, "Contract address set")
}
