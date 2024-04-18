package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"io"
	"io/ioutil"
	"math"
	"net/http"
	"os"
	"os/exec"

	"github.com/NethermindEth/juno/core/crypto"
	"github.com/NethermindEth/juno/core/felt"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitTemplateRoutes() {
	http.HandleFunc("/addTemplateImg", addTemplateImg)
	http.HandleFunc("/addTemplateData", addTemplateData)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/addTemplateHashDevnet", addTemplateHashDevnet)
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

func imageToPixelData(imageData []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, err
	}

	palette := []color.Color{
		color.RGBA{0x00, 0x00, 0x00, 0xFF}, // Black
		color.RGBA{0xFF, 0xFF, 0xFF, 0xFF}, // White
		color.RGBA{0xFF, 0x00, 0x00, 0xFF}, // Red
		color.RGBA{0x00, 0xFF, 0x00, 0xFF}, // Green
		color.RGBA{0x00, 0x00, 0xFF, 0xFF}, // Blue
		color.RGBA{0xFF, 0xFF, 0x00, 0xFF}, // Yellow
		color.RGBA{0xFF, 0x00, 0xFF, 0xFF}, // Magenta
		color.RGBA{0x00, 0xFF, 0xFF, 0xFF}, // Cyan
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

func addTemplateImg(w http.ResponseWriter, r *http.Request) {
	// TODO: Limit file size / proportions between 5x5 and 64x64
	// Passed like this curl -F "image=@art-peace-low-res-goose.jpg" http://localhost:8080/addTemplateImg
	file, _, err := r.FormFile("image")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Create a temporary file to store the uploaded file
	// TODO: change location & determine valid file types
	tempFile, err := ioutil.TempFile("temp-images", "upload-*.png")
	if err != nil {
		panic(err)
	}
	defer tempFile.Close()

	// Read all data from the uploaded file and write it to the temporary file
	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}
	tempFile.Write(fileBytes)

	r.Body.Close()

	imageData, err := imageToPixelData(fileBytes)
	if err != nil {
		panic(err)
	}
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
	var jsonBody map[string]string
	err = json.Unmarshal(reqBody, &jsonBody)
	if err != nil {
		panic(err)
	}

	hash := hashTemplateImage([]byte(jsonBody["image"]))
	// TODO: Store image hash and pixel data in database

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte(hash))
}

func addTemplateHashDevnet(w http.ResponseWriter, r *http.Request) {
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

	// TODO: Create this script
	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.AddTemplateHashDevnet
	// TODO: remove contract from jsonBody
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")
	cmd := exec.Command(shellCmd, contract, "add_template", jsonBody["hash"])
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error executing shell command: ", err)
		panic(err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte("Hash added to devnet"))
}
