package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitStencilsRoutes() {
	http.HandleFunc("/get-stencil", getStencil)
	http.HandleFunc("/get-stencils", getStencils)
	http.HandleFunc("/get-new-stencils", getNewStencils)
	http.HandleFunc("/get-favorite-stencils", getFavoriteStencils)
	// TODO: Hot/top use user interactivity instead of favorite count
	http.HandleFunc("/get-top-stencils", getTopStencils)
	http.HandleFunc("/get-hot-stencils", getHotStencils)
	http.HandleFunc("/add-stencil-img", addStencilImg)
	http.HandleFunc("/add-stencil-data", addStencilData)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/add-stencil-devnet", addStencilDevnet)
		http.HandleFunc("/remove-stencil-devnet", removeStencilDevnet)
		http.HandleFunc("/favorite-stencil-devnet", favoriteStencilDevnet)
		http.HandleFunc("/unfavorite-stencil-devnet", unfavoriteStencilDevnet)
	}
	http.HandleFunc("/get-stencil-pixel-data", getStencilPixelData)
}

func InitStencilsStaticRoutes() {
	http.Handle("/stencils/", http.StripPrefix("/stencils/", http.FileServer(http.Dir("./stencils"))))
}

type StencilData struct {
	StencilId int    `json:"stencilId"`
	WorldId   int    `json:"worldId"`
	Name      string `json:"name"`
	Hash      string `json:"hash"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Position  int    `json:"position"`
	Favorites int    `json:"favorites"`
	Favorited bool   `json:"favorited"`
}

func getStencil(w http.ResponseWriter, r *http.Request) {
	stencilId := r.URL.Query().Get("stencilId")
	if stencilId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing stencilId")
		return
	}

	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}

	world, err := core.PostgresQueryOneJson[StencilData]("SELECT * FROM stencils WHERE stencil_id = $1 and world_id = $2", stencilId, worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Stencil")
		return
	}

	routeutils.WriteDataJson(w, string(world))
}

func getStencils(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}
	worldIdInt, err := strconv.Atoi(worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
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
        SELECT 
            stencils.*, 
            COALESCE(favortie_count, 0) AS favorites,
            COALESCE((SELECT true FROM stencilfavorites WHERE user_address = $1 AND stencilfavorites.stencil_id = stencils.stencil_id AND stencilfavorites.world_id = $2), false) as favorited
        FROM 
            stencils
        LEFT JOIN (
            SELECT 
                stencil_id,
                world_id, 
                COUNT(*) AS favorites
            FROM 
                stencilfavorites
            GROUP BY 
                (world_id, stencil_id)
        ) stencilfavorites ON stencils.world_id = stencilfavorites.world_id AND stencils.stencil_id = stencilfavorites.stencil_id
        ORDER BY stencils.stencil_id DESC
        LIMIT $3 OFFSET $4`
	stencils, err := core.PostgresQueryJson[StencilData](query, address, worldIdInt, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(stencils))
}

func getNewStencils(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}
	worldIdInt, err := strconv.Atoi(worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
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
        SELECT 
            stencils.*, 
            COALESCE(stencilfavorites.favorites, 0) AS favorites,
            COALESCE((SELECT true FROM stencilfavorites WHERE user_address = $1 AND stencilfavorites.stencil_id = stencils.stencil_id AND stencilfavorites.world_id = $2), false) as favorited
        FROM 
            stencils
        LEFT JOIN (
            SELECT 
                stencil_id,
                world_id, 
                COUNT(*) AS favorites
            FROM 
                stencilfavorites
            GROUP BY 
                (world_id, stencil_id)
        ) stencilfavorites ON stencils.world_id = stencilfavorites.world_id AND stencils.stencil_id = stencilfavorites.stencil_id
        ORDER BY stencils.stencil_id DESC
        LIMIT $3 OFFSET $4`
	stencils, err := core.PostgresQueryJson[StencilData](query, address, worldIdInt, pageLength, offset)
	if err != nil {
		fmt.Println(err)
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(stencils))
}

func getHotStencils(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}
	worldIdInt, err := strconv.Atoi(worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	// hot limit is the number of last favorites to consider when calculating hotness
	hotLimit, err := strconv.Atoi(r.URL.Query().Get("hotLimit"))
	if err != nil || hotLimit <= 0 {
		hotLimit = 100
	}
	if hotLimit > 500 {
		hotLimit = 500
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
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
      SELECT
          stencils.*,
          COALESCE(stencilfavorites.favorite_count, 0) AS favorites,
          COALESCE((
              SELECT true FROM stencilfavorites
              WHERE user_address = $1 AND stencilfavorites.stencil_id = stencils.stencil_id AND stencilfavorites.world_id = $2),
          false) as favorited
      FROM
          stencils
      LEFT JOIN (
          SELECT
              stencil_id,
              world_id,
              COUNT(*) AS favorite_count FROM stencilfavorites GROUP BY (world_id, stencil_id)
      ) stencilfavorites ON stencils.world_id = stencilfavorites.world_id AND stencils.stencil_id = stencilfavorites.stencil_id
      LEFT JOIN (
          SELECT
              latestfavorites.stencil_id,
              COUNT(*) as rank
          FROM (
              SELECT * FROM stencilfavorites
              ORDER BY key DESC LIMIT $2
          ) latestfavorites
          GROUP BY (stencil_id, world_id)
      ) rank ON stencils.stencil_id = rank.stencil_id AND stencils.world_id = $3
      ORDER BY COALESCE(rank, 0) DESC
      LIMIT $4 OFFSET $5;`
	stencils, err := core.PostgresQueryJson[StencilData](query, address, worldIdInt, hotLimit, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Hot Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(stencils))
}

