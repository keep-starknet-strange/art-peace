package main

import (
	"flag"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"

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
	canvasConfigFilename := flag.String("canvas-config", config.DefaultCanvasConfigPath, "Canvas config file")
	databaseConfigFilename := flag.String("database-config", config.DefaultDatabaseConfigPath, "Database config file")
	backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")
	production := flag.Bool("production", false, "Production mode")

	flag.Parse()

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

	core.ArtPeaceBackend = core.NewBackend(databases, canvasConfig, backendConfig)

	routes.InitRoutes()

	core.ArtPeaceBackend.Start()

// Initialize Gorilla WebSocket upgrader
upgrader := websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

http.HandleFunc("/websocket", func(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for {
		// Read and write WebSocket messages here
			done := make(chan struct{})
		   
			// Simulating some processes that should not run indefinitely
			go func() {
			 // Simulate work
			 time.Sleep(2 * time.Second)
		   
			 // Signal completion
			 close(done)
			}()
		   
			// Introducing a timeout for the process
			select {
			case <-done:
			 // Process completed within the expected time
			 // Continue with the rest of the program
			 fmt.Println("Process completed successfully.")
			case <-time.After(5 * time.Second):
			 // Timeout reached, exit the loop
			 fmt.Println("Process timed out. Exiting loop.")
			}
		   
			// Other parts of your program
		   
	}
})

// Start your HTTP server
http.ListenAndServe(":8080", nil)

}

