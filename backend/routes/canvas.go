package routes

import (
	"context"
	"fmt"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitCanvasRoutes() {
	http.HandleFunc("/init-canvas", initCanvas)
	http.HandleFunc("/get-canvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	if core.ArtPeaceBackend.Databases.Redis.Exists(context.Background(), "canvas").Val() == 0 {
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
		fmt.Println("Canvas already initialized")
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
