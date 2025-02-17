package config

import (
	"encoding/json"
	"os"
)

type Round3 struct {
	Width     uint `json:"width"`
	Height    uint `json:"height"`
	Pixels    uint `json:"pixels"`
	Timer     uint `json:"timer"`
	StartTime uint `json:"startTime"`
	EndTime   uint `json:"endTime"`
}

type RoundsConfig struct {
	Round3 Round3 `json:"round3"`
}

var DefaultRoundsConfig = &RoundsConfig{
	Round3: Round3{
		Width:     256,
		Height:    192,
		Pixels:    5,
		Timer:     5,
		StartTime: 0,
		EndTime:   3000000000000,
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
