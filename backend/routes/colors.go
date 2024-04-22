package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

type Colors struct {
	Hex string `json:"hex"`
}

func InitColorsRoutes() {
	http.HandleFunc("/get-colors", GetAllColors)
	http.HandleFunc("/get-color", GetSingleColor)
	http.HandleFunc("/init-colors", InitColors)
}

func GetAllColors(w http.ResponseWriter, r *http.Request) {

	var colors []Colors
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT hex FROM colors")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	defer rows.Close()

	for rows.Next() {
		var c Colors
		err := rows.Scan(&c.Hex)
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
	row := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT hex FROM colors WHERE key = $1", colorKey)
	err := row.Scan(&c.Hex)
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

func InitColors(w http.ResponseWriter, r *http.Request) {
	// TODO: Add authentication and/or check if colors already exist
	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	var colors []string
	err = json.Unmarshal(reqBody, &colors)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	for _, color := range colors {
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO colors (hex) VALUES ($1)", color)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Colors initialized"))
	fmt.Println("Colors initialized")
}
