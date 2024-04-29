package routes

import (
	"context"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitCanvasRoutes() {
	http.HandleFunc("/init-canvas", initCanvas)
	http.HandleFunc("/get-canvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize canvas
	if AdminMiddleware(w, r) {
		return
	}

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
			WriteErrorJson(w, http.StatusInternalServerError, "Failed to initialize canvas")
			return
		}

		WriteResultJson(w, "Canvas initialized")
	} else {
		WriteErrorJson(w, http.StatusConflict, "Canvas already initialized")
	}
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
	SetupAccessHeaders(w)

	ctx := context.Background()
	val, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, "canvas").Result()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get canvas")
		return
	}

	w.Write([]byte(val))
}
