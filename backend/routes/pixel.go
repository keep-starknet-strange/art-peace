package routes

import (
	"context"
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitPixelRoutes() {
	http.HandleFunc("/get-pixel", getPixel)
	http.HandleFunc("/get-pixel-info", getPixelInfo)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/place-pixel-devnet", placePixelDevnet)
		http.HandleFunc("/place-extra-pixels-devnet", placeExtraPixelsDevnet)
	}
	http.HandleFunc("/place-pixel-redis", placePixelRedis)
}

func getPixel(w http.ResponseWriter, r *http.Request) {
	positionStr := r.URL.Query().Get("position")
	position, err := strconv.Atoi(positionStr)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid query position")
		return
	}

	// Check if position is within canvas bounds
	if position < 0 || position >= (int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)*int(core.ArtPeaceBackend.CanvasConfig.Canvas.Height)) {
		http.Error(w, "Position out of range", http.StatusBadRequest)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	val, err := core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "GET", bitfieldType, pos).Result()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error getting pixel")
		return
	}

	// TODO: Check this
	pixel := strconv.Itoa(int(val[0]))
	WriteDataJson(w, pixel)
}

func getPixelInfo(w http.ResponseWriter, r *http.Request) {
	position, err := strconv.Atoi(r.URL.Query().Get("position"))
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid query position")
		return
	}

	address, err := core.PostgresQueryOne[string]("SELECT address FROM Pixels WHERE position = $1 ORDER BY time DESC LIMIT 1", position)
	if err != nil {
		WriteDataJson(w, "\"0000000000000000000000000000000000000000000000000000000000000000\"")
	} else {
		WriteDataJson(w, "\""+*address+"\"")
	}
}

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if NonProductionMiddleware(w, r) {
		WriteErrorJson(w, http.StatusBadRequest, "Method only allowed in non-production mode")
		return
	}

	jsonBody, err := ReadJsonBody[map[string]string](r)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	position, err := strconv.Atoi((*jsonBody)["position"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid position")
		return
	}

	color, err := strconv.Atoi((*jsonBody)["color"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid color")
		return
	}

	// Validate position range
	if position < 0 || position >= int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width*core.ArtPeaceBackend.CanvasConfig.Canvas.Height) {
		WriteErrorJson(w, http.StatusBadRequest, "Position out of range")
		return
	}

	// Validate color format (e.g., validate against allowed colors)
	colorsLength := len(core.ArtPeaceBackend.CanvasConfig.Colors)
	if color < 0 || color > colorsLength {
		WriteErrorJson(w, http.StatusBadRequest, "Color out of range")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.PlacePixelDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(position), strconv.Itoa(color))
	_, err = cmd.Output()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
		return
	}

	WriteResultJson(w, "Pixel placed")
}

func placeExtraPixelsDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if NonProductionMiddleware(w, r) {
		WriteErrorJson(w, http.StatusBadRequest, "Method only allowed in non-production mode")
		return
	}

	// TODO: Pixel position instead of x, y
	jsonBody, err := ReadJsonBody[map[string][]map[string]int](r)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.PlaceExtraPixelsDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	positions := strconv.Itoa(len((*jsonBody)["extraPixels"]))
	colors := strconv.Itoa(len((*jsonBody)["extraPixels"]))
	for _, pixel := range (*jsonBody)["extraPixels"] {
		pos := pixel["x"] + pixel["y"]*int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)
		positions += " " + strconv.Itoa(pos)
		colors += " " + strconv.Itoa(pixel["colorId"])
	}

	cmd := exec.Command(shellCmd, contract, "place_extra_pixels", positions, colors)
	_, err = cmd.Output()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to place extra pixels on devnet")
		return
	}

	WriteResultJson(w, "Extra pixels placed")
}

func placePixelRedis(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to place pixels on redis
	if AdminMiddleware(w, r) {
		return
	}

	jsonBody, err := ReadJsonBody[map[string]uint](r)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	position := (*jsonBody)["position"]
	color := (*jsonBody)["color"]

	canvasWidth := core.ArtPeaceBackend.CanvasConfig.Canvas.Width
	canvasHeight := core.ArtPeaceBackend.CanvasConfig.Canvas.Height

	// Validate position range
	if position >= canvasWidth*canvasHeight {
		WriteErrorJson(w, http.StatusBadRequest, "Position out of range")
		return
	}

	// Validate color range (e.g., ensure color value fits within bit width)
	colorsLength := uint(len(core.ArtPeaceBackend.CanvasConfig.Colors))
	if color >= colorsLength {
		WriteErrorJson(w, http.StatusBadRequest, "Color out of range")
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := position * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	ctx := context.Background()
	err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error setting pixel on redis")
		return
	}

	WriteResultJson(w, "Pixel placed on redis")
}
