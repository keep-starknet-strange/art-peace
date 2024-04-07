package routes

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"art-peace-backend/backend"
)

func InitWebsocketRoutes() {
  http.HandleFunc("/ws", wsEndpoint)
}

var upgrader = websocket.Upgrader{
  ReadBufferSize:  1024,
  WriteBufferSize: 1024,
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
  upgrader.CheckOrigin = func(r *http.Request) bool { return true }

  ws, err := upgrader.Upgrade(w, r, nil)
  if err != nil {
    fmt.Println(err)
  }

  fmt.Println("Client Connected")
  backend.ArtPeaceBackend.WSConnections = append(backend.ArtPeaceBackend.WSConnections, ws)
  wsReader(ws)
}
