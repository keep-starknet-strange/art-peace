package config

import (
	"encoding/json"
	"os"
)

type CanvasSize struct {
	Width  uint `json:"width"`
	Height uint `json:"height"`
}

type CanvasConfig struct {
	Canvas         CanvasSize `json:"canvas"`
	Colors         []string   `json:"colors"`
	VotableColors  []string   `json:"votableColors"`
	ColorsBitWidth uint       `json:"colorsBitwidth"`
}

var DefaultCanvasConfig = &CanvasConfig{
	Canvas: CanvasSize{
		Width:  100,
		Height: 100,
	},
	Colors: []string{
		"#000000",
		"#FFFFFF",
		"#FF0000",
		"#00FF00",
		"#0000FF",
		"#FFFF00",
		"#FF00FF",
		"#00FFFF",
	},
	VotableColors: []string{
		"#DDDDDD",
		"#DD0000",
		"#00DD00",
		"#0000DD",
		"#DDDD00",
		"#DD00DD",
		"#00DDDD",
	},
	ColorsBitWidth: 5,
}

var DefaultCanvasConfigPath = "../configs/canvas.config.json"

func LoadCanvasConfig(canvasConfigPath string) (*CanvasConfig, error) {
	canvasConfig := &CanvasConfig{}

	canvasConfigFile, err := os.Open(canvasConfigPath)
	if err != nil {
		return nil, err
	}
	defer canvasConfigFile.Close()

	jsonParser := json.NewDecoder(canvasConfigFile)
	if err = jsonParser.Decode(canvasConfig); err != nil {
		return nil, err
	}

	return canvasConfig, nil
}
