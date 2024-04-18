package routes

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/png"
	"io"
	"io/ioutil"
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

func imageToPixelData(imageData []byte) []byte {
	// TODO: Convert image data to pixel data using approximation
	//       Output should be a byte array with color indexes
	return []byte{0, 1, 1, 2, 2, 3}
}

func addTemplateImg(w http.ResponseWriter, r *http.Request) {
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
	tempFile.Write(fileBytes)

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
