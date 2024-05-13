package routes

import (
	"github.com/keep-starknet-strange/art-peace/backend/routes/indexer"
)

func InitRoutes() {
	indexer.InitIndexerRoutes()
	InitCanvasRoutes()
	InitPixelRoutes()
  InitFactionRoutes()
	InitWebsocketRoutes()
	InitTemplateRoutes()
	InitUserRoutes()
	InitContractRoutes()
	InitNFTRoutes()
	InitQuestsRoutes()
	InitColorsRoutes()
	InitVotableColorsRoutes()
}
