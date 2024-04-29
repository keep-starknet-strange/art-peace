package routes

import (
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitUserRoutes() {
	http.HandleFunc("/getExtraPixels", getExtraPixels)
	http.HandleFunc("/getUsername", getUsername)
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	user := r.URL.Query().Get("address")

  available, err := core.PostgresQueryOne[string]("SELECT available FROM ExtraPixels WHERE address = $1", user)
	if err != nil {
    WriteErrorJson(w, http.StatusNotFound, "No extra pixels available")
		return
	}

  WriteDataJson(w, *available)
}

func getUsername(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")

  name, err := core.PostgresQueryOne[string]("SELECT name FROM Users WHERE address = $1", address)
  if err != nil {
    WriteErrorJson(w, http.StatusNotFound, "No username found")
    return
  }

  WriteDataJson(w, *name)
}
