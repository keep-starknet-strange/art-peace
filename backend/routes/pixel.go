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
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/placePixelDevnet", placePixelDevnet)
		http.HandleFunc("/placeExtraPixelsDevnet", placeExtraPixelsDevnet)
	}
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
	if position < 0 || position >= (int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)*int(core.ArtPeaceBackend.CanvasConfig.Canvas.Height)) {
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
	// Disable this in production
	if core.ArtPeaceBackend.BackendConfig.Production {
		http.Error(w, "Not available in production", http.StatusNotImplemented)
		return
	}

	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	var jsonBody map[string]string
	err = json.Unmarshal(reqBody, &jsonBody)
	if err != nil {
		panic(err)
	}

	positionStr := jsonBody["position"]
	position, err := strconv.Atoi(positionStr)
	if err != nil {
		http.Error(w, "Invalid position parameter", http.StatusBadRequest)
		return
	}

	colorStr := jsonBody["color"]
	color, err := strconv.Atoi(colorStr)
	if err != nil {
		http.Error(w, "Invalid color parameter", http.StatusBadRequest)
		return
	}

	// Validate position range
	if position < 0 || position >= int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width*core.ArtPeaceBackend.CanvasConfig.Canvas.Height) {
		http.Error(w, "Position out of range", http.StatusBadRequest)
		return
	}

	// Validate color format (e.g., validate against allowed colors)
	colorsLength := len(core.ArtPeaceBackend.CanvasConfig.Colors)
	if color < 0 || color > colorsLength {
		http.Error(w, "Color value exceeds bit width", http.StatusBadRequest)
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.PlacePixelDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(position), colorStr)
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error executing shell command: ", err)
		http.Error(w, "Failed to place pixel", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte("Pixel placed"))
}

func placeExtraPixelsDevnet(w http.ResponseWriter, r *http.Request) {
	// TODO: Disable in production
	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	// TODO: Pixel position instead of x, y
	// Json data format:
	/*
	  {
	    "extraPixels": [
	      { "x": 0, "y": 0, "colorId": 1 },
	      { "x": 1, "y": 0, "colorId": 2 },
	    ]
	  }
	*/
	var jsonBody map[string][]map[string]int
	err = json.Unmarshal(reqBody, &jsonBody)
	if err != nil {
		panic(err)
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.PlaceExtraPixelsDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	positions := strconv.Itoa(len(jsonBody["extraPixels"]))
	colors := strconv.Itoa(len(jsonBody["extraPixels"]))
	for _, pixel := range jsonBody["extraPixels"] {
		pos := pixel["x"] + pixel["y"]*int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)
		positions += " " + strconv.Itoa(pos)
		colors += " " + strconv.Itoa(pixel["colorId"])
	}

	cmd := exec.Command(shellCmd, contract, "place_extra_pixels", positions, colors)
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error executing shell command: ", err)
		panic(err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte("Extra pixels placed"))
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
	colorsLength := uint(len(core.ArtPeaceBackend.CanvasConfig.Colors))
	if color >= colorsLength {
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