func getTopStencils(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}
	worldIdInt, err := strconv.Atoi(worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
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
        SELECT 
            stencils.*, 
            COALESCE(stencilfavorites.favorite_count, 0) AS favorites,
            COALESCE((SELECT true FROM stencilfavorites WHERE user_address = $1 AND stencilfavorites.stencil_id = stencils.stencil_id AND stencilfavorites.world_id = $2), false) as favorited
        FROM 
            stencils
        LEFT JOIN (
            SELECT 
                stencil_id,
                world_id, 
                COUNT(*) AS favorite_count
            FROM 
                stencilfavorites
            GROUP BY 
                (world_id, stencil_id)
        ) stencilfavorites ON stencils.world_id = stencilfavorites.world_id AND stencils.stencil_id = stencilfavorites.stencil_id
        ORDER BY 
            favorites DESC
        LIMIT $3 OFFSET $4`
	stencils, err := core.PostgresQueryJson[StencilData](query, address, worldIdInt, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(stencils))
}

func getFavoriteStencils(w http.ResponseWriter, r *http.Request) {
	worldId := r.URL.Query().Get("worldId")
	if worldId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Missing worldId")
		return
	}
	worldIdInt, err := strconv.Atoi(worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
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
        SELECT * FROM (
          SELECT 
              stencils.*, 
              COALESCE(favorite_count, 0) AS favorites,
              COALESCE((SELECT true FROM stencilfavorites WHERE user_address = $1 AND stencilfavorites.stencil_id = stencils.stencil_id AND stencilfavorites.world_id = $2), false) as favorited
          FROM 
              stencils
          LEFT JOIN (
              SELECT 
                  stencil_id,
                  world_id, 
                  COUNT(*) AS favorite_count
              FROM 
                  stencilfavorites
              GROUP BY 
                  (world_id, stencil_id)
          ) stencilfavorites ON stencils.world_id = stencilfavorites.world_id AND stencils.stencil_id = stencilfavorites.stencil_id
        ) w
        WHERE w.favorited = true
        ORDER BY 
            w.favorites DESC
        LIMIT $3 OFFSET $4`
	stencils, err := core.PostgresQueryJson[StencilData](query, address, worldIdInt, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Worlds")
		return
	}
	routeutils.WriteDataJson(w, string(stencils))
}

func addStencilImg(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("image")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read image")
		return
	}
	defer file.Close()

	// Decode the image to check dimensions
	img, _, err := image.Decode(file)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to decode image")
		return
	}
	bounds := img.Bounds()
	width, height := bounds.Max.X-bounds.Min.X, bounds.Max.Y-bounds.Min.Y
	if width < 5 || width > 256 || height < 5 || height > 256 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid image dimensions")
		return
	}

	file.Seek(0, 0)

	// Read all data from the uploaded file and write it to the temporary file
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to read image data")
		return
	}

	r.Body.Close()

	imageData, err := imageToPixelData(fileBytes, 1)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert image to pixel data")
		return
	}

	imageDataBytes := make([]byte, len(imageData))
	for idx, val := range imageData {
		imageDataBytes[idx] = byte(val)
	}
	hash := hashTemplateImage(imageDataBytes)

	if _, err := os.Stat("stencils"); os.IsNotExist(err) {
		err = os.Mkdir("stencils", os.ModePerm)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create stencils directory")
			return
		}
	}

	filename := fmt.Sprintf("stencils/stencils-%s.png", hash)
	newimg, err := os.Create(filename)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create image file")
		return
	}
	defer file.Close()

	err = png.Encode(newimg, img)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to encode image")
		return
	}

	routeutils.WriteResultJson(w, hash)
}

