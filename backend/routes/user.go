package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

type LastPlacedTime struct {
	Time time.Time `json:"time"`
}

func InitUserRoutes() {
	http.HandleFunc("/get-last-placed-time", getLastPlacedTime)
	http.HandleFunc("/get-extra-pixels", getExtraPixels)
	http.HandleFunc("/get-username", getUsername)
	http.HandleFunc("/get-pixel-count", getPixelCount)
}

func setCommonHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)

	user := r.URL.Query().Get("address")
	var available string
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT available FROM ExtraPixels WHERE address = $1", user).Scan(&available)
	if err != nil {
		if err == pgx.ErrNoRows {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"available": 0}`))
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error": "Internal server error"}`))
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf(`{"available": "%s"}`, available)))
}

func getUsername(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)

	address := r.URL.Query().Get("address")
	var name string
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT name FROM Users WHERE address = $1", address).Scan(&name)
	if err != nil {
		if err == pgx.ErrNoRows {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"username": ""}`))
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error": "Internal server error"}`))
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf(`{"name": "%s"}`, name)))
}

func getPixelCount(w http.ResponseWriter, r *http.Request) {
	setCommonHeaders(w)

	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		http.Error(w, `{"error": "Missing address parameter"}`, http.StatusBadRequest)
		return
	}

	var count int
	query := "SELECT COUNT(*) FROM Pixels WHERE address = $1"
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), query, userAddress).Scan(&count)
	if err != nil {
		if err == pgx.ErrNoRows {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"count": 0}`))
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error": "Internal server error"}`))
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf(`{"count": %d}`, count)))
}

func getLastPlacedTime(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, `{"error": "Missing address parameter"}`, http.StatusBadRequest)
		return
	}

	var lastTime time.Time
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT time FROM LastPlacedTime WHERE address = $1", address).Scan(&lastTime)
	if err != nil {
		if err == pgx.ErrNoRows {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"time": 0}`))
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error": "Internal server error"}`))
		}
		return
	}

	// Create a LastPlacedPixel instance with the scanned timestamp
	lastPlacedTime := LastPlacedTime{Time: lastTime}
	// Convert to JSON and send the response
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(lastPlacedTime)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}
