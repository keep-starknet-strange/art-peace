package routes

import (
	"net/http"
	"strconv"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitUserRoutes() {
	http.HandleFunc("/get-last-placed-time", getLastPlacedTime)
	http.HandleFunc("/get-extra-pixels", getExtraPixels)
	http.HandleFunc("/get-username", getUsername)
	http.HandleFunc("/get-pixel-count", getPixelCount)
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	available, err := core.PostgresQueryOne[string]("SELECT available FROM ExtraPixels WHERE address = $1", address)
	if err != nil {
		WriteDataJson(w, "0") // No extra pixels available
		return
	}

	WriteDataJson(w, *available)
}

func getUsername(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	name, err := core.PostgresQueryOne[string]("SELECT name FROM Users WHERE address = $1", address)
	if err != nil {
		WriteDataJson(w, "\"\"") // No username found
		return
	}

	WriteDataJson(w, *name)
}

func getPixelCount(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1", address)
	if err != nil {
		WriteDataJson(w, "0")
		return
	}

	WriteDataJson(w, strconv.Itoa(*count))
}

func getLastPlacedTime(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	lastTime, err := core.PostgresQueryOne[time.Time]("SELECT time FROM LastPlacedTime WHERE address = $1", address)
	if err != nil {
		// TODO: Handle no row vs error differently?
		WriteDataJson(w, "0") // Never placed a pixel
		return
	}

	// Return the last placed time in utc z format
	WriteDataJson(w, "\""+string(lastTime.UTC().Format(time.RFC3339))+"\"")
}
