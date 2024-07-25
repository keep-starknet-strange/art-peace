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
	http.HandleFunc("/get-chain-faction-pixels", getChainFactionPixels)
	http.HandleFunc("/get-faction-pixels", getFactionPixels)
	http.HandleFunc("/get-extra-pixels", getExtraPixels)
	http.HandleFunc("/get-username", getUsername)
	http.HandleFunc("/get-pixel-count", getPixelCount)
	http.HandleFunc("/check-username-unique", checkUsernameUnique)
	http.HandleFunc("/get-user-rewards", getUserRewards)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/new-username-devnet", newUsernameDevnet)
		http.HandleFunc("/change-username-devnet", changeUsernameDevnet)
	}
}

func getUsernameStoreAddress(w http.ResponseWriter, r *http.Request) {
	contractAddress := os.Getenv("USERNAME_STORE_CONTRACT_ADDRESS")
	routeutils.WriteDataJson(w, "\""+contractAddress+"\"")
}

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

	membershipPixels, err := core.PostgresQueryJson[MembershipPixelsData]("SELECT F.faction_id, allocation, last_placed_time, member_pixels FROM FactionMembersInfo FMI LEFT JOIN Factions F ON F.faction_id = FMI.faction_id WHERE user_address = $1", address)
	if err != nil {
		routeutils.WriteDataJson(w, "[]")
		return
	}

	routeutils.WriteDataJson(w, string(membershipPixels))
}

func getChainFactionPixels(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	membershipPixels, err := core.PostgresQueryJson[MembershipPixelsData]("SELECT F.faction_id, 2 as allocation, last_placed_time, member_pixels FROM ChainFactionMembersInfo FMI LEFT JOIN ChainFactions F ON F.faction_id = FMI.faction_id WHERE user_address = $1", address)
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

	if len(username) > 64 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Username too long (max 31 characters)")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.NewUsernameDevnet
	contract := os.Getenv("USERNAME_STORE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "claim_username", username)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to claim username on devnet")
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

	if len(username) > 64 {
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

func checkUsernameUnique(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing username parameter")
		return
	}

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Users WHERE name = $1", username)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to check username uniqueness")
		return
	}

	routeutils.WriteDataJson(w, strconv.Itoa(*count))
}

type UserRewardsData struct {
	Address string `json:"address"`
	Amount  int    `json:"amount"`
	Type    string `json:"type"`
}

func getUserRewards(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing address parameter")
		return
	}

	rewards, err := core.PostgresQueryJson[UserRewardsData]("SELECT address, amount, type FROM AwardWinners WHERE address = $1", address)
	if err != nil {
		routeutils.WriteDataJson(w, "[]")
		return
	}

	routeutils.WriteDataJson(w, string(rewards))
}
