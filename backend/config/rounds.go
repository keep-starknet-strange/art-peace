package config

import (
	"encoding/json"
	"os"
)

type Round3 struct {
	Width     uint   `json:"width"`
	Height    uint   `json:"height"`
	Timer     uint   `json:"timer"`
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
}

type RoundsConfig struct {
	Round3 Round3 `json:"round3"`
}

var DefaultRoundsConfig = &RoundsConfig{
	Round3: Round3{
		Width:     518,
		Height:    396,
		Timer:     5,
		StartTime: "2024-12-01T00:00:00Z",
		EndTime:   "2025-01-01T00:00:00Z",
	},
}

var DefaultRoundsConfigPath = "../configs/rounds.config.json"

func LoadRoundsConfig(roundsConfigPath string) (*RoundsConfig, error) {
	roundsConfig := &RoundsConfig{}

	roundsConfigFile, err := os.Open(roundsConfigPath)
	if err != nil {
		return nil, err
	}
	defer roundsConfigFile.Close()

	jsonParser := json.NewDecoder(roundsConfigFile)
	if err = jsonParser.Decode(roundsConfig); err != nil {
		return nil, err
	}

	return roundsConfig, nil
}
