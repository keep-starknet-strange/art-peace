package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"io/ioutil"
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
	http.HandleFunc("/addTemplateImg", addTemplateImg)
	http.HandleFunc("/add-template-data", addTemplateData)
	http.Handle("/templates/", http.StripPrefix("/templates/", http.FileServer(http.Dir("."))))
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/add-template-devnet", addTemplateDevnet)
	}
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
	var templates []TemplateData
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM templates")
	if err != nil {
		fmt.Println("Error querying templates: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var template TemplateData
		err := rows.Scan(&template.Key, &template.Name, &template.Hash, &template.Width, &template.Height, &template.Position, &template.Reward, &template.RewardToken)
		if err != nil {
			fmt.Println("Error scanning template: ", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		templates = append(templates, template)
	}

	out, err := json.Marshal(templates)
	if err != nil {
		fmt.Println("Error marshalling templates: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write(out)
}

func addTemplateImg(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("image")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Create a temporary file to store the uploaded file
	// TODO: change location & determine valid file types
	// tempFile, err := ioutil.TempFile("temp-images", "upload-*.png")
	// if err != nil {
	// 	panic(err)
	// }
	// defer tempFile.Close()

	// Decode the image to check dimensions
	img, format, err := image.Decode(file)
	if err != nil {
		http.Error(w, "Failed to decode the image: "+err.Error()+" - format: "+format, http.StatusBadRequest)
		return
	}
	bounds := img.Bounds()
	width, height := bounds.Max.X-bounds.Min.X, bounds.Max.Y-bounds.Min.Y
	if width < 5 || width > 50 || height < 5 || height > 50 {
		http.Error(w, fmt.Sprintf("Image dimensions out of allowed range (5x5 to 50x50). Uploaded image size: %dx%d", width, height), http.StatusBadRequest)
		return
	}

	// Read all data from the uploaded file and write it to the temporary file
	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}
	// tempFile.Write(fileBytes)

	r.Body.Close()

	imageData := imageToPixelData(fileBytes)
	hash := hashTemplateImage(imageData)
	// TODO: Store image hash and pixel data in postgres database

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(hash))
}

func addTemplateData(w http.ResponseWriter, r *http.Request) {
	// Passed as byte array w/ color indexes instead of image
	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	// Map like {"width": "64", "height": "64", "image": byte array}
	var jsonBody map[string]string
	err = json.Unmarshal(reqBody, &jsonBody)
	if err != nil {
		panic(err)
	}

	width, err := strconv.Atoi(jsonBody["width"])
	if err != nil {
		panic(err)
	}

	height, err := strconv.Atoi(jsonBody["height"])
	if err != nil {
		panic(err)
	}

	imageData := jsonBody["image"]
	// Split string by comma
	imageSplit := strings.Split(imageData, ",")
	imageBytes := make([]byte, len(imageSplit))
	for idx, val := range imageSplit {
		valInt, err := strconv.Atoi(val)
		if err != nil {
			panic(err)
		}
		imageBytes[idx] = byte(valInt)
	}

	hash := hashTemplateImage(imageBytes)
	// TODO: Store image hash and pixel data in database

	colorPaletteHex := core.ArtPeaceBackend.CanvasConfig.Colors
	colorPalette := make([]color.RGBA, len(colorPaletteHex))
	for idx, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			fmt.Println("Error converting red hex to int: ", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			fmt.Println("Error converting green hex to int: ", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			fmt.Println("Error converting blue hex to int: ", err)
			w.WriteHeader(http.StatusInternalServerError)
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
		fmt.Println("Error creating file: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer file.Close()

	err = png.Encode(file, generatedImage)
	if err != nil {
		fmt.Println("Error encoding image: ", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(hash))
}

func addTemplateDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if core.ArtPeaceBackend.BackendConfig.Production {
		http.Error(w, "Not available in production", http.StatusNotImplemented)
		return
	}

	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	var jsonBody map[string]string
	err = json.Unmarshal(reqBody, &jsonBody)
	if err != nil {
		panic(err)
	}

	hash := jsonBody["hash"]

	// name to hex encoding using utf-8 bytes
	name := jsonBody["name"]
	nameHex := fmt.Sprintf("0x%x", name)

	position, err := strconv.Atoi(jsonBody["position"])
	if err != nil {
		panic(err)
	}

	width, err := strconv.Atoi(jsonBody["width"])
	if err != nil {
		panic(err)
	}

	height, err := strconv.Atoi(jsonBody["height"])
	if err != nil {
		panic(err)
	}

	// TODO: u256
	reward, err := strconv.Atoi(jsonBody["reward"])
	if err != nil {
		panic(err)
	}

	rewardToken := jsonBody["rewardToken"]

	// TODO: Create this script
	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddTemplateDevnet
	// TODO: remove contract from jsonBody
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_template", hash, nameHex, strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height), strconv.Itoa(reward), rewardToken)
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error executing shell command: ", err)
		panic(err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte("Template added to devnet"))
}
