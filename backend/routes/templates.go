package routes

import (
	"bytes"
	"context"
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

func bytesToRGBA(colorBytes []byte) color.RGBA {
	r := colorBytes[0]
	g := colorBytes[1]
	b := colorBytes[2]
	return color.RGBA{r, g, b, 0xFF}
}

func imageToPixelData(imageData []byte, colorsData []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, err
	}

	colorCount := len(colorsData) / 3
	palette := make([]color.Color, colorCount)
	for i := 0; i < colorCount; i++ {
		palette[i] = bytesToRGBA(colorsData[i*3 : i*3+3])
	}

	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y
	pixelData := make([]byte, width*height)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			rgba := color.RGBAModel.Convert(img.At(x, y)).(color.RGBA)
			if rgba.A < 128 { // Consider pixels with less than 50% opacity as transparent
				pixelData[y*width+x] = 0xFF
			} else {
				closestIndex := findClosestColor(rgba, palette)
				pixelData[y*width+x] = byte(closestIndex)
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
	return math.Sqrt(float64((c1.R-c2.R)*(c1.R-c2.R) + (c1.G-c2.G)*(c1.G-c2.G) + (c1.B-c2.B)*(c1.B-c2.B)))
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

	// Seek the file pointer back to the beginning of the file
	file.Seek(0, 0)

	// Read all data from the uploaded file and write it to the temporary file
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to read image data")
		return
	}

	r.Body.Close()

	colors, err := core.PostgresQueryJson[ColorType]("SELECT hex FROM colors ORDER BY key")
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve colors")
		return
	}

	imageData, err := imageToPixelData(fileBytes, colors)
	if err != nil {
		panic(err)
	}
	hash := hashTemplateImage(imageData)
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO TemplateData (hash, data) VALUES ($1, $2)", hash, imageData)
	if err != nil {
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert template data in postgres")
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
		WriteErrorJson(w, http.StatusInternalServerError, "Failed to insert template data in database")
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
		WriteErrorJson(w, http.StatusMethodNotAllowed, "Method only allowed in non-production mode")
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
