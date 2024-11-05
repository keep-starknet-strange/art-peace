package routes

import (
	"net/http"

	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitBaseRoutes() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		routeutils.SetupHeaders(w)
		w.WriteHeader(http.StatusOK)
	})
}

func InitRoutes() {
	InitBaseRoutes()
	InitCanvasRoutes()
	InitPixelRoutes()
	InitFactionRoutes()
	InitTemplateRoutes()
	InitUserRoutes()
	InitContractRoutes()
	InitNFTRoutes()
	InitQuestsRoutes()
	InitColorsRoutes()
	InitVotableColorsRoutes()
}
