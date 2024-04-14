package routes

import (
	"io/ioutil"
	"net/http"
	"os"
)

func InitContractRoutes() {
	http.HandleFunc("/getContractAddress", getContractAddress)
	http.HandleFunc("/setContractAddress", setContractAddress)
}

func getContractAddress(w http.ResponseWriter, r *http.Request) {
	contractAddress := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	w.Write([]byte(contractAddress))
}

func setContractAddress(w http.ResponseWriter, r *http.Request) {
	// TODO: Add authentication
	data, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid request"))
		return
	}
	os.Setenv("ART_PEACE_CONTRACT_ADDRESS", string(data))
	w.Write([]byte("Contract address set successfully"))
}