func addStencilData(w http.ResponseWriter, r *http.Request) {
	// Passed as byte array w/ color indexes instead of image
	// Map like {"width": "64", "height": "64", "image": byte array}
	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId, err := strconv.Atoi((*jsonBody)["worldId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid worldId")
		return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid width")
		return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid height")
		return
	}

	if width < 5 || width > 256 || height < 5 || height > 256 {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid image dimensions")
		return
	}

	imageData := (*jsonBody)["image"]
	// Split string by comma
	// TODO: Change to byte encoding
	imageSplit := strings.Split(imageData, ",")
	imageBytes := make([]byte, len(imageSplit))
	for idx, val := range imageSplit {
		valInt, err := strconv.Atoi(val)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid image data")
			return
		}
		imageBytes[idx] = byte(valInt)
	}

	if len(imageBytes) != width*height {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid image data")
		return
	}

	hash := hashTemplateImage(imageBytes)
	colorPaletteHex, err := core.PostgresQuery[string]("SELECT hex FROM WorldsColors WHERE world_id = $1 ORDER BY color_key", worldId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get color palette")
		return
	}
	colorPalette := make([]color.RGBA, len(colorPaletteHex))
	for idx, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create color palette")
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create color palette")
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create color palette")
			return
		}
		colorPalette[idx] = color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}
	}
	generatedImage := image.NewRGBA(image.Rect(0, 0, int(width), int(height)))
	for y := 0; y < int(height); y++ {
		for x := 0; x < int(width); x++ {
			pos := y*int(width) + x
			colorIdx := int(imageBytes[pos])
			if colorIdx < len(colorPalette) {
				generatedImage.Set(x, y, colorPalette[colorIdx])
			}
		}
	}

	if _, err := os.Stat("stencils"); os.IsNotExist(err) {
		err = os.Mkdir("stencils", os.ModePerm)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create stencils directory")
			return
		}
	}

	filename := fmt.Sprintf("stencils/stencil-%s.png", hash)
	file, err := os.Create(filename)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create image file")
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedImage)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to encode image")
		return
	}

	routeutils.WriteResultJson(w, hash)
}

func addStencilDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId, err := strconv.Atoi((*jsonBody)["worldId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	hash := (*jsonBody)["hash"]

	position, err := strconv.Atoi((*jsonBody)["position"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid position")
		return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid width")
		return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid height")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddStencilDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_stencil", strconv.Itoa(worldId), hash, strconv.Itoa(width), strconv.Itoa(height), strconv.Itoa(position))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to add stencil to devnet")
		return
	}

	routeutils.WriteResultJson(w, "Stencil added to devnet")
}

func removeStencilDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId, err := strconv.Atoi((*jsonBody)["worldId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	stencilId, err := strconv.Atoi((*jsonBody)["stencilId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid stencil ID")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.RemoveStencilDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "remove_stencil", strconv.Itoa(worldId), strconv.Itoa(stencilId))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to remove stencil from devnet")
		return
	}

	routeutils.WriteResultJson(w, "Stencil removed from devnet")
}

func favoriteStencilDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId, err := strconv.Atoi((*jsonBody)["worldId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	stencilId, err := strconv.Atoi((*jsonBody)["stencilId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid stencil ID")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.FavoriteStencilDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "favorite_stencil", strconv.Itoa(worldId), strconv.Itoa(stencilId))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to favorite stencil in devnet")
		return
	}

	routeutils.WriteResultJson(w, "Stencil favorited in devnet")
}

func unfavoriteStencilDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	worldId, err := strconv.Atoi((*jsonBody)["worldId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	stencilId, err := strconv.Atoi((*jsonBody)["stencilId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid stencil ID")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.UnfavoriteStencilDevnet
	contract := os.Getenv("CANVAS_FACTORY_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "unfavorite_stencil", strconv.Itoa(worldId), strconv.Itoa(stencilId))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to unfavorite stencil in devnet")
		return
	}

	routeutils.WriteResultJson(w, "Stencil unfavorited in devnet")
}

func getStencilPixelData(w http.ResponseWriter, r *http.Request) {
	// Get stencil hash from query params
	hash := r.URL.Query().Get("hash")
	if hash == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Hash parameter is required")
		return
	}

	// Read the stencil image file
	filename := fmt.Sprintf("stencils/stencil-%s.png", hash)
	fileBytes, err := os.ReadFile(filename)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusNotFound, "Stencil not found")
		return
	}

	// Convert image to pixel data
	pixelData, err := imageToPixelData(fileBytes, 1)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to process image")
		return
	}

	// Get image dimensions
	img, _, err := image.Decode(bytes.NewReader(fileBytes))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to decode image")
		return
	}
	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y

	// Create response structure
	response := struct {
		Width     int   `json:"width"`
		Height    int   `json:"height"`
		PixelData []int `json:"pixelData"`
	}{
		Width:     width,
		Height:    height,
		PixelData: pixelData,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create response")
		return
	}

	routeutils.WriteDataJson(w, string(jsonResponse))
}
