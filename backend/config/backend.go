package config

import (
	"encoding/json"
	"os"
)

type BackendScriptsConfig struct {
	PlacePixelDevnet       string `json:"place_pixel_devnet"`
	PlaceExtraPixelsDevnet string `json:"place_extra_pixels_devnet"`
	AddTemplateDevnet      string `json:"add_template_devnet"`
	MintNFTDevnet          string `json:"mint_nft_devnet"`
}

// type BackendConfig struct {
// 	Host       string               `json:"host"`
// 	Port       int                  `json:"port"`
// 	Scripts    BackendScriptsConfig `json:"scripts"`
// 	Production bool                 `json:"production"`
// 	WebSocket  WebSocketConfig   `json:"webSocket"
// }
type WebSocketConfig struct {
	ReadBufferSize  int `json:"readBufferSize"`
	WriteBufferSize int `json:"writeBufferSize"`
   }
   
   type BackendConfig struct {
	Host       string            `json:"host"`
	Port       int               `json:"port"`
	Scripts    BackendScriptsConfig `json:"scripts"`
	Production bool              `json:"production"`
	WebSocket  WebSocketConfig   `json:"webSocket"`
   }

var DefaultBackendConfig = BackendConfig{
	Host: "localhost",
	Port: 8080,
	Scripts: BackendScriptsConfig{
		PlacePixelDevnet:       "../scripts/place_pixel.sh",
		PlaceExtraPixelsDevnet: "../scripts/place_extra_pixels.sh",
		AddTemplateDevnet:      "../scripts/add_template.sh",
		MintNFTDevnet:          "../scripts/mint_nft.sh",
	},
	Production: false,
}

var DefaultBackendConfigPath = "../configs/backend.config.json"

func LoadBackendConfig(backendConfigPath string) (*BackendConfig, error) {
	file, err := os.Open(backendConfigPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	config := BackendConfig{}
	err = decoder.Decode(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
