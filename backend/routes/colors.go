package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

type Colors struct {
	Key string `json:"key"`
	Hex string `json:"hex"`
}

func InitColorsRoutes() {
	http.HandleFunc("/get-colors", GetAllColors)
	http.HandleFunc("/get-color", GetSingleColor)
}

func GetAllColors(w http.ResponseWriter, r *http.Request) {

	var colors []Colors
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM colors")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	defer rows.Close()

	for rows.Next() {
		var c Colors
		err := rows.Scan(&c.Key, &c.Hex)
		if err != nil {
			log.Fatalf("Scan failed: %v\n", err)
		}
		colors = append(colors, c)
	}
	if err := rows.Err(); err != nil {
		log.Fatalf("Error retrieving data: %v\n", err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(colors)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}

func GetSingleColor(w http.ResponseWriter, r *http.Request) {

	colorKey := r.URL.Query().Get("id")
	if colorKey == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("ID not provided"))
		return
	}

	var c Colors
	row := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT key, hex FROM colors WHERE key = $1", colorKey)
	err := row.Scan(&c.Key, &c.Hex)
	if err != nil {
		if err == pgx.ErrNoRows {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("Color not found"))
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
		}
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(c)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}