package routes

import (
  "github.com/gorilla/mux"
)

func InitRoutes(router *mux.Router) { // THis will accepts the router instance as an argument
  InitIndexerRoutes(router)
  InitCanvasRoutes(router)
  InitQuestsRoutes(router)
  InitPixelRoutes(router)
  InitWebsocketRoutes(router)
  InitTemplateRoutes(router)
  InitUserRoutes(router)
  InitContractRoutes(router)
}

