package routes

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"encoding/json"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

type Config struct {
	Host      string `json:"host"`
	Port      int    `json:"port"`
	WebSocket struct {
		ReadBufferSize  int `json:"ReadBufferSize"`
		WriteBufferSize int `json:"WriteBufferSize"`
	} `json:"WebSocket"`
}

func LoadConfig() (Config, error) {
	var config Config

	configFile, err := os.Open("../config/backend.config.json")

	if err != nil {
		return config, err
	}
	defer configFile.Close()

	jsonParser := json.NewDecoder(configFile)
	if err = jsonParser.Decode(&config); err != nil {
		return config, err
	}

	return config, nil
}

func InitWebsocketRoutes() {
	http.HandleFunc("/ws", wsEndpoint)
}

func wsReader(conn *websocket.Conn) {
	for {
		// TODO: exit on close in backend?
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("WS message received: ", messageType, string(p))
	}
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	config, err := LoadConfig()

	if err != nil {
		log.Fatal("Error loading config file: ", err)
	}

	upgrader := websocket.Upgrader{
		ReadBufferSize:  config.WebSocket.ReadBufferSize,
		WriteBufferSize: config.WebSocket.WriteBufferSize,
	}
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println("Client Connected")
	core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections, ws)
	wsReader(ws)
}
