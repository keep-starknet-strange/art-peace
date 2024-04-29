package routes

import (
	"context"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

type VotableColor struct {
	Key   int    `json:"key"`
	Hex   string `json:"hex"`
	Votes int    `json:"votes"`
}

func InitVotableColorsRoutes() {
	http.HandleFunc("/init-votable-colors", InitVotableColors)
	http.HandleFunc("/votable-colors", GetVotableColorsWithVoteCount)
}

func InitVotableColors(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize votable colors
	if AdminMiddleware(w, r) {
		return
	}

	// TODO: Make sure Votable colors is not present in Color Table
	// TODO: Check if votable colors are already initialized
	colors, err := ReadJsonBody[[]ColorType](r)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	// Check for duplicate colors in the request
	uniqueColors := make(map[string]bool)
	for _, colorHex := range *colors {
		if _, exists := uniqueColors[colorHex]; exists {
			WriteErrorJson(w, http.StatusBadRequest, "Duplicate colors in the request")
			return
		}
		uniqueColors[colorHex] = true
	}

	// Proceed with inserting unique colors into the VotableColors table
	for _, colorHex := range *colors {
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), `
			INSERT INTO VotableColors (hex)
			VALUES ($1)
		`, colorHex)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Error inserting votable color: "+colorHex)
			return
		}
	}

	WriteResultJson(w, "Votable colors initialized")
}

func GetVotableColorsWithVoteCount(w http.ResponseWriter, r *http.Request) {

	votableColors, err := core.PostgresQueryJson[VotableColor](`
	  SELECT vc.key, vc.hex, COALESCE(cv.votes, 0) AS votes
	  FROM VotableColors vc
	  LEFT JOIN (
	  	SELECT color_key, COUNT(DISTINCT user_address) AS votes
	  	FROM ColorVotes
	  	GROUP BY color_key
	  ) cv ON vc.key = cv.color_key
	`)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Error fetching votable colors")
		return
	}

	// TODO: Move into query func
	// if len(votableColors) == 0 {
	// 	// Return an empty array as JSON
	//   WriteDataJson(w, "[]")
	// 	return
	// }

	WriteDataJson(w, string(votableColors))
}
