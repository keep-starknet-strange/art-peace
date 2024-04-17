package routes

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/backend/core/" // This points to your core folder
)

// GetQuests handler and also retrieves all quests from the database
func GetQuests(w http.ResponseWriter, r *http.Request) {
  quests, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM Quests")
  if err != nil {
    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
    return
  }
  defer quests.Close()

  var questList []core.Quest
  err = quests.Scan(&questList)
  if err != nil {
    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
    return
  }

  w.WriteHeader(http.StatusOK)
  json.NewEncoder(w).Encode(questList)
}

// InitQuestsRoutes registers the GetQuests handler
func InitQuestsRoutes(router *mux.Router) {
  router.HandleFunc("/quests", GetQuests).Methods(http.MethodGet)
}
