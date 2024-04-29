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
	http.HandleFunc("/getPixel", getPixel)
	http.HandleFunc("/getPixelInfo", getPixelInfo)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/placePixelDevnet", placePixelDevnet)
		http.HandleFunc("/placeExtraPixelsDevnet", placeExtraPixelsDevnet)
	}
	http.HandleFunc("/placePixelRedis", placePixelRedis)
}

func getPixel(w http.ResponseWriter, r *http.Request) {
	position, err := strconv.Atoi(r.URL.Query().Get("position"))
	if err != nil {
    WriteErrorJson(w, http.StatusBadRequest, "Invalid query position")
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
    WriteDataJson(w, "\"" + *address + "\"")
  }
}

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if NonProductionMiddleware(w, r) {
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

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.PlacePixelDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(position), (*jsonBody)["color"])
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
