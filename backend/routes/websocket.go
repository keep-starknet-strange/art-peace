package routes

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

var WsMsgPool []map[string]string

func InitWebsocketRoutes() {
	http.HandleFunc("/ws", wsEndpoint)
	http.HandleFunc("/ws-msg", wsMsgEndpoint)
}

func wsMsgEndpoint(w http.ResponseWriter, r *http.Request) {
	// TODO: Only allow consumer to send messages
	msg, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid request body")
		return
	}

  WsMsgPool = append(WsMsgPool, *msg)
	routeutils.WriteResultJson(w, "WS message added to queue")
}

func StartWebsocketServer() {
  // Send all messages in the pool every 5 seconds
  timer := 5
  for {
    msgPoolCopy := make([]map[string]string, len(WsMsgPool))
    copy(msgPoolCopy, WsMsgPool)
    WsMsgPool = WsMsgPool[:0]
    routeutils.SendWebSocketMessages(msgPoolCopy)
    time.Sleep(time.Duration(timer) * time.Second)
  }
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
