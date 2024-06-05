package core

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/config"
)

type Backend struct {
	Databases *Databases
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

func (b *Backend) Start(port int) {
	fmt.Println("Listening on port", port)
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	fmt.Println("Port closed")
}

func (b *Backend) GetBackendUrl() string {
	if b.BackendConfig.Production {
		// TODO: To config
		return "https://api.art-peace.net"
	} else {
		return fmt.Sprintf("http://%s:%d", b.BackendConfig.Host, b.BackendConfig.Port)
	}
}
