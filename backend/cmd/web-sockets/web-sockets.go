package main

import (
	"flag"

	"github.com/keep-starknet-strange/art-peace/backend/config"
	"github.com/keep-starknet-strange/art-peace/backend/core"
	"github.com/keep-starknet-strange/art-peace/backend/routes"
)

func isFlagSet(name string) bool {
	found := false
	flag.Visit(func(f *flag.Flag) {
		if f.Name == name {
			found = true
		}
	})
	return found
}

func main() {
	roundsConfigFilename := flag.String("rounds-config", config.DefaultRoundsConfigPath, "Rounds config file")
	canvasConfigFilename := flag.String("canvas-config", config.DefaultCanvasConfigPath, "Canvas config file")
	databaseConfigFilename := flag.String("database-config", config.DefaultDatabaseConfigPath, "Database config file")
	backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")
	production := flag.Bool("production", false, "Production mode")

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

	if isFlagSet("production") {
		backendConfig.Production = *production
	}

	databases := core.NewDatabases(databaseConfig)
	defer databases.Close()

	core.ArtPeaceBackend = core.NewBackend(databases, roundsConfig, canvasConfig, backendConfig, false)

	routes.InitBaseRoutes()
  routes.InitWebsocketRoutes()
  routes.StartWebsocketServer()

	core.ArtPeaceBackend.Start(core.ArtPeaceBackend.BackendConfig.WsPort)
}
