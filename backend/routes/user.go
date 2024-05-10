package routes

import (
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitUserRoutes() {
	http.HandleFunc("/get-last-placed-time", getLastPlacedTime)
	http.HandleFunc("/get-extra-pixels", getExtraPixels)
	http.HandleFunc("/get-username", getUsername)
	http.HandleFunc("/get-pixel-count", getPixelCount)
  if !core.ArtPeaceBackend.BackendConfig.Production {
    http.HandleFunc("/new-username-devnet", newUsernameDevnet)
    http.HandleFunc("/change-username-devnet", changeUsernameDevnet)
  }
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	available, err := core.PostgresQueryOne[string]("SELECT available FROM ExtraPixels WHERE address = $1", address)
	if err != nil {
		WriteDataJson(w, "0") // No extra pixels available
		return
	}

	WriteDataJson(w, *available)
}

func getUsername(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	name, err := core.PostgresQueryOne[string]("SELECT name FROM Users WHERE address = $1", address)
	if err != nil {
		WriteDataJson(w, "\"\"") // No username found
		return
	}

	WriteDataJson(w, *name)
}

func getPixelCount(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1", address)
	if err != nil {
		WriteDataJson(w, "0")
		return
	}

	WriteDataJson(w, strconv.Itoa(*count))
}

func getLastPlacedTime(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	lastTime, err := core.PostgresQueryOne[*time.Time]("SELECT time FROM LastPlacedTime WHERE address = $1", address)
	if err != nil {
		// TODO: Handle no row vs error differently?
		WriteDataJson(w, "0") // Never placed a pixel
		return
	}

	// Return the last placed time in utc z format
	WriteDataJson(w, "\""+string((*lastTime).UTC().Format(time.RFC3339))+"\"")
}

func newUsernameDevnet(w http.ResponseWriter, r *http.Request) {
  // Disable this in production
  if NonProductionMiddleware(w, r) {
    return
  }

  jsonBody, err := ReadJsonBody[map[string]string](r)
  if err != nil {
    WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
    return
  }

  username := (*jsonBody)["username"]

  if username == "" {
    WriteErrorJson(w, http.StatusBadRequest, "Missing username parameter")
    return
  }

  if len(username) > 31 {
    WriteErrorJson(w, http.StatusBadRequest, "Username too long (max 31 characters)")
    return
  }

  shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.NewUsernameDevnet
  contract := os.Getenv("USERNAME_STORE_CONTRACT")

  cmd := exec.Command(shellCmd, contract, "claim_username", username)
  _, err = cmd.Output()
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
    return
  }

  WriteResultJson(w, "Username claimed")
}

func changeUsernameDevnet(w http.ResponseWriter, r *http.Request) {
  // Disable this in production
  if NonProductionMiddleware(w, r) {
    return
  }

  jsonBody, err := ReadJsonBody[map[string]string](r)
  if err != nil {
    WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
    return
  }

  username := (*jsonBody)["username"]

  if username == "" {
    WriteErrorJson(w, http.StatusBadRequest, "Missing username parameter")
    return
  }

  if len(username) > 31 {
    WriteErrorJson(w, http.StatusBadRequest, "Username too long (max 31 characters)")
    return
  }

  shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.ChangeUsernameDevnet
  contract := os.Getenv("USERNAME_STORE_CONTRACT")

  cmd := exec.Command(shellCmd, contract, "change_username", username)
  _, err = cmd.Output()
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
    return
  }

  WriteResultJson(w, "Username changed")
}
