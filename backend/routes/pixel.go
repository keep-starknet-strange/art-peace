package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitPixelRoutes() {
	http.HandleFunc("/getPixel", getPixel)
	http.HandleFunc("/getPixelInfo", getPixelInfo)
	http.HandleFunc("/placePixelDevnet", placePixelDevnet)
	http.HandleFunc("/placePixelRedis", placePixelRedis)
}

func getPixel(w http.ResponseWriter, r *http.Request) {
    positionStr := r.URL.Query().Get("position")
    position, err := strconv.Atoi(positionStr)
    if err != nil {
        http.Error(w, "Invalid position parameter", http.StatusBadRequest)
        return
    }

    // Check if position is within canvas bounds
    if position < 0 || position >= (int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width) * int(core.ArtPeaceBackend.CanvasConfig.Canvas.Height)) {
        http.Error(w, "Position out of range", http.StatusBadRequest)
        return
    }

    bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
    pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

    ctx := context.Background()
    val, err := core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "GET", bitfieldType, pos).Result()
    if err != nil {
        panic(err)
    }

    w.Header().Set("Access-Control-Allow-Origin", "*")
	// TODO: Check this
    w.Write([]byte(strconv.Itoa(int(val[0]))))
}

func getPixelInfo(w http.ResponseWriter, r *http.Request) {
	position := r.URL.Query().Get("position")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Get pixel info from postgres
	var address string
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT address FROM Pixels WHERE position = $1 ORDER BY time DESC LIMIT 1", position).Scan(&address)
	if err != nil {
		w.Write([]byte("0000000000000000000000000000000000000000000000000000000000000000"))
	} else {
		w.Write([]byte(address))
	}
}

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
    reqBody, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Failed to read request body", http.StatusInternalServerError)
        return
    }

    var jsonBody map[string]string
    if err := json.Unmarshal(reqBody, &jsonBody); err != nil {
        http.Error(w, "Invalid JSON format", http.StatusBadRequest)
        return
    }

    positionStr := jsonBody["position"]
    position, err := strconv.Atoi(positionStr)
    if err != nil {
        http.Error(w, "Invalid position parameter", http.StatusBadRequest)
        return
    }

    color := jsonBody["color"]

    // Validate position range
    if position < 0 || position >= int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width*core.ArtPeaceBackend.CanvasConfig.Canvas.Height) {
        http.Error(w, "Position out of range", http.StatusBadRequest)
        return
    }

    // Validate color format (e.g., validate against allowed colors)
    // Example: check if color is a valid hex color code
    if !isValidHexColor(color) {
        http.Error(w, "Invalid color format", http.StatusBadRequest)
        return
    }

    shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.PlacePixelDevnet
    contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

    cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(position), color)
    _, err = cmd.Output()
    if err != nil {
        fmt.Println("Error executing shell command: ", err)
        http.Error(w, "Failed to place pixel", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Write([]byte("Pixel placed"))
}

func placePixelRedis(w http.ResponseWriter, r *http.Request) {
	// TODO: Only allow mods to place pixels on redis instance
    reqBody, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Failed to read request body", http.StatusInternalServerError)
        return
    }

    var jsonBody map[string]uint
    if err := json.Unmarshal(reqBody, &jsonBody); err != nil {
        http.Error(w, "Invalid JSON format", http.StatusBadRequest)
        return
    }

    position := jsonBody["position"]
    color := jsonBody["color"]

    canvasWidth := core.ArtPeaceBackend.CanvasConfig.Canvas.Width
    canvasHeight := core.ArtPeaceBackend.CanvasConfig.Canvas.Height

    // Validate position range
    if position >= canvasWidth*canvasHeight {
        http.Error(w, "Position out of range", http.StatusBadRequest)
        return
    }

    // Validate color range (e.g., ensure color value fits within bit width)
    if color >= (1 << core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth) {
        http.Error(w, "Color value exceeds bit width", http.StatusBadRequest)
        return
    }

    bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
    pos := position * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

    ctx := context.Background()
    err = core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
    if err != nil {
        http.Error(w, "Failed to set pixel in Redis", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Write([]byte("Pixel placed"))
}

// Helper function to validate hex color format
func isValidHexColor(color string) bool {
    _, err := strconv.ParseUint(color[1:], 16, 32) // Skip '#' character
    return err == nil && len(color) == 7          // Check if it's a valid hex color (#RRGGBB)
}
