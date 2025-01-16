package routes

import (
	"context"
	"fmt"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitCanvasRoutes() {
	http.HandleFunc("/init-canvas", initCanvas)
	http.HandleFunc("/get-canvas", getCanvas)
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize canvas
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	roundNumber := core.ArtPeaceBackend.CanvasConfig.Round
	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)

	if core.ArtPeaceBackend.Databases.Redis.Exists(context.Background(), canvasKey).Val() == 0 {
		totalBitSize := core.ArtPeaceBackend.CanvasConfig.Canvas.Width * core.ArtPeaceBackend.CanvasConfig.Canvas.Height * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth
		totalByteSize := (totalBitSize / 8)
		if totalBitSize%8 != 0 {
			// Round up to nearest byte
			totalByteSize += 1
		}

		// Create canvas
		canvas := make([]byte, totalByteSize)
		ctx := context.Background()
		err := core.ArtPeaceBackend.Databases.Redis.Set(ctx, canvasKey, canvas, 0).Err()
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to initialize canvas")
			return
		}

		routeutils.WriteResultJson(w, fmt.Sprintf("Canvas for round %s initialized", roundNumber))
	} else {
		routeutils.WriteErrorJson(w, http.StatusConflict, fmt.Sprintf("Canvas for round %s already initialized", roundNumber))
	}
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
	routeutils.SetupAccessHeaders(w)

	// Get round number from query params, default to config round
	roundNumber := r.URL.Query().Get("round")
	if roundNumber == "" {
		roundNumber = core.ArtPeaceBackend.CanvasConfig.Round
	}

	canvasKey := fmt.Sprintf("canvas-%s", roundNumber)

	ctx := context.Background()
	val, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, canvasKey).Result()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get canvas")
		return
	}

	w.Write([]byte(val))
}
