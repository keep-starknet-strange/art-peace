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

type World struct {
  WorldId int
  Width int
  Height int
  palette []string
  offsetX int
  offsetY int
}

var GlobalWorldsImage *image.RGBA
var GlobalWorldsConfig []World

func InitGlobalWorldsConfig(initFrom string) {
  xGap := 16
  yGap := 12
  baseWorldWidth := 528
  baseWorldHeight := 396
  subWorldWidth := 256
  subWorldHeight := 192
  baseWorldX := subWorldWidth + xGap
  baseWorldY := subWorldHeight + yGap
  globalWorldsConfig := []World{
    World{WorldId: 13, Width: baseWorldWidth, Height: baseWorldHeight,
          offsetX: baseWorldX, offsetY: baseWorldY,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "895129"}},
    World{WorldId: 14, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: 0,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "0f0966", "f3776c", "999999", "7377fa", "a534ed", "895129" }},
    World{WorldId: 15, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: subWorldWidth + xGap, offsetY: 0,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ff9132", "ed7d2b", "e8472d", "131521", "4c5b7e", "895129" }},
    World{WorldId: 16, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 2 * (subWorldWidth + xGap), offsetY: 0,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ff93ba", "34ff35", "dbb690", "f6c297", "895129" }},
    World{WorldId: 17, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: 0,
          palette: []string{"f79626", "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "f2e282", "ab8100", "bdaa70", "d3c5aa", "bd9b30", "895129" }},
    World{WorldId: 18, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: subWorldHeight + yGap,
          palette: []string{"0a0a0a", "fafafa", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "895129" }},
    World{WorldId: 19, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: subWorldHeight + yGap,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "9fe7c7", "e3806f", "4451ad", "000d64", "67f81e", "895129" }},
    World{WorldId: 20, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: 2 * (subWorldHeight + yGap),
          palette: []string{"6882ec", "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "869bee", "c2cdf8", "bba53d", "895129" }},
    World{WorldId: 21, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: 2 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "f79626", "f2e282", "ab8100", "bdaa70", "d3c5aa", "bd9b30", "895129" }},
    World{WorldId: 22, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "ec5731", "895129" }},
    World{WorldId: 23, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: subWorldWidth + xGap, offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "63d86d", "e78600", "afe9f5", "28fff8", "939598", "895129" }},
    World{WorldId: 24, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 2 * (subWorldWidth + xGap), offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "fe96b8", "f03846", "fbe1bc", "03ff3d", "895129" }},
    World{WorldId: 25, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "f79626", "6882ec", "895129" }},
  }
  GlobalWorldsConfig = globalWorldsConfig

  if initFrom == "" {
    // Initialize the global image
    canvasWidth := 4 * subWorldWidth + 3 * xGap
    canvasHeight := 4 * subWorldHeight + 3 * yGap
    GlobalWorldsImage = image.NewRGBA(image.Rect(0, 0, canvasWidth, canvasHeight))
    // Color the entire image grey (rgb(171,171,171))
    for y := 0; y < canvasHeight; y++ {
      for x := 0; x < canvasWidth; x++ {
        GlobalWorldsImage.Set(x, y, color.RGBA{171, 171, 171, 255})
      }
    }
  
    // Color the base worlds
    for _, world := range GlobalWorldsConfig {
      for y := 0; y < world.Height; y++ {
        for x := 0; x < world.Width; x++ {
          pos := y * world.Width + x
          ColorWorldImage(world.WorldId, pos, 0)
        }
      }
    }
  } else {
    // Initialize the global image from the given image file
    imgFile, err := os.Open(initFrom)
    if err != nil {
      fmt.Println("Failed to open image file: ", err)
      return
    }
    defer imgFile.Close()

    img, err := png.Decode(imgFile)
    if err != nil {
      fmt.Println("Failed to decode image file: ", err)
      return
    }
    bounds := img.Bounds()
    GlobalWorldsImage = image.NewRGBA(bounds)
    for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
      for x := bounds.Min.X; x < bounds.Max.X; x++ {
        GlobalWorldsImage.Set(x, y, img.At(x, y))
      }
    }
    fmt.Println("Initialized global image from file: ", initFrom)
  }
}

const worldOffset = 13
func ColorWorldImage(worldId int, pos int, colorIdx int) {
  // fmt.Println("Coloring worldId: ", worldId, " pos: ", pos, " colorIdx: ", colorIdx)
  world := GlobalWorldsConfig[worldId - worldOffset]
  colorHex := world.palette[colorIdx]
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
  color := color.RGBA{uint8(r), uint8(g), uint8(b), 255}
  xOff := world.offsetX
  yOff := world.offsetY
  x := pos % world.Width
  y := pos / world.Width
  GlobalWorldsImage.Set(x + xOff, y + yOff, color)
}

