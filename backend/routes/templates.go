package routes

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"math"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitTemplateRoutes() {
	http.HandleFunc("/get-templates", getTemplates)
	http.HandleFunc("/get-faction-templates", getFactionTemplates)
	http.HandleFunc("/get-chain-faction-templates", getChainFactionTemplates)
	http.HandleFunc("/build-template-img", buildTemplateImg)
	http.HandleFunc("/add-template-img", addTemplateImg)
	http.HandleFunc("/add-template-data", addTemplateData)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		// http.HandleFunc("/add-template-devnet", addTemplateDevnet)
		http.HandleFunc("/add-faction-template-devnet", addFactionTemplateDevnet)
		http.HandleFunc("/remove-faction-template-devnet", removeFactionTemplateDevnet)
		http.HandleFunc("/add-chain-faction-template-devnet", addChainFactionTemplateDevnet)
		http.HandleFunc("/remove-chain-faction-template-devnet", removeChainFactionTemplateDevnet)
	}
	http.Handle("/templates/", http.StripPrefix("/templates/", http.FileServer(http.Dir("./templates/"))))
}

func hashTemplateImage(pixelData []byte) string {
	/*
		  TODO: Implement Poseidon hash
			"github.com/NethermindEth/juno/core/crypto"
			"github.com/NethermindEth/juno/core/felt"

			var data []*felt.Felt
			for _, pixel := range pixelData {
				f := new(felt.Felt).SetUint64(uint64(pixel))
				data = append(data, f)
			}
			hash := crypto.PoseidonArray(data...)
	*/
	h := sha256.New()
	h.Write(pixelData)
	hash := h.Sum(nil)
	hashStr := fmt.Sprintf("%x", hash)
	// Replace 1st byte with 00
	return "00" + hashStr[2:]
}

func hexToRGBA(colorBytes string) color.RGBA {
	// Hex like "rrggbb"
	r, err := strconv.ParseUint(colorBytes[0:2], 16, 8)
	if err != nil {
		return color.RGBA{}
	}
	g, err := strconv.ParseUint(colorBytes[2:4], 16, 8)
	if err != nil {
		return color.RGBA{}
	}
	b, err := strconv.ParseUint(colorBytes[4:6], 16, 8)
	if err != nil {
		return color.RGBA{}
	}
	return color.RGBA{uint8(r), uint8(g), uint8(b), 255}
}

func imageToPixelData(imageData []byte) ([]int, error) {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, err
	}

	colors, err := core.PostgresQuery[ColorType]("SELECT hex FROM colors ORDER BY key")
	if err != nil {
		return nil, err
	}

	colorCount := len(colors)
	palette := make([]color.Color, colorCount)
	for i := 0; i < colorCount; i++ {
		colorHex := colors[i]
		palette[i] = hexToRGBA(colorHex)
	}

	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y
	pixelData := make([]int, width*height)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			rgba := color.RGBAModel.Convert(img.At(x, y)).(color.RGBA)
			if rgba.A < 128 { // Consider pixels with less than 50% opacity as transparent
				pixelData[y*width+x] = 0xFF
			} else {
				closestIndex := findClosestColor(rgba, palette)
				pixelData[y*width+x] = closestIndex
			}
		}
	}

	return pixelData, nil
}

func findClosestColor(target color.RGBA, palette []color.Color) int {
	minDistance := math.MaxFloat64
	closestIndex := 0
	for i, c := range palette {
		r, g, b, _ := c.RGBA()
		distance := colorDistance(target, color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8), 255})
		if distance < minDistance {
			minDistance = distance
			closestIndex = i
		}
	}
	return closestIndex
}

func colorDistance(c1, c2 color.RGBA) float64 {
	r_diff := float64(int(c1.R) - int(c2.R))
	g_diff := float64(int(c1.G) - int(c2.G))
	b_diff := float64(int(c1.B) - int(c2.B))
	return math.Sqrt(r_diff*r_diff + g_diff*g_diff + b_diff*b_diff)
}

