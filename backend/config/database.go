package config

import (
	"encoding/json"
	"os"
)

type RedisConfig struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type PostgresConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Database string `json:"database"`
}

type DatabaseConfig struct {
	Redis    RedisConfig    `json:"redis"`
	Postgres PostgresConfig `json:"postgres"`
}

var DefaultDatabaseConfig = DatabaseConfig{
	Redis: RedisConfig{
		Host: "localhost",
		Port: 6379,
	},
	Postgres: PostgresConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "art-peace-user",
		Database: "art-peace-db",
	},
}

var DefaultDatabaseConfigPath = "../configs/database.config.json"

func LoadDatabaseConfig(databaseConfigPath string) (*DatabaseConfig, error) {
	file, err := os.Open(databaseConfigPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	config := DatabaseConfig{}
	err = decoder.Decode(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
