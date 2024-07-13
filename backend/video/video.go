package video

import (
	"context"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func GenerateImageFromCanvas(orderId int) {
	ctx := context.Background()

	colorWidth := core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth
	canvasWidth := int(core.ArtPeaceBackend.CanvasConfig.Canvas.Width)
	canvasHeight := int(core.ArtPeaceBackend.CanvasConfig.Canvas.Height)

	// TODO: Make generic & initialize only once
	colorPalette := make([]color.RGBA, 0)
	colorPaletteHex := []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ea1608", "1991f4", "3c3c84", "ff5c5d", "fde578", "74401b", "f86949", "46b093", "d4d7d9"}
	for _, colorHex := range colorPaletteHex {
		r, err := strconv.ParseInt(colorHex[0:2], 16, 64)
		if err != nil {
			fmt.Println("Failed to parse hex color: ", colorHex, " Error: ", err)
			return
		}
		g, err := strconv.ParseInt(colorHex[2:4], 16, 64)
		if err != nil {
			fmt.Println("Failed to parse hex color: ", colorHex, " Error: ", err)
			return
		}
		b, err := strconv.ParseInt(colorHex[4:6], 16, 64)
		if err != nil {
			fmt.Println("Failed to parse hex color: ", colorHex, " Error: ", err)
			return
		}
		colorPalette = append(colorPalette, color.RGBA{uint8(r), uint8(g), uint8(b), 255})
	}
	generatedImage := image.NewRGBA(image.Rect(0, 0, canvasWidth, canvasHeight))
	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
	for y := 0; y < canvasHeight; y++ {
		for x := 0; x < canvasWidth; x++ {
			position := y*canvasWidth + x
			pos := position * int(colorWidth)
			val, err := core.ArtPeaceBackend.Databases.Redis.BitField(ctx, "canvas", "GET", bitfieldType, pos).Result()
			if err != nil {
				fmt.Println("Failed to get bitfield value. Error: ", err)
				return
			}
			color := colorPalette[val[0]]
			generatedImage.Set(x, y, color)
		}
	}

	if _, err := os.Stat("images"); os.IsNotExist(err) {
		err := os.Mkdir("images", os.ModePerm)
		if err != nil {
			fmt.Println("Failed to create images directory. Error: ", err)
			return
		}
	}

	fileName := fmt.Sprintf("images/%d.png", orderId)
	f, err := os.Create(fileName)
	if err != nil {
		fmt.Println("Failed to create image file. Error: ", err)
		return
	}
	defer f.Close()

	if err := png.Encode(f, generatedImage); err != nil {
		fmt.Println("Failed to encode image. Error: ", err)
		return
	}
	fmt.Println("Generated image for orderId: ", orderId)
}
