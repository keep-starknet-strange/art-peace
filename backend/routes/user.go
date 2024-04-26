package routes

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/keep-starknet-strange/art-peace/backend/core"
	"encoding/json"
	"net/http"
	"time"
)

type LastPlacedPixel struct {
	Time  time.Time json:"time"
}

func InitUserRoutes() {
	http.HandleFunc("/getExtraPixels", getExtraPixels)
	http.HandleFunc("/getUsername", getUsername)
	http.HandleFunc("/getPixelCount", getPixelCount)
	http.HandleFunc("/getLastPlacedPixel", getLastPlacedPixel)
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

func getLastPlacedPixel(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	var lastPlacedTime time.Time
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT time FROM LastPlacedTime WHERE address = $1", address).Scan(&lastPlacedTime)
	if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
	}
	// Create a LastPlacedPixel instance with the scanned timestamp
	lastPlacedPixel := LastPlacedPixel{
			Time:    lastPlacedTime,
	}
	// Convert to JSON and send the response
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(lastPlacedPixel)
	if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
	}
	w.Write([]byte(out))
}