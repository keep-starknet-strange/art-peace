package routes

import (
	"context"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitColorsRoutes() {
	http.HandleFunc("/init-colors", InitColors)
	http.HandleFunc("/get-colors", GetAllColors)
	http.HandleFunc("/get-color", GetSingleColor)
}

type ColorType = string

func InitColors(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize colors
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	// TODO: check if colors already exist
	colors, err := routeutils.ReadJsonBody[[]ColorType](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	for _, color := range *colors {
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO colors (hex) VALUES ($1)", color)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert color: "+color)
			return
		}
	}

	routeutils.WriteResultJson(w, "Colors initialized")
}

func GetAllColors(w http.ResponseWriter, r *http.Request) {
	colors, err := core.PostgresQueryJson[ColorType]("SELECT hex FROM colors ORDER BY color_key")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve colors")
		return
	}

	routeutils.WriteDataJson(w, string(colors))
}

func GetSingleColor(w http.ResponseWriter, r *http.Request) {
	colorKey := r.URL.Query().Get("id")
	if colorKey == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "ID not provided")
		return
	}

	color, err := core.PostgresQueryOne[ColorType]("SELECT hex FROM colors WHERE color_key = $1", colorKey)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusNotFound, "Color not found")
		return
	}

	routeutils.WriteDataJson(w, *color)
}
