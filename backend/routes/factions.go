package routes

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"encoding/json"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitFactionRoutes() {
	http.HandleFunc("/init-factions", initFactions)
	http.HandleFunc("/upload-faction-icon", uploadFactionIcon)
	http.HandleFunc("/get-my-factions", getMyFactions)
	http.HandleFunc("/get-factions", getFactions)
	http.HandleFunc("/get-faction-members", getFactionMembers)
	// Create a static file server for the nft images
	http.Handle("/faction-images/", http.StripPrefix("/faction-images/", http.FileServer(http.Dir("./factions"))))
}

type FactionUserData struct {
	FactionId  int    `json:"factionId"`
	MemberId   int    `json:"memberId"`
	Allocation int    `json:"allocation"`
	Name       string `json:"name"`
	Pool       int    `json:"pool"`
	Members    int    `json:"members"`
	Icon       string `json:"icon"`
	Telegram   string `json:"telegram"`
	Twitter    string `json:"twitter"`
	Github     string `json:"github"`
	Site       string `json:"site"`
}

type FactionData struct {
	FactionId int    `json:"factionId"`
	Name      string `json:"name"`
	Pool      int    `json:"pool"`
	Members   int    `json:"members"`
	IsMember  bool   `json:"isMember"`
	Icon      string `json:"icon"`
	Telegram  string `json:"telegram"`
	Twitter   string `json:"twitter"`
	Github    string `json:"github"`
	Site      string `json:"site"`
}

type FactionsConfigItem struct {
	Id        int    `json:"id"`
	Name      string `json:"name"`
	Icon      string `json:"icon"`
	Leader    string `json:"leader"`
	Pool      int    `json:"pool"`
	PerMember bool   `json:"per_member"`
	Joinable  bool   `json:"joinable"`
	Links     struct {
		Telegram string `json:"telegram"`
		Twitter  string `json:"twitter"`
		Github   string `json:"github"`
		Site     string `json:"site"`
	} `json:"links"`
	Members []string `json:"members"`
}

type FactionsConfig struct {
	Factions []FactionsConfigItem `json:"factions"`
}

func initFactions(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize colors
	if routeutils.AdminMiddleware(w, r) {
		routeutils.WriteErrorJson(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// TODO: check if quests already exist
	factionJson, err := routeutils.ReadJsonBody[FactionsConfig](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to parse request body")
		return
	}

	// Insert factions info into the database
	for _, faction := range factionJson.Factions {
		_, err := core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO FactionLinks (faction_id, icon, telegram, twitter, github, site) VALUES ($1, $2, $3, $4, $5, $6)", faction.Id, faction.Icon, faction.Links.Telegram, faction.Links.Twitter, faction.Links.Github, faction.Links.Site)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert factions")
			return
		}
	}

	routeutils.WriteResultJson(w, "Initialized factions successfully")
}

func uploadFactionIcon(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to initialize colors
	if routeutils.AdminMiddleware(w, r) {
		routeutils.WriteErrorJson(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	file, header, err := r.FormFile("icon")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to get icon file")
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to read image data")
		return
	}

	if _, err := os.Stat("factions"); os.IsNotExist(err) {
		err = os.MkdirAll("factions", os.ModePerm)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create factions directory")
			return
		}
	}

	filename := fmt.Sprintf("factions/%s", header.Filename)
	out, err := os.Create(filename)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create icon file")
		return
	}
	defer out.Close()

	_, err = out.Write(fileBytes)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to write icon file")
		return
	}

	routeutils.WriteResultJson(w, "Uploaded faction icon successfully")
}

func getMyFactions(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	// TODO: Paginate and accumulate the allocations for each faction

	query := `
    SELECT m.faction_id, m.member_id, m.allocation, f.name, f.pixel_pool as pool, COALESCE((SELECT COUNT(*) FROM factionmembersinfo WHERE faction_id = m.faction_id), 0) as members, COALESCE(icon, '') as icon, COALESCE(telegram, '') as telegram, COALESCE(twitter, '') as twitter, COALESCE(github, '') as github, COALESCE(site, '') as site
    FROM factionmembersinfo m
    LEFT JOIN factions f ON m.faction_id = f.key - 1
    LEFT JOIN FactionLinks l ON m.faction_id = l.faction_id
    WHERE m.user_address = $1
    ORDER BY m.faction_id
  `
	factions, err := core.PostgresQueryJson[FactionUserData](query, address)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve factions")
		return
	}
	routeutils.WriteDataJson(w, string(factions))
}

func getFactions(w http.ResponseWriter, r *http.Request) {
	// TODO: Should we use a different query for this address argument?
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 10
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
    SELECT key - 1 as faction_id, name, pixel_pool as pool, COALESCE((SELECT COUNT(*) FROM factionmembersinfo WHERE faction_id = key - 1), 0) as members,
    COALESCE((SELECT COUNT(*) FROM factionmembersinfo WHERE faction_id = key - 1 AND user_address = $1), 0) > 0 as is_member,
    COALESCE(icon, '') as icon, COALESCE(telegram, '') as telegram, COALESCE(twitter, '') as twitter, COALESCE(github, '') as github, COALESCE(site, '') as site
    FROM factions
    LEFT JOIN FactionLinks ON key - 1 = faction_id
    ORDER BY key
    LIMIT $2 OFFSET $3
  `

	factions, err := core.PostgresQueryJson[FactionData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve factions")
		return
	}
	routeutils.WriteDataJson(w, string(factions))
}

func getFactionMembers(w http.ResponseWriter, r *http.Request) {
	factionID, err := strconv.Atoi(r.URL.Query().Get("factionID"))
	if err != nil || factionID < 0 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 10
	}
	if pageLength > 50 {
		pageLength = 50
	}

	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `
		SELECT user_address, allocation
		FROM FactionMembersInfo
		WHERE faction_id = $1
		ORDER BY allocation DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), query, factionID, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve faction members")
		fmt.Println(err)
		return
	}
	defer rows.Close()

	type FactionMember struct {
		UserAddress string `json:"userAddress"`
		Allocation  int    `json:"allocation"`
	}

	var members []FactionMember
	for rows.Next() {
		var member FactionMember
		if err := rows.Scan(&member.UserAddress, &member.Allocation); err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to scan faction member")
			return
		}
		members = append(members, member)
	}

	if err := rows.Err(); err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Error during rows iteration")
		return
	}

	membersJson, err := json.Marshal(members)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to serialize members")
		return
	}

	routeutils.WriteDataJson(w, string(membersJson))
}
