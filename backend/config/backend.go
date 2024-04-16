package config

import (
	"encoding/json"
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
