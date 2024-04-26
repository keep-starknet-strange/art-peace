package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

type VotableColor struct {
	Key   int    `json:"key"`
	Hex   string `json:"hex"`
	Votes int    `json:"votes"`
}
type ColorsRequest struct {
	Colors []string `json:"colors"`
}

func InitVotableColorsRoutes() {
	http.HandleFunc("/init-votable-colors", InitVotableColors)
	http.HandleFunc("/votableColors", GetVotableColorsWithVoteCount)
}

func InitVotableColors(w http.ResponseWriter, r *http.Request) {
	//Todo: Make sure Votable colors is not present in Color Table
	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	var request ColorsRequest
	err = json.Unmarshal(reqBody, &request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	// Check for duplicate colors in the request
	uniqueColors := make(map[string]bool)
	for _, colorHex := range request.Colors {
		if _, exists := uniqueColors[colorHex]; exists {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Duplicate colors are not allowed"))
			return
		}
		uniqueColors[colorHex] = true
	}

	// Proceed with inserting unique colors into the VotableColors table
	for _, colorHex := range request.Colors {
		// Check if color already exists in the VotableColors table
		var count int
		err := core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "SELECT COUNT(*) FROM VotableColors WHERE hex = $1", colorHex).Scan(&count)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Error checking existing colors"))
			return
		}
		if count > 0 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Color already exists"))
			return
		}

		// Insert the color into the VotableColors table
		_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), `
			INSERT INTO VotableColors (hex, votes)
			VALUES ($1, $2)
		`, colorHex, 0) // Assuming initial votes count is 0
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Votable colors initialized"))
	fmt.Println("Votable colors initialized")
}

func GetVotableColorsWithVoteCount(w http.ResponseWriter, r *http.Request) {

	//Todo: Add userAddress field in response

	var votableColors []VotableColor

	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), `
	SELECT vc.key, vc.hex, COALESCE(cv.votes, 0) AS votes
	FROM VotableColors vc
	LEFT JOIN (
		SELECT colorKey, COUNT(DISTINCT userAddress) AS votes
		FROM ColorVotes
		GROUP BY colorKey
	) cv ON vc.key = cv.colorKey
	ORDER BY vc.key ASC
	`)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	defer rows.Close()

	for rows.Next() {
		var color VotableColor
		if err := rows.Scan(&color.Key, &color.Hex, &color.Votes); err != nil {
			log.Println("Error scanning votable color row:", err)
			continue
		}
		votableColors = append(votableColors, color)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	if len(votableColors) == 0 {
		// Return an empty array as JSON
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("[]"))
		return
	}

	out, err := json.Marshal(votableColors)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}
