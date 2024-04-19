package config


import (
	"encoding/json"
	"fmt"
	"os"
)

type BackendScriptsConfig struct {
	PlacePixelDevnet      string `json:"place_pixel_devnet"`
	AddTemplateHashDevnet string `json:"add_template_hash_devnet"`
}

type BackendConfig struct {
	Host       string               `json:"host"`
	Port       int                  `json:"port"`
	Scripts    BackendScriptsConfig `json:"scripts"`
	Production bool                 `json:"production"`
}

type WebSocketConfig struct {
	Host string `json:"host"`
	Port int    `json:"port"`
	Path string `json:"path"`
}

var DefaultBackendConfig = BackendConfig{
	Host: "localhost",
	Port: 8080,
	Scripts: BackendScriptsConfig{
		PlacePixelDevnet:      "../scripts/place_pixel.sh",
		AddTemplateHashDevnet: "../scripts/add_template_hash.sh",
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



func main () {
	file, err := os.Open("backend.config.json")
	if err != nil {
		fmt.Println("Error opening config file:", err)
		return
	}
	defer file.Close()

	var config WebSocketConfig
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&config)
	if err != nil {
		fmt.Println("Error decoding config file:", err)
		return
	}

	fmt.Println("WebSocket Host:", config.Host)
	fmt.Println("WebSocket Port:", config.Port)
	fmt.Println("WebSocket Path:", config.Path)
}