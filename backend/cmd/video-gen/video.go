package main

import (
	"flag"

	"github.com/keep-starknet-strange/art-peace/backend/config"
	"github.com/keep-starknet-strange/art-peace/backend/core"
	"github.com/keep-starknet-strange/art-peace/backend/routes"
	"github.com/keep-starknet-strange/art-peace/backend/routes/indexer"
)

func main() {
	roundsConfigFilename := flag.String("rounds-config", config.DefaultRoundsConfigPath, "Rounds config file")
	canvasConfigFilename := flag.String("canvas-config", config.DefaultCanvasConfigPath, "Canvas config file")
	databaseConfigFilename := flag.String("database-config", config.DefaultDatabaseConfigPath, "Database config file")
	backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")

	flag.Parse()

	roundsConfig, err := config.LoadRoundsConfig(*roundsConfigFilename)
	if err != nil {
		panic(err)
	}

	canvasConfig, err := config.LoadCanvasConfig(*canvasConfigFilename)
	if err != nil {
		panic(err)
	}

	databaseConfig, err := config.LoadDatabaseConfig(*databaseConfigFilename)
	if err != nil {
		panic(err)
	}

	backendConfig, err := config.LoadBackendConfig(*backendConfigFilename)
	if err != nil {
		panic(err)
	}

	databases := core.NewDatabases(databaseConfig)
	defer databases.Close()

	core.ArtPeaceBackend = core.NewBackend(databases, roundsConfig, canvasConfig, backendConfig, true)

	routes.InitBaseRoutes()
	routes.InitCanvasRoutes()
	indexer.InitIndexerRoutes()
	indexer.StartMessageProcessor()

	core.ArtPeaceBackend.Start(core.ArtPeaceBackend.BackendConfig.ConsumerPort)
}
