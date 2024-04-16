package core

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/config"
)

type Backend struct {
	Databases     *Databases
  // TODO: Is this thread safe?
	WSConnections []*websocket.Conn

	CanvasConfig  *config.CanvasConfig
	BackendConfig *config.BackendConfig
}

var ArtPeaceBackend *Backend

func NewBackend(databases *Databases, canvasConfig *config.CanvasConfig, backendConfig *config.BackendConfig) *Backend {
	return &Backend{
		Databases:     databases,
		CanvasConfig:  canvasConfig,
		BackendConfig: backendConfig,
	}
}

func (b *Backend) Start() {
	fmt.Println("Listening on port", b.BackendConfig.Port)
	http.ListenAndServe(fmt.Sprintf(":%d", b.BackendConfig.Port), nil)
}
