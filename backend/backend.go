package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
)
var client *redis.Client
var pgConn *pgx.Conn
// Vector of connections
var connections []*websocket.Conn
var canvasConfig map[string]interface{}

// Message layout
/*
{
  "data": {
    "cursor": {
      "orderKey": 3,
      "uniqueKey": "0x050d47ba775556cd86577692d31a38422af66471dcb85edaea33cde70bfc156c"
    },
    "end_cursor": {
      "orderKey": 4,
      "uniqueKey": "0x03b2711fe29eba45f2a0250c34901d15e37b495599fac1a74960a09cc83e1234"
    },
    "finality": "DATA_STATUS_ACCEPTED",
    "batch": [
      {
        "status": "BLOCK_STATUS_ACCEPTED_ON_L2",
        "events": [
          {
            "event": {
              "fromAddress": "0x0474642f7f488d4b49b6e892f3e4a5407c6ad5fe065687f2ebe4e0f7c1309860",
              "keys": [
                "0x02d7b50ebf415606d77c7e7842546fc13f8acfbfd16f7bcf2bc2d08f54114c23",
                "0x0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0",
                "0x000000000000000000000000000000000000000000000000000000000000001e"
              ],
              "data": [
                "0x0000000000000000000000000000000000000000000000000000000000000001"
              ]
            }
          }
        ]
      }
    ]
  }
}
*/

