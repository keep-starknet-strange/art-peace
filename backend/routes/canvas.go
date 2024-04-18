package routes

import (
	"context"
	"fmt"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitCanvasRoutes() {
	http.HandleFunc("/initCanvas", initCanvas)
	http.HandleFunc("/getCanvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	// Check if the 'canvas' property exists in core.ArtPeaceBackend.CanvasConfig
	if core.ArtPeaceBackend.CanvasConfig != nil && core.ArtPeaceBackend.CanvasConfig.Canvas != nil && core.ArtPeaceBackend.Databases.Redis.Exists(context.Background(), "canvas").Val() == 0 {
		// Calculate totalByteSize
		totalBitSize := core.ArtPeaceBackend.CanvasConfig.Canvas.Width * core.ArtPeaceBackend.CanvasConfig.Canvas.Height * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth
		totalByteSize := (totalBitSize / 8)
		if totalBitSize%8 != 0 {
			// Round up to nearest byte
			totalByteSize += 1
		}

		// Create canvas
		canvas := make([]byte, totalByteSize)
		ctx := context.Background()
		err := core.ArtPeaceBackend.Databases.Redis.Set(ctx, "canvas", canvas, 0).Err()
		if err != nil {
			panic(err)
		}

		fmt.Println("Canvas initialized")
	} else {
		fmt.Println("Canvas config not found")
		// Handle the case where 'canvas' property does not exist
	}
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	val, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		panic(err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(val))
}
