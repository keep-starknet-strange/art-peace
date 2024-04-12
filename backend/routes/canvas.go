package routes

import (
	"context"
	"fmt"
	"net/http"

	"art-peace-backend/backend"
)

func InitCanvasRoutes() {
	http.HandleFunc("/initCanvas", initCanvas)
	http.HandleFunc("/getCanvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	// TODO: Check if canvas already exists
	totalBitSize := backend.ArtPeaceBackend.CanvasConfig.Canvas.Width * backend.ArtPeaceBackend.CanvasConfig.Canvas.Height * backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth
	totalByteSize := (totalBitSize / 8)
	if totalBitSize%8 != 0 {
		// Round up to nearest byte
		totalByteSize += 1
	}

	canvas := make([]byte, totalByteSize)
	ctx := context.Background()
	err := backend.ArtPeaceBackend.Databases.Redis.Set(ctx, "canvas", canvas, 0).Err()
	if err != nil {
		panic(err)
	}

	fmt.Println("Canvas initialized")
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	val, err := backend.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		panic(err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(val))
}
