package routes

import (
	"context"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitColorsRoutes() {
	http.HandleFunc("/init-colors", InitColors)
	http.HandleFunc("/get-colors", GetAllColors)
	http.HandleFunc("/get-color", GetSingleColor)
}

type ColorType = string

func InitColors(w http.ResponseWriter, r *http.Request) {
  // Only allow admin to initialize colors
  if AdminMiddleware(w, r) {
    return
  }

	// TODO: check if colors already exist
  colors, err := ReadJsonBody[[]ColorType](r)
  if err != nil {
    WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
    return
  }

	for _, color := range *colors {
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO colors (hex) VALUES ($1)", color)
		if err != nil {
      WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert color: " + color)
			return
		}
	}

  WriteResultJson(w, "Colors initialized")
}

func GetAllColors(w http.ResponseWriter, r *http.Request) {
  colors, err := core.PostgresQueryJson[ColorType]("SELECT hex FROM colors ORDER BY key")
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve colors")
    return
  }

  WriteDataJson(w, string(colors))
}

func GetSingleColor(w http.ResponseWriter, r *http.Request) {
	colorKey := r.URL.Query().Get("id")
	if colorKey == "" {
    WriteErrorJson(w, http.StatusBadRequest, "ID not provided")
		return
	}

  color, err := core.PostgresQueryOne[ColorType]("SELECT hex FROM colors WHERE key = $1", colorKey)
  if err != nil {
    WriteErrorJson(w, http.StatusNotFound, "Color not found")
    return
  }

  WriteDataJson(w, *color)
}
