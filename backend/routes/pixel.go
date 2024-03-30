package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"strconv"

	"art-peace-backend/backend"
)

func InitPixelRoutes() {
  http.HandleFunc("/getPixel", getPixel)
  http.HandleFunc("/getPixelInfo", getPixelInfo)
  http.HandleFunc("/placePixelDevnet", placePixelDevnet)
  http.HandleFunc("/placePixelRedis", placePixelRedis)
}

func getPixel(w http.ResponseWriter, r *http.Request) {
  position, err := strconv.Atoi(r.URL.Query().Get("position"))
  if err != nil {
    // TODO: panic or return error?
    panic(err)
  }
  bitfieldType := "u" + strconv.Itoa(int(backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
  pos := uint(position) * backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

  ctx := context.Background()
  val, err := backend.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "GET", bitfieldType, pos).Result()
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
  err := backend.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT address FROM Pixels WHERE position = $1 OR  DER BY time DESC LIMIT 1", position).Scan(&address)
  if err != nil {
    w.Write([]byte("Pixel not found"))
  } else {
    w.Write([]byte(address))
  }
}

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
  // TODO: Disable this in production
  reqBody, err := io.ReadAll(r.Body)
  if err != nil {
    panic(err)
  }
  var jsonBody map[string]string
  err = json.Unmarshal(reqBody, &jsonBody)
  if err != nil {
    panic(err)
  }

  // TODO: Pass position instead of x, y?
  x, err := strconv.Atoi(jsonBody["x"])
  if err != nil {
    panic(err)
  }
  y, err := strconv.Atoi(jsonBody["y"])
  if err != nil {
    panic(err)
  }
  shellCmd := "../tests/integration/local/place_pixel.sh"
  position := x + y * int(backend.ArtPeaceBackend.CanvasConfig.Canvas.Width)
  cmd := exec.Command(shellCmd, jsonBody["contract"], "place_pixel", strconv.Itoa(position), jsonBody["color"])
  out, err := cmd.Output()
  if err != nil {
    fmt.Println("Error executing shell command: ", err)
    panic(err)
  }
  fmt.Println("Place Pixel command gave:", string(out))

  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Write([]byte("Pixel placed"))
}

func placePixelRedis(w http.ResponseWriter, r *http.Request) {
  // TODO: Only allow mods to place pixels on redis instance
  reqBody, err := io.ReadAll(r.Body)
  if err != nil {
    panic(err)
  }
  var jsonBody map[string]uint
  err = json.Unmarshal(reqBody, &jsonBody)
  if err != nil {
    panic(err)
  }
  // TODO: Check if pos and color are valid
  // TODO: allow x, y coordinates?
  position := jsonBody["position"]
  color := jsonBody["color"]
  bitfieldType := "u" + strconv.Itoa(int(backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
  pos := position * backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

  ctx := context.Background()
  err = backend.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
  if err != nil {
    panic(err)
  }
}
