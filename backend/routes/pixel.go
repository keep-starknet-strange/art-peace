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
  err := backend.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT address FROM Pixels WHERE position = $1 ORDER BY time DESC LIMIT 1", position).Scan(&address)
  if err != nil {
    w.Write([]byte("0000000000000000000000000000000000000000000000000000000000000000"))
  } else {
    w.Write([]byte(address))
  }
}

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
  reqBody, err := io.ReadAll(r.Body)
  if err != nil {
    panic(err)
  }
  var jsonBody map[string]string
  err = json.Unmarshal(reqBody, &jsonBody)
  if err != nil {
    panic(err)
  }

  position, err := strconv.Atoi(jsonBody["position"])
  if err != nil {
    panic(err)
  }

  shellCmd := backend.ArtPeaceBackend.BackendConfig.Scripts.PlacePixelDevnet
  contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
  
  cmd := exec.Command(shellCmd, contract, "place_pixel", strconv.Itoa(position), jsonBody["color"])
  _, err = cmd.Output()
  if err != nil {
    fmt.Println("Error executing shell command: ", err)
    panic(err)
  }

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
