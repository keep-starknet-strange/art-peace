package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"

	"art-peace-backend/backend"
)

func InitIndexerRoutes() {
  http.HandleFunc("/consumeIndexerMsg", consumeIndexerMsg)
}

// TODO: Clean up
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
  requestBody, err := io.ReadAll(r.Body)
  if err != nil {
    fmt.Println("Error reading request body: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

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
  posHex := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})[0].(map[string]interface{})["event"].(map[string]interface{})["keys"].([]interface{})[2]
  dayIdxHex := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})[0].(map[string]interface{})["event"].(map[string]interface{})["keys"].([]interface{})[3]
  colorHex := reqBody["data"].(map[string]interface{})["batch"].([]interface{})[0].(map[string]interface{})["events"].([]interface{})[0].(map[string]interface{})["event"].(map[string]interface{})["data"].([]interface{})[0]

  // Convert hex to int
  position, err := strconv.ParseInt(posHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting position hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  dayIdx, err := strconv.ParseInt(dayIdxHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting day index hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  color, err := strconv.ParseInt(colorHex.(string), 0, 64)
  if err != nil {
    fmt.Println("Error converting color hex to int: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  bitfieldType := "u" + strconv.Itoa(int(backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
  pos := uint(position) * backend.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

  fmt.Println("Pixel indexed with position: ", position, " and color: ", color)

  // Set pixel in redis
  ctx := context.Background()
  err = backend.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err()
  if err != nil {
    panic(err)
  }

  // Set pixel in postgres
  _, err = backend.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Pixels (address, position, day, color) VALUES ($1, $2, $3, $4)", address, position, dayIdx, color)
  if err != nil {
    fmt.Println("Error inserting pixel into postgres: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }

  // Send message to all connected clients
  var message = map[string]interface{}{
    "position": position,
    "color":    color,
  }
  messageBytes, err := json.Marshal(message)
  if err != nil {
    fmt.Println("Error marshalling message: ", err)
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  for idx, conn := range backend.ArtPeaceBackend.WSConnections {
    if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
      fmt.Println(err)
      // TODO: Should we always remove connection?
      // Remove connection
      conn.Close()
      backend.ArtPeaceBackend.WSConnections = append(backend.ArtPeaceBackend.WSConnections[:idx], backend.ArtPeaceBackend.WSConnections[idx+1:]...)
    }
  }
}
