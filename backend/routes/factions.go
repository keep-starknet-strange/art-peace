package routes

import (
	"net/http"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitFactionRoutes() {
  http.HandleFunc("/get-my-factions", getMyFactions)
}

type FactionUserData struct {
  FactionId int `json:"factionId"`
  MemberId int `json:"memberId"`
  Allocation int `json:"allocation"`
  Name string `json:"name"`
}

func getMyFactions(w http.ResponseWriter, r *http.Request) {
  address := r.URL.Query().Get("address")

  factions, err := core.PostgresQueryJson[FactionUserData]("select m.faction_id, m.member_id, m.allocation, f.name from factionmembersinfo m LEFT JOIN factions f ON m.faction_id = f.key - 1 WHERE m.user_address = $1", address)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve factions")
    return
  }
  routeutils.WriteDataJson(w, string(factions))
}
