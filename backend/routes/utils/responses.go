package routeutils

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func SetupAccessHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

// TODO: To string
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
			// TODO: Should we always remove connection?
			// Remove connection
			conn.Close()
			core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections[:idx], core.ArtPeaceBackend.WSConnections[idx+1:]...)
		}
	}
}
