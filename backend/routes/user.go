package routes

import (
	"context"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitUserRoutes() {
	http.HandleFunc("/getExtraPixels", getExtraPixels)
	http.HandleFunc("/getUsername", getUsername)
	http.HandleFunc("/getPixelCount", getPixelCount)
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
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error": "Username not found"}`))
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
