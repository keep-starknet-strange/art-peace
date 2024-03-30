package backend

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"art-peace-backend/config"
)

type Backend struct {
  Databases *Databases
  WSConnections []*websocket.Conn

  CanvasConfig *config.CanvasConfig
  Port int
}

var ArtPeaceBackend *Backend

func NewBackend(databases *Databases, canvasConfig *config.CanvasConfig, port int) *Backend {
  return &Backend{
    Databases: databases,
    CanvasConfig: canvasConfig,
    Port: port,
  }
}

func (b *Backend) Start() {
  fmt.Println("Listening on port", b.Port)
  http.ListenAndServe(fmt.Sprintf(":%d", b.Port), nil)
}
