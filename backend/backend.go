package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/redis/go-redis/v9"
)
var client *redis.Client

func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
  log.Println("Consume indexer msg")

  requestBody, err := io.ReadAll(r.Body)
  if err != nil {
    log.Println("Error reading request body: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  log.Println("Received message: ", string(requestBody))
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
  log.Println("Initializing Canvas...")

  // TODO: Check if canvas already exists

  reqBody, err := io.ReadAll(r.Body)
  if err != nil {
    log.Fatal(err)
  }
  var jsonBody map[string]uint
  err = json.Unmarshal(reqBody, &jsonBody)
  if err != nil {
    log.Fatal(err)
  }
  // TODO: Check if width and height are valid
  width := jsonBody["width"]
  height := jsonBody["height"]
  colorBitWidth := uint(5) // TODO: Get from request?
  totalBitSize := width * height * colorBitWidth
  totalByteSize := (totalBitSize / 8)
  // Round up to nearest byte
  if totalBitSize % 8 != 0 {
    totalByteSize += 1
  }
  canvas := make([]byte, totalByteSize)
  ctx := context.Background()
  err = client.Set(ctx, "canvas", canvas, 0).Err()
  if err != nil {
    log.Fatal(err)
  }

  log.Println("Canvas initialized")
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
  log.Println("Get Canvas")

  ctx := context.Background()
  val, err := client.Get(ctx, "canvas").Result()
  if err != nil {
    log.Fatal(err)
  }

  log.Println("Canvas", val)
}

func placePixel(w http.ResponseWriter, r *http.Request) {
  log.Println("Place Pixel")

  reqBody, err := io.ReadAll(r.Body)
  if err != nil {
    log.Fatal(err)
  }
  var jsonBody map[string]uint
  err = json.Unmarshal(reqBody, &jsonBody)
  if err != nil {
    log.Fatal(err)
  }
  // TODO: Check if pos and color are valid
  // TODO: allow x, y coordinates?
  position := jsonBody["position"]
  color := jsonBody["color"]
  colorBitWidth := uint(5) // TODO: Get from request || const / cmdline?
  bitfieldType := "u" + strconv.Itoa(int(colorBitWidth))
  pos := position * colorBitWidth

  ctx := context.Background()
  err = client.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err() 
  if err != nil {
    log.Fatal(err)
  }
}

func getPixel(w http.ResponseWriter, r *http.Request) {
  log.Println("Get Pixel")

  position, err := strconv.Atoi(r.URL.Query().Get("position"))
  if err != nil {
    log.Fatal(err)
  }
  colorBitWidth := uint(5) // TODO: Get from request || const / cmdline?
  bitfieldType := "u" + strconv.Itoa(int(colorBitWidth))
  pos := uint(position) * colorBitWidth

  ctx := context.Background()
  val, err := client.BitField(ctx, "canvas", "GET", bitfieldType, pos).Result()
  if err != nil {
    log.Fatal(err)
  }

  log.Println("Pixel", val)
}

func main() {
  // TODO: Get from env / cmd line
  client = redis.NewClient(&redis.Options{
    Addr: "localhost:6379",
    Password: "",
    DB: 0,
  })

  // TODO: load test calls
  http.HandleFunc("/consume", consumeIndexerMsg)
  http.HandleFunc("/initCanvas", initCanvas)
  http.HandleFunc("/getCanvas", getCanvas)
  http.HandleFunc("/placePixel", placePixel)
  http.HandleFunc("/getPixel", getPixel)

  // TODO: hardcode port
  log.Println("Listening on port 8080")
  http.ListenAndServe(":8080", nil)
}