func GenerateImageFromWorlds(orderId int) {
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

  if err := png.Encode(f, GlobalWorldsImage); err != nil {
    fmt.Println("Failed to encode image. Error: ", err)
    return
  }
  fmt.Println("Generated image for orderId: ", orderId)
}

func GenerateImageFromWorlds2(orderId int) {
	ctx := context.Background()

  xGap := 16
  yGap := 12
  baseWorldWidth := 528
  baseWorldHeight := 396
  subWorldWidth := 256
  subWorldHeight := 192
  baseWorldX := subWorldWidth + xGap
  baseWorldY := subWorldHeight + yGap
  worlds := []World{
    World{WorldId: 0, Width: baseWorldWidth, Height: baseWorldHeight,
          offsetX: baseWorldX, offsetY: baseWorldY,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6"}},
    World{WorldId: 1, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: 0,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "0f0966", "f3776c", "999999", "7377fa", "a534ed"}},
    World{WorldId: 2, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: subWorldWidth + xGap, offsetY: 0,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ff9132", "ed7d2b", "e8472d", "131521", "4c5b7e"}},
    World{WorldId: 3, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 2 * (subWorldWidth + xGap), offsetY: 0,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ff93ba", "34ff35", "dbb690", "f6c297"}},
    World{WorldId: 4, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: 0,
          palette: []string{"a13dff", "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "660066", "800080", "be29ec", "d896ff", "efbbff"}},
    World{WorldId: 5, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: subWorldHeight + yGap,
          palette: []string{"0a0a0a", "fafafa", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6"}},
    World{WorldId: 6, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: subWorldHeight + yGap,
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "9fe7c7", "e3806f", "4451ad", "000d64", "67f81e"}},
    World{WorldId: 7, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: 2 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "67f81e", "141456", "ed7d6f", "f79626", "f2e282"}},
    World{WorldId: 8, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: 2 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "f79626", "f2e282", "3742f4", "ffdc67", "adadad"}},
    World{WorldId: 9, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 0, offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "ec5731"}},
    World{WorldId: 10, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: subWorldWidth + xGap, offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "63d86d", "e78600", "afe9f5", "28fff8", "939598"}},
    World{WorldId: 11, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 2 * (subWorldWidth + xGap), offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f", "fe96b8", "f03846", "fbe1bc", "03ff3d"}},
    World{WorldId: 12, Width: subWorldWidth, Height: subWorldHeight,
          offsetX: 3 * (subWorldWidth + xGap), offsetY: 3 * (subWorldHeight + yGap),
          palette: []string{"fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6f"}},
  }
	colorWidth := core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth

	// TODO: Make generic & initialize only once
	colorPalettes := make([][]color.RGBA, len(worlds))
	for _, world := range worlds {
    colorPalette := make([]color.RGBA, 0)
    for _, colorHex := range world.palette {
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
    colorPalettes[world.WorldId - worldOffset] = colorPalette
	}
  canvasWidth := 4 * subWorldWidth + 3 * xGap
  canvasHeight := 4 * subWorldHeight + 3 * yGap
	generatedImage := image.NewRGBA(image.Rect(0, 0, canvasWidth, canvasHeight))
  // Color the entire image grey (rgb(171,171,171))
  for y := 0; y < canvasHeight; y++ {
    for x := 0; x < canvasWidth; x++ {
      generatedImage.Set(x, y, color.RGBA{171, 171, 171, 255})
    }
  }

	bitfieldType := "u" + strconv.Itoa(int(core.ArtPeaceBackend.CanvasConfig.ColorsBitWidth))
  for _, world := range worlds {
    worldId := world.WorldId
    canvasKey := fmt.Sprintf("canvas-%d", worldId)
    for y := 0; y < world.Height; y++ {
      for x := 0; x < world.Width; x++ {
        position := y*world.Width + x
        pos := position * int(colorWidth)
        val, err := core.ArtPeaceBackend.Databases.Redis.BitField(ctx, canvasKey, "GET", bitfieldType, pos).Result()
        if err != nil {
          fmt.Println("Failed to get bitfield value. Error: ", err)
          return
        }
        color := colorPalettes[worldId - worldOffset][val[0]]
        generatedImage.Set(x + world.offsetX, y + world.offsetY, color)
      }
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
