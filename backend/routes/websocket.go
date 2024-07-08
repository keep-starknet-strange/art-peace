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
	}
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}

	core.ArtPeaceBackend.WSConnectionsLock.Lock()
	core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections, ws)
	core.ArtPeaceBackend.WSConnectionsLock.Unlock()
	wsReader(ws)
}
