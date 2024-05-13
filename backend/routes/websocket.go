package routes

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitWebsocketRoutes() {
	http.HandleFunc("/ws", wsEndpoint)
}

func wsReader(conn *websocket.Conn) {
	for {
		// TODO: exit on close in backend?
		// TODO: handle different message types
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("WS message received: ", messageType, string(p))
	}
}
func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  core.ArtPeaceBackend.BackendConfig.WebSocket.ReadBufferSize,
		WriteBufferSize: core.ArtPeaceBackend.BackendConfig.WebSocket.WriteBufferSize,

		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true
			}

			for _, allowedOrigin := range core.ArtPeaceBackend.BackendConfig.WebSocket.AllowOrigin {
				if allowedOrigin == "*" {
					return true
				}
				if origin == allowedOrigin {
					return true
				}
			}

			return false
		},

		//To do: Logic for Allowed Methods and Allowed headers

	}
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections, ws)
	wsReader(ws)
}