type TemplateData struct {
	Key         int    `json:"key"`
	Name        string `json:"name"`
	Hash        string `json:"hash"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Position    int    `json:"position"`
	Reward      int    `json:"reward"`
	RewardToken string `json:"rewardToken"`
}

func getTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := core.PostgresQueryJson[TemplateData]("SELECT * FROM templates")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get templates")
		return
	}

	routeutils.WriteDataJson(w, string(templates))
}

type FactionTemplateData struct {
	TemplateId int    `json:"templateId"`
	Hash       string `json:"hash"`
	Width      int    `json:"width"`
	Height     int    `json:"height"`
	Position   int    `json:"position"`
}

// TODO: Pagination
func getFactionTemplates(w http.ResponseWriter, r *http.Request) {
	factionId, err := strconv.Atoi(r.URL.Query().Get("factionId"))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	factionTemplates, err := core.PostgresQueryJson[FactionTemplateData]("SELECT template_id, hash, width, height, position FROM FactionTemplates WHERE faction_id = $1 AND stale = false", factionId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get faction templates")
		return
	}

	routeutils.WriteDataJson(w, string(factionTemplates))
}

func getChainFactionTemplates(w http.ResponseWriter, r *http.Request) {
	factionId, err := strconv.Atoi(r.URL.Query().Get("factionId"))
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid faction ID")
		return
	}

	factionTemplates, err := core.PostgresQueryJson[FactionTemplateData]("SELECT template_id, hash, width, height, position FROM ChainFactionTemplates WHERE faction_id = $1 AND stale = false", factionId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get chain faction templates")
		return
	}

	routeutils.WriteDataJson(w, string(factionTemplates))
}

// curl -F "image=@<path to image>" http://localhost:8080/build-template-img?start=0
func buildTemplateImg(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("image")
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read image")
		return
	}
	defer file.Close()

	startStr := r.URL.Query().Get("start")
	start, err := strconv.Atoi(startStr)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid start position")
		return
	}

	// Decode the image to check dimensions
	img, _, err := image.Decode(file)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to decode image")
		return
	}
	bounds := img.Bounds()
	width, _ := bounds.Max.X-bounds.Min.X, bounds.Max.Y-bounds.Min.Y
	file.Seek(0, 0)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to read image data")

		return
	}

	imageData, err := imageToPixelData(fileBytes)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert image to pixel data")
		return
	}

	imageDataBytes := make([]byte, len(imageData))
	for idx, val := range imageData {
		imageDataBytes[idx] = byte(val)
	}
	hash := hashTemplateImage(imageDataBytes)

	// Make file to store template data
	if _, err := os.Stat("templates-build"); os.IsNotExist(err) {
		err = os.Mkdir("templates-build", os.ModePerm)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create templates directory")
			return
		}
	}

	filename := fmt.Sprintf("templates-build/template-%s.txt", hash)
	newtemp, err := os.Create(filename)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create image file")
		return
	}
	defer file.Close()

	// TODO: Hardcoded width
	x := start % 1024
	y := start / 1024
	start_x := x
	end_x := x + width
	// Write image data to file
	for _, pixel := range imageData {
		pos := y*1024 + x
		// Convert byte to integer representation
		if pixel != 0xFF {
			_, err := newtemp.WriteString(fmt.Sprintf("%d %d\n", pos, int(pixel)))
			if err != nil {
				routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to write image data")
				return
			}
		}
		x++
		if x >= end_x {
			x = start_x
			y++
		}
	}
}

func addTemplateImg(w http.ResponseWriter, r *http.Request) {
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
	if width < 5 || width > 64 || height < 5 || height > 64 {
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

	imageData, err := imageToPixelData(fileBytes)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert image to pixel data")
		return
	}

	imageDataBytes := make([]byte, len(imageData))
	for idx, val := range imageData {
		imageDataBytes[idx] = byte(val)
	}
	hash := hashTemplateImage(imageDataBytes)

	if _, err := os.Stat("templates"); os.IsNotExist(err) {
		err = os.Mkdir("templates", os.ModePerm)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create templates directory")
			return
		}
	}

	filename := fmt.Sprintf("templates/template-%s.png", hash)
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

func addTemplateData(w http.ResponseWriter, r *http.Request) {
	// Passed as byte array w/ color indexes instead of image
	// Map like {"width": "64", "height": "64", "image": byte array}
	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
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

	if width < 5 || width > 64 || height < 5 || height > 64 {
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
	colorPaletteHex, err := core.PostgresQuery[string]("SELECT hex FROM colors ORDER BY color_key")
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

	if _, err := os.Stat("templates"); os.IsNotExist(err) {
		err = os.Mkdir("templates", os.ModePerm)
		if err != nil {
			routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create templates directory")
			return
		}
	}

	filename := fmt.Sprintf("templates/template-%s.png", hash)
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

func addTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	hash := (*jsonBody)["hash"]

	// name to hex encoding using utf-8 bytes
	name := (*jsonBody)["name"]
	nameHex := fmt.Sprintf("0x%x", name)

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

	// TODO: u256
	reward, err := strconv.Atoi((*jsonBody)["reward"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid reward")
		return
	}

	rewardToken := (*jsonBody)["rewardToken"]

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddTemplateDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_template", hash, nameHex, strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height), strconv.Itoa(reward), rewardToken)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to add template to devnet")
		return
	}

	routeutils.WriteResultJson(w, "Template added to devnet")
}

func addFactionTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	factionId, err := strconv.Atoi((*jsonBody)["factionId"])
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

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddFactionTemplateDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_faction_template", strconv.Itoa(factionId), hash, strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to add faction template to devnet")
		return
	}

	routeutils.WriteResultJson(w, "Faction template added to devnet")
}

func removeFactionTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	templateId, err := strconv.Atoi((*jsonBody)["templateId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid template ID")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.RemoveFactionTemplateDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "remove_faction_template", strconv.Itoa(templateId))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to remove faction template from devnet")
		return
	}

	routeutils.WriteResultJson(w, "Faction template removed from devnet")
}

func addChainFactionTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	factionId, err := strconv.Atoi((*jsonBody)["factionId"])
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

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddFactionTemplateDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_chain_faction_template", strconv.Itoa(factionId), hash, strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to add chain faction template to devnet")
		return
	}

	routeutils.WriteResultJson(w, "Chain faction template added to devnet")
}

func removeChainFactionTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	templateId, err := strconv.Atoi((*jsonBody)["templateId"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid template ID")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.RemoveFactionTemplateDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "remove_chain_faction_template", strconv.Itoa(templateId))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to remove chain faction template from devnet")
		return
	}

	routeutils.WriteResultJson(w, "Chain faction template removed from devnet")
}
