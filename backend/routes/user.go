package routes

import (
	"context"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitUserRoutes() {
	http.HandleFunc("/getExtraPixels", getExtraPixels)
	http.HandleFunc("/getUsername", getUsername)
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
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
