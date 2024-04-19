package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"

	"github.com/keep-starknet-strange/art-peace/backend/core"
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
func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
	// Read request body
	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println("Error reading request body: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Unmarshal JSON body
	// TODO: Parse message fully, check block status, number, ...
	var reqBody map[string]interface{}
	if err := json.Unmarshal(requestBody, &reqBody); err != nil {
		fmt.Println("Error unmarshalling request body: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Extract necessary fields from the request body
	data, ok := reqBody["data"].(map[string]interface{})
	if !ok {
		handleError(w, "Invalid request format (missing 'data' field)", http.StatusBadRequest)
		return
	}

	batch, ok := data["batch"].([]interface{})
	if !ok || len(batch) == 0 {
		handleError(w, "Invalid request format (missing or empty 'batch' array)", http.StatusBadRequest)
		return
	}

	event, ok := batch[0].(map[string]interface{})["events"].([]interface{})
	if !ok || len(event) == 0 {
		handleError(w, "Invalid request format (missing or empty 'events' array)", http.StatusBadRequest)
		return
	}

	eventData, ok := event[0].(map[string]interface{})
	if !ok {
		handleError(w, "Invalid event format (missing 'event' object)", http.StatusBadRequest)
		return
	}

	keys, ok := eventData["keys"].([]interface{})
	if !ok || len(keys) < 4 {
		handleError(w, "Invalid event format (missing or incomplete 'keys' array)", http.StatusBadRequest)
		return
	}

	// Extract and validate address, position, day index, and color
	address := getStringValue(keys, 1)
	posHex := getStringValue(keys, 2)
	dayIdxHex := getStringValue(keys, 3)
	colorHex := getStringValue(eventData["data"], 0)

	position, err := strconv.ParseInt(posHex, 0, 64)
	if err != nil {
		handleError(w, "Error converting position hex to int", http.StatusBadRequest)
		return
	}

	dayIdx, err := strconv.ParseInt(dayIdxHex, 0, 64)
	if err != nil {
		handleError(w, "Error converting day index hex to int", http.StatusBadRequest)
		return
	}

	color, err := strconv.ParseInt(colorHex, 0, 64)
	if err != nil {
		handleError(w, "Error converting color hex to int", http.StatusBadRequest)
		return
	}

	// Validate position and color
	if position < 0 || position >= int64(core.ArtPeaceBackend.CanvasConfig.Canvas.Width*core.ArtPeaceBackend.CanvasConfig.Canvas.Height) {
		handleError(w, "Invalid position value", http.StatusBadRequest)
		return
	}

	if color < 0 || color >= (1 << core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth) {
		handleError(w, "Invalid color value", http.StatusBadRequest)
		return
	}

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	pos := uint(position) * core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	// Set pixel in Redis
	ctx := context.Background()
	if err := core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "SET", bitfieldType, pos, color).Err(); err != nil {
		handleError(w, "Failed to set pixel in Redis", http.StatusInternalServerError)
		return
	}

	// Set pixel in PostgreSQL
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(),
		"INSERT INTO Pixels (address, position, day, color) VALUES ($1, $2, $3, $4)",
		address, position, dayIdx, color)
	if err != nil {
		handleError(w, "Failed to insert pixel into PostgreSQL", http.StatusInternalServerError)
		return
	}

	// Send message to all connected WebSocket clients
	message := map[string]interface{}{
		"position": position,
		"color":    color,
	}
	messageBytes, err := json.Marshal(message)
	if err != nil {
		handleError(w, "Failed to marshal message", http.StatusInternalServerError)
		return
	}

	for idx, conn := range core.ArtPeaceBackend.WSConnections {
		if err := conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
			fmt.Println("Error sending message to WebSocket client:", err)
			// Remove disconnected WebSocket client from connections slice
			conn.Close()
			core.ArtPeaceBackend.WSConnections = append(core.ArtPeaceBackend.WSConnections[:idx], core.ArtPeaceBackend.WSConnections[idx+1:]...)
		}
	}

	// Respond with success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Pixel placed"}`))
}

func getStringValue(arr interface{}, idx int) string {
	if slice, ok := arr.([]interface{}); ok && len(slice) > idx {
		if str, ok := slice[idx].(string); ok {
			return str
		}
	}
	return ""
}

func handleError(w http.ResponseWriter, errMsg string, statusCode int) {
	fmt.Println(errMsg)
	w.WriteHeader(statusCode)
	w.Write([]byte(`{"error": "` + errMsg + `"}`))
}
