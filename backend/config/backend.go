package config

import (
	"encoding/json"
	"os"
)

type BackendScriptsConfig struct {
	PlacePixelDevnet            string `json:"place_pixel_devnet"`
	PlaceExtraPixelsDevnet      string `json:"place_extra_pixels_devnet"`
	AddTemplateDevnet           string `json:"add_template_devnet"`
	ClaimTodayQuestDevnet       string `json:"claim_today_quest_devnet"`
	MintNFTDevnet               string `json:"mint_nft_devnet"`
	LikeNFTDevnet               string `json:"like_nft_devnet"`
	UnlikeNFTDevnet             string `json:"unlike_nft_devnet"`
	VoteColorDevnet             string `json:"vote_color_devnet"`
	NewUsernameDevnet           string `json:"new_username_devnet"`
	ChangeUsernameDevnet        string `json:"change_username_devnet"`
	IncreaseDayDevnet           string `json:"increase_day_devnet"`
	JoinChainFactionDevnet      string `json:"join_chain_faction_devnet"`
	JoinFactionDevnet           string `json:"join_faction_devnet"`
	LeaveFactionDevnet          string `json:"leave_faction_devnet"`
	AddFactionTemplateDevnet    string `json:"add_faction_template_devnet"`
	RemoveFactionTemplateDevnet string `json:"remove_faction_template_devnet"`
	CreateCanvasDevnet          string `json:"create_canvas_devnet"`
	FavoriteWorldDevnet         string `json:"favorite_world_devnet"`
	UnfavoriteWorldDevnet       string `json:"unfavorite_world_devnet"`
	PlaceWorldPixelDevnet       string `json:"place_world_pixel_devnet"`
	AddStencilDevnet            string `json:"add_stencil_devnet"`
	RemoveStencilDevnet         string `json:"remove_stencil_devnet"`
	FavoriteStencilDevnet       string `json:"favorite_stencil_devnet"`
	UnfavoriteStencilDevnet     string `json:"unfavorite_stencil_devnet"`
}

type WebSocketConfig struct {
	ReadBufferSize  int `json:"read_buffer_size"`
	WriteBufferSize int `json:"write_buffer_size"`
}

type HttpConfig struct {
	AllowOrigin  []string `json:"allow_origin"`
	AllowMethods []string `json:"allow_methods"`
	AllowHeaders []string `json:"allow_headers"`
}

type BackendConfig struct {
	Host         string               `json:"host"`
	Port         int                  `json:"port"`
	ConsumerPort int                  `json:"consumer_port"`
	WsHost       string               `json:"ws_host"`
	WsPort       int                  `json:"ws_port"`
	Scripts      BackendScriptsConfig `json:"scripts"`
	Production   bool                 `json:"production"`
	WebSocket    WebSocketConfig      `json:"websocket"`
	Http         HttpConfig           `json:"http_config"`
}

var DefaultBackendConfig = BackendConfig{
	Host:         "localhost",
	Port:         8080,
	ConsumerPort: 8081,
	WsHost:       "localhost",
	WsPort:       8082,
	Scripts: BackendScriptsConfig{
		PlacePixelDevnet:            "../scripts/place_pixel.sh",
		PlaceExtraPixelsDevnet:      "../scripts/place_extra_pixels.sh",
		AddTemplateDevnet:           "../scripts/add_template.sh",
		ClaimTodayQuestDevnet:       "../scripts/claim_today_quest.sh",
		MintNFTDevnet:               "../scripts/mint_nft.sh",
		LikeNFTDevnet:               "../scripts/like_nft.sh",
		UnlikeNFTDevnet:             "../scripts/unlike_nft.sh",
		VoteColorDevnet:             "../scripts/vote_color.sh",
		NewUsernameDevnet:           "../scripts/new_username.sh",
		ChangeUsernameDevnet:        "../scripts/change_username.sh",
		IncreaseDayDevnet:           "../scripts/increase_day_index.sh",
		JoinChainFactionDevnet:      "../scripts/join_chain_faction.sh",
		JoinFactionDevnet:           "../scripts/join_faction.sh",
		LeaveFactionDevnet:          "../scripts/leave_faction.sh",
		AddFactionTemplateDevnet:    "../scripts/add_faction_template.sh",
		RemoveFactionTemplateDevnet: "../scripts/remove_faction_template.sh",
		CreateCanvasDevnet:          "../scripts/create_canvas.sh",
		FavoriteWorldDevnet:         "../scripts/favorite_world.sh",
		UnfavoriteWorldDevnet:       "../scripts/unfavorite_world.sh",
		PlaceWorldPixelDevnet:       "../scripts/place_world_pixel.sh",
		AddStencilDevnet:            "../scripts/add_stencil.sh",
		RemoveStencilDevnet:         "../scripts/remove_stencil.sh",
		FavoriteStencilDevnet:       "../scripts/favorite_stencil.sh",
		UnfavoriteStencilDevnet:     "../scripts/unfavorite_stencil.sh",
	},
	Production: false,
	WebSocket: WebSocketConfig{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	},
	Http: HttpConfig{
		AllowOrigin:  []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type"},
	},
}

var DefaultBackendConfigPath = "../configs/backend.config.json"

func LoadBackendConfig(backendConfigPath string) (*BackendConfig, error) {
	file, err := os.Open(backendConfigPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	config := BackendConfig{}
	err = decoder.Decode(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
