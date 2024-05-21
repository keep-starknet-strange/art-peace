package routes

import (
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitUserRoutes() {
	http.HandleFunc("/get-user-vote", getUserColorVote)
	http.HandleFunc("/get-username-store-address", getUsernameStoreAddress)
	http.HandleFunc("/set-username-store-address", setUsernameStoreAddress)
	http.HandleFunc("/get-last-placed-time", getLastPlacedTime)
	http.HandleFunc("/get-faction-pixels", getFactionPixels)
	http.HandleFunc("/get-extra-pixels", getExtraPixels)
	http.HandleFunc("/get-username", getUsername)
	http.HandleFunc("/get-pixel-count", getPixelCount)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/new-username-devnet", newUsernameDevnet)
		http.HandleFunc("/change-username-devnet", changeUsernameDevnet)
	}
}

func getUsernameStoreAddress(w http.ResponseWriter, r *http.Request) {
	contractAddress := os.Getenv("USERNAME_STORE_CONTRACT_ADDRESS")
	routeutils.WriteDataJson(w, "\""+contractAddress+"\"")
}

// TODO: Set env var on infra level in production
func setUsernameStoreAddress(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to set contract address
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	data, err := io.ReadAll(r.Body)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}
	os.Setenv("USERNAME_STORE_CONTRACT_ADDRESS", string(data))
	routeutils.WriteResultJson(w, "Contract address set")
}

type MembershipPixelsData struct {
	FactionId      int        `json:"factionId"`
	MemberId       int        `json:"memberId"`
	Allocation     int        `json:"allocation"`
	LastPlacedTime *time.Time `json:"lastPlacedTime"`
	MemberPixels   int        `json:"memberPixels"`
}

func getFactionPixels(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	membershipPixels, err := core.PostgresQueryJson[MembershipPixelsData]("SELECT faction_id, member_id, allocation, last_placed_time, member_pixels FROM FactionMembersInfo WHERE user_address = $1", address)
	if err != nil {
		routeutils.WriteDataJson(w, "[]")
		return
	}

	routeutils.WriteDataJson(w, string(membershipPixels))
}

func getExtraPixels(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	available, err := core.PostgresQueryOne[string]("SELECT available FROM ExtraPixels WHERE address = $1", address)
	if err != nil {
		routeutils.WriteDataJson(w, "0") // No extra pixels available
		return
	}

	routeutils.WriteDataJson(w, *available)
}

func getUsername(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	name, err := core.PostgresQueryOne[string]("SELECT name FROM Users WHERE address = $1", address)
	if err != nil {
		routeutils.WriteDataJson(w, "\"\"") // No username found
		return
	}

	routeutils.WriteDataJson(w, "\""+*name+"\"")
}

func getPixelCount(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1", address)
	if err != nil {
		routeutils.WriteDataJson(w, "0")
		return
	}

	routeutils.WriteDataJson(w, strconv.Itoa(*count))
}

func getLastPlacedTime(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	lastTime, err := core.PostgresQueryOne[*time.Time]("SELECT COALESCE((SELECT time FROM LastPlacedTime WHERE address = $1), TO_TIMESTAMP(0))", address)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get last placed time")
		return
	}

	// Return the last placed time in utc z format
	routeutils.WriteDataJson(w, "\""+string((*lastTime).UTC().Format(time.RFC3339))+"\"")
}

func newUsernameDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	username := (*jsonBody)["username"]

	if username == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing username parameter")
		return
	}

	if len(username) > 31 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Username too long (max 31 characters)")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.NewUsernameDevnet
	contract := os.Getenv("USERNAME_STORE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "claim_username", username)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Username claimed")
}

func changeUsernameDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	username := (*jsonBody)["username"]

	if username == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing username parameter")
		return
	}

	if len(username) > 31 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Username too long (max 31 characters)")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.ChangeUsernameDevnet
	contract := os.Getenv("USERNAME_STORE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "change_username", username)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to place pixel on devnet")
		return
	}

	routeutils.WriteResultJson(w, "Username changed")
}

func getUserColorVote(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	vote, err := core.PostgresQueryOne[int]("SELECT COALESCE((SELECT color_key FROM ColorVotes WHERE user_address = $1 AND day_index = (SELECT MAX(day_index) FROM days)), 0)", address)

	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get user color vote")
		return
	}

	routeutils.WriteDataJson(w, strconv.Itoa(*vote))
}