// TODO: User might miss some messages between loading canvas and connecting to websocket?
func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Consume indexer msg")

  requestBody, err := io.ReadAll(r.Body)
  if err != nil {
    fmt.Println("Error reading request body: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  fmt.Println("Received message: ", string(requestBody))

  // TODO: Parse message fully, check block status, number, ...
  reqBody := map[string]interface{}{}
  err = json.Unmarshal(requestBody, &reqBody)
  if err != nil {
    fmt.Println("Error unmarshalling request body: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  address := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})[0].(map[string]interface{})["event"].(map[string]interface{})["keys"].([]interface{})[1]
  address = address.(string)[2:]
  // Get the field data.batch[0].events[0].event.keys[2]
  posHex := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})[0].(map[string]interface{})["event"].(map[string]interface{})["keys"].([]interface{})[2]
  fmt.Println("Total events got: ", len(reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})))

  // Get the field data.batch[0].events[0].event.data[0]
  colorHex := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})[0].(map[string]interface{})["event"].(map[string]interface{})["data"].([]interface{})[0]

  // Convert hex to int
  position, err := strconv.ParseInt(posHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting position hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  color, err := strconv.ParseInt(colorHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting color hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  colorBitWidth := uint(canvasConfig["colors_bitwidth"].(float64))
  bitfieldType := "u" + strconv.Itoa(int(colorBitWidth))
  pos := uint(position) * colorBitWidth

  // Set pixel in redis
  ctx := context.Background()
  err = client.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
  if err != nil {
    panic(err)
  }

  // Set pixel in postgres
  // TODO: Get address from request / event info
  fmt.Println("Inserting pixel into postgres w/ address: ", address, " position: ", position, " color: ", color)
  _, err = pgConn.Exec(context.Background(), "INSERT INTO Pixels (address, position, color) VALUES ($1, $2, $3)", address, position, color)

  var message = map[string]interface{}{
    "position": position,
    "color": color,
  }
  messageBytes, err := json.Marshal(message)
  if err != nil {
    fmt.Println("Error marshalling message: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  fmt.Println("Message: ", string(messageBytes), " to clients: ", len(connections))
  // Send message to all connected clients
  for idx, conn := range connections {
    if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
      fmt.Println(err)
      // Remove connection
      conn.Close()
      connections = append(connections[:idx], connections[idx+1:]...)
    }
  }
}

func initCanvas(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Initializing Canvas...")

  // TODO: Check if canvas already exists

  // reqBody, err := io.ReadAll(r.Body)
  // if err != nil {
  //   panic(err)
  // }
  // var jsonBody map[string]uint
  // err = json.Unmarshal(reqBody, &jsonBody)
  // if err != nil {
  //   panic(err)
  // }
  // TODO: Check if width and height are valid
  // TODO: Dont pass width and height, get from config
  //width := jsonBody["width"]
  //height := jsonBody["height"]
  width := uint(canvasConfig["canvas"].(map[string]interface{})["width"].(float64))
  height := uint(canvasConfig["canvas"].(map[string]interface{})["height"].(float64))
  colorBitWidth := uint(canvasConfig["colors_bitwidth"].(float64))
  totalBitSize := width * height * colorBitWidth
  totalByteSize := (totalBitSize / 8)
  // Round up to nearest byte
  if totalBitSize % 8 != 0 {
    totalByteSize += 1
  }
  canvas := make([]byte, totalByteSize)
  ctx := context.Background()
  err := client.Set(ctx, "canvas", canvas, 0).Err()
  if err != nil {
    panic(err)
  }
  fmt.Println("Canvas set w/ size: ", totalByteSize, "bytes", canvas, "width", width, "height", height)

  fmt.Println("Canvas initialized")
}

func getCanvas(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Get Canvas")

  ctx := context.Background()
  val, err := client.Get(ctx, "canvas").Result()
  if err != nil {
    panic(err)
  }

  fmt.Println("Canvas", val)
  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Write([]byte(val))
}

func placePixel(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Place Pixel")

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
  colorBitWidth := uint(canvasConfig["colors_bitwidth"].(float64))
  bitfieldType := "u" + strconv.Itoa(int(colorBitWidth))
  pos := position * colorBitWidth

  ctx := context.Background()
  err = client.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err() 
  if err != nil {
    panic(err)
  }
}

func getPixel(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Get Pixel")

  position, err := strconv.Atoi(r.URL.Query().Get("position"))
  if err != nil {
    panic(err)
  }
  colorBitWidth := uint(5) // TODO: Get from request || const / cmdline?
  bitfieldType := "u" + strconv.Itoa(int(colorBitWidth))
  pos := uint(position) * colorBitWidth

  ctx := context.Background()
  val, err := client.BitField(ctx, "canvas", "GET", bitfieldType, pos).Result()
  if err != nil {
    panic(err)
  }

  fmt.Println("Pixel", val)
}

func getPixelInfo(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Get Pixel Info")

  position := r.URL.Query().Get("position")
  fmt.Println("Position: ", position)

  // Get pixel info from postgres
  var address string
  err := pgConn.QueryRow(context.Background(), "SELECT address FROM Pixels WHERE position = $1 ORDER BY time DESC LIMIT 1", position).Scan(&address)
  if err != nil {
    fmt.Println("Error querying pixel: ", err)
  } else {
    fmt.Println("Pixel: ", address, position)
  }
  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Write([]byte(address))
}

func placePixelDevnet(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Place Pixel")

  reqBody, err := io.ReadAll(r.Body)
  if err != nil {
    panic(err)
  }
  fmt.Println(reqBody)
  var jsonBody map[string]string
  err = json.Unmarshal(reqBody, &jsonBody)
  if err != nil {
    panic(err)
  }
  fmt.Println(jsonBody)

  x, err := strconv.Atoi(jsonBody["x"])
  if err != nil {
    panic(err)
  }
  y, err := strconv.Atoi(jsonBody["y"])
  if err != nil {
    panic(err)
  }
  // Use shell / bash to ls files in directory
  shellCmd := "../tests/integration/local/place_pixel.sh"
  position := x + y * int(canvasConfig["canvas"].(map[string]interface{})["width"].(float64))
  fmt.Println("Running shell command: ", shellCmd, jsonBody["contract"], "place_pixel", strconv.Itoa(int(position)), jsonBody["color"])
  cmd := exec.Command(shellCmd, jsonBody["contract"], "place_pixel", strconv.Itoa(int(position)), jsonBody["color"])
  out, err := cmd.Output()
  if err != nil {
    fmt.Println("Error executing shell command: ", err)
    panic(err)
  }
  fmt.Println(string(out))

  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Write([]byte("Pixel placed"))
}

var upgrader = websocket.Upgrader{
  ReadBufferSize: 1024,
  WriteBufferSize: 1024,
}

func wsReader(conn *websocket.Conn) {
  for {
    fmt.Println("Reading message")
    messageType, p, err := conn.ReadMessage()
    if err != nil {
      fmt.Println(err)
      return
    }
    fmt.Println("read", string(p), "messageType", messageType)

    //if err := conn.WriteMessage(messageType, p); err != nil {
    //  fmt.Println(err)
    //  return
    //}
    //fmt.Println("sent", string(p))
  }
} 

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Websocket endpoint")
  upgrader.CheckOrigin = func(r *http.Request) bool { return true }

  ws, err := upgrader.Upgrade(w, r, nil)
  if err != nil {
    fmt.Println(err)
  }

  fmt.Println("Client Connected")
  // TODO: disconnecting / removing connections
  connections = append(connections, ws)
  wsReader(ws)
}

/*
{
  "canvas": {
    "width": 35,
    "height": 24
  },
  "colors": [
    "010001",
    "FEFDFB",
    "FA5310",
    "9DAEB6",
    "E9C69E"
  ],
  "colors_bitwidth": 5
}
*/

func main() {
  canvasConfigFilename := flag.String("canvas-config", "../configs/canvas.config.json", "Canvas config file")
  flag.Parse()

  // Load config from file passed as argument
  canvasConfigFile, err := os.ReadFile(*canvasConfigFilename)
  if err != nil {
    panic(err)
  }
  err = json.Unmarshal(canvasConfigFile, &canvasConfig)
  if err != nil {
    panic(err)
  }
  fmt.Println("Canvas config: ", canvasConfig)

  // TODO: Get from env / cmd line
  client = redis.NewClient(&redis.Options{
    Addr: "localhost:6379",
    Password: "",
    DB: 0,
  })

  // Connect to Postgres
  pgConn, err = pgx.Connect(context.Background(), "postgresql://brandonroberts@localhost:5432/art-peace-db")
  if err != nil {
    panic(err)
  }
  defer pgConn.Close(context.Background())

  var address string
  var position uint
  var color uint
  err = pgConn.QueryRow(context.Background(), "SELECT address, position, color FROM Pixels WHERE position = 0 ORDER BY time DESC LIMIT 1").Scan(&address, &position, &color)
  if err != nil {
    fmt.Println("Error querying last pixel: ", err)
  } else {
    fmt.Println("Last pixel: ", address, position, color)
  }

  // TODO: load test calls
  http.HandleFunc("/consume", consumeIndexerMsg)
  http.HandleFunc("/initCanvas", initCanvas)
  http.HandleFunc("/getCanvas", getCanvas)
  http.HandleFunc("/placePixel", placePixel)
  http.HandleFunc("/getPixel", getPixel)
  http.HandleFunc("/getPixelInfo", getPixelInfo)
  http.HandleFunc("/placePixelDevnet", placePixelDevnet)
  http.HandleFunc("/ws", wsEndpoint)

  // TODO: hardcode port
  fmt.Println("Listening on port 8080")
  http.ListenAndServe(":8080", nil)
}
