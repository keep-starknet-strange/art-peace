package routes

import (
	"context"
	"net/http"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitUserRoutes() {
	http.HandleFunc("/getExtraPixels", getExtraPixels)
	http.HandleFunc("/getUsername", getUsername)
	http.HandleFunc("/getPixelCount", getPixelCount) //  new route
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	user := r.URL.Query().Get("address")

	var available string
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT available FROM ExtraPixels WHERE address = $1", user).Scan(&available)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(available))
}

func getUsername(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")

	var name string
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT name FROM Users WHERE address = $1", address).Scan(&name)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(name))
}

func getPixelCount(w http.ResponseWriter, r *http.Request) {
	userAddress := r.URL.Query().Get("address")
	if userAddress == "" {
		http.Error(w, "Missing address parameter", http.StatusBadRequest)
		return
	}

	var count int
	query := "SELECT COUNT(*) FROM Pixels WHERE address = $1"
	err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), query, userAddress).Scan(&count)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(strconv.Itoa(count)))
}
