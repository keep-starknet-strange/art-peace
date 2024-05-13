package routeutils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/keep-starknet-strange/art-peace/backend/config"
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func getHttpConfig() config.HttpConfig {
	return core.ArtPeaceBackend.BackendConfig.HttpConfigValues
}

func SetupAccessHeaders(w http.ResponseWriter) {
	config := getHttpConfig()

	// Set Access-Control-Allow-Origin dynamically based on config
	for _, origin := range config.AllowOrigin {
		w.Header().Add("Access-Control-Allow-Origin", origin)
	}

	// Join methods into a single string for the header
	methods := strings.Join(config.AllowMethods, ", ")
	w.Header().Set("Access-Control-Allow-Methods", methods)

	// Join headers into a single string for the header
	headers := strings.Join(config.AllowHeaders, ", ")
	w.Header().Set("Access-Control-Allow-Headers", headers)
}

func SetupHeaders(w http.ResponseWriter) {
	SetupAccessHeaders(w)
	w.Header().Set("Content-Type", "application/json")
}

func BasicErrorJson(err string) []byte {
	return []byte(`{"error": "` + err + `"}`)
}

func WriteErrorJson(w http.ResponseWriter, errCode int, err string) {
	SetupHeaders(w)
	w.WriteHeader(errCode)
	w.Write(BasicErrorJson(err))
}

func BasicResultJson(result string) []byte {
	return []byte(`{"result": "` + result + `"}`)
}

func WriteResultJson(w http.ResponseWriter, result string) {
	SetupHeaders(w)
	w.WriteHeader(http.StatusOK)
	w.Write(BasicResultJson(result))
}

func BasicDataJson(data string) []byte {
	return []byte(`{"data": ` + data + `}`)
}

func WriteDataJson(w http.ResponseWriter, data string) {
	SetupHeaders(w)
	w.WriteHeader(http.StatusOK)
	w.Write(BasicDataJson(data))
}

func SendWebSocketMessage(w http.ResponseWriter, message map[string]interface{}) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error marshalling message")
		return
	}
	for idx, conn := range core.ArtPeaceBackend.WSConnections {
		if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
			fmt.Println(err)
			// Remove problematic connection
			conn.Close()
			core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections[:idx], core.ArtPeaceBackend.WSConnections[idx+1:]...)
		}
	}
}
