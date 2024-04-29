package routes

import (
	"context"
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

	"github.com/NethermindEth/juno/core/crypto"
	"github.com/NethermindEth/juno/core/felt"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitTemplateRoutes() {
	http.HandleFunc("/get-templates", getTemplates)
	http.HandleFunc("/add-template-img", addTemplateImg)
	http.HandleFunc("/add-template-data", addTemplateData)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/add-template-devnet", addTemplateDevnet)
	}
	http.Handle("/templates/", http.StripPrefix("/templates/", http.FileServer(http.Dir("."))))
}

// TODO: Add specific location for template images

func hashTemplateImage(pixelData []byte) string {
	var data []*felt.Felt
	for _, pixel := range pixelData {
		f := new(felt.Felt).SetUint64(uint64(pixel))
		data = append(data, f)
	}
	hash := crypto.PoseidonArray(data...)
	return hash.String()
}

func imageToPixelData(imageData []byte) []byte {
	// TODO: Convert image data to pixel data using approximation
	//       Output should be a byte array with color indexes
	return []byte{0, 1, 1, 2, 2, 3}
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
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to get templates")
		return
	}

	WriteDataJson(w, string(templates))
}

func addTemplateImg(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("image")
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Failed to read image")
		return
	}
	defer file.Close()

	// Decode the image to check dimensions
	img, _, err := image.Decode(file)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Failed to decode image")
		return
	}
	bounds := img.Bounds()
	width, height := bounds.Max.X-bounds.Min.X, bounds.Max.Y-bounds.Min.Y
	if width < 5 || width > 50 || height < 5 || height > 50 {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid image dimensions")
		return
	}

	// Read all data from the uploaded file and write it to the temporary file
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to read image data")
		return
	}

	r.Body.Close()

	imageData := imageToPixelData(fileBytes)
	hash := hashTemplateImage(imageData)
	templateId := 0
	err = core.ArtPeaceBackend.Databases.Postgres.QueryRow(context.Background(), "INSERT INTO TemplateData (hash, data) VALUES ($1, $2) RETURNING key", hash, imageData).Scan(&templateId)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert template data in postgres")
		return
	}
	// Set pixel in postgres
	name := ""
	position := 0
	reward := 0
	rewardToken := "RWRD"
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Templates (name, width, height, position, reward, reward_token, template_id) VALUES ($1, $2, $3, $4, $5, $6, $7)", name, width, height, position, reward, rewardToken, templateId)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert image data into postgres")
		return
	}

	WriteResultJson(w, hash)
}

func addTemplateData(w http.ResponseWriter, r *http.Request) {
	// Passed as byte array w/ color indexes instead of image
	// Map like {"width": "64", "height": "64", "image": byte array}
	jsonBody, err := ReadJsonBody[map[string]string](r)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid width")
		return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid height")
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
			WriteErrorJson(w, http.StatusBadRequest, "Invalid image data")
			return
		}
		imageBytes[idx] = byte(valInt)
	}

	hash := hashTemplateImage(imageBytes)
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO TemplateData (hash, data) VALUES ($1, $2)", hash, imageBytes)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to add template data in database")
		return
	}
	colorPaletteHex := core.ArtPeaceBackend.CanvasConfig.Colors
	colorPalette := make([]color.RGBA, len(colorPaletteHex))
	for idx, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Failed to create color palette")
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Failed to create color palette")
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			WriteErrorJson(w, http.StatusInternalServerError, "Failed to create color palette")
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

	// TODO: Path to store generated image
	filename := fmt.Sprintf("template-%s.png", hash)
	file, err := os.Create(filename)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to create image file")
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedImage)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to encode image")
		return
	}

	WriteResultJson(w, hash)
}

func addTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := ReadJsonBody[map[string]string](r)
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	hash := (*jsonBody)["hash"]

	// name to hex encoding using utf-8 bytes
	name := (*jsonBody)["name"]
	nameHex := fmt.Sprintf("0x%x", name)

	position, err := strconv.Atoi((*jsonBody)["position"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid position")
		return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid width")
		return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid height")
		return
	}

	// TODO: u256
	reward, err := strconv.Atoi((*jsonBody)["reward"])
	if err != nil {
		WriteErrorJson(w, http.StatusBadRequest, "Invalid reward")
		return
	}

	rewardToken := (*jsonBody)["rewardToken"]

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddTemplateDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_template", hash, nameHex, strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height), strconv.Itoa(reward), rewardToken)
	_, err = cmd.Output()
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to add template to devnet")
		return
	}

	WriteResultJson(w, "Template added to devnet")
}
