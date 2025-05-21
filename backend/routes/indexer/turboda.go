package indexer

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func enableTurboda(w http.ResponseWriter, r *http.Request) {
	os.Setenv("ENABLE_TURBODA", "true")
	routeutils.WriteResultJson(w, "Successfully enabled TurboDA")
}

func disableTurboda(w http.ResponseWriter, r *http.Request) {
	os.Setenv("ENABLE_TURBODA", "false")
	routeutils.WriteResultJson(w, "Successfully disabled TurboDA")
}

func submitToAvailTurboDA(message IndexerMessage) error {
	isEnabled := os.Getenv("ENABLE_TURBODA")
	if isEnabled != "true" {
		return nil
	}

	apiKey := os.Getenv("AVAIL_TURBO_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("AVAIL_TURBO_API_KEY environment variable not set")
	}

	// Convert message to JSON
	jsonData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %v", err)
	}

	// If data is larger than 1MB, compress it
	var dataToSend []byte
	var isCompressed bool
	if len(jsonData) > 1024*1024 { // 1MB in bytes
		var compressedData bytes.Buffer
		writer := gzip.NewWriter(&compressedData)
		if _, err := writer.Write(jsonData); err != nil {
			return fmt.Errorf("failed to compress data: %v", err)
		}
		if err := writer.Close(); err != nil {
			return fmt.Errorf("failed to close gzip writer: %v", err)
		}

		compressedBytes := compressedData.Bytes()
		fmt.Printf("Data compressed from %d bytes to %d bytes (ratio: %.2f%%)\n",
			len(jsonData),
			len(compressedBytes),
			float64(len(compressedBytes))/float64(len(jsonData))*100)

		dataToSend = compressedBytes
		isCompressed = true
	} else {
		dataToSend = jsonData
	}

	// Create HTTP request
	// req, err := http.NewRequest("POST", "https://staging.turbo-api.availproject.org/v1/submit_raw_data", bytes.NewBuffer(dataToSend))
	req, err := http.NewRequest("POST", "https://turbo-api.availproject.org/v1/submit_raw_data", bytes.NewBuffer(dataToSend))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("Content-Type", "application/octet-stream")
	if isCompressed {
		req.Header.Set("Content-Encoding", "gzip")
	}

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}

	// Check response
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse submission ID from response
	var response struct {
		SubmissionID string `json:"submission_id"`
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}

	fmt.Printf("Successfully submitted Events to Avail Turbo DA - Block %d, SubmissionID: %s, Size: %d bytes%s\n",
		message.Data.Cursor.OrderKey,
		response.SubmissionID,
		len(dataToSend),
		map[bool]string{true: " (compressed)", false: ""}[isCompressed])

	// Every 20 blocks, submit a snapshot of the canvas
	if message.Data.Cursor.OrderKey%20 == 0 {
		for canvasId := 13; canvasId <= 25; canvasId++ {
			err = submitCanvasSnapshot(canvasId, message.Data.Cursor.OrderKey)
			if err != nil {
				fmt.Printf("Failed to submit canvas snapshot for canvas %d - Block %d: %v\n", canvasId, message.Data.Cursor.OrderKey, err)
				continue
			}
		}
	}

	return nil
}

type CanvasSnapshot struct {
	CanvasID    int    `json:"canvas_id"`
	BlockNumber int    `json:"block_number"`
	Blob        []byte `json:"blob"`
}

func submitCanvasSnapshot(canvasId int, blockNumber int) error {
	canvasName := fmt.Sprintf("canvas-%d", canvasId)
	ctx := context.Background()
	canvasBlob, err := core.ArtPeaceBackend.Databases.Redis.Get(ctx, canvasName).Result()
	if err != nil {
		return fmt.Errorf("failed to get canvas data from Redis: %v", err)
	}
	if canvasBlob == "" {
		return fmt.Errorf("no data found for canvas %d", canvasId)
	}

	// Encode json data
	canvasSnapshot := CanvasSnapshot{
		CanvasID:    canvasId,
		BlockNumber: blockNumber,
		Blob:        []byte(canvasBlob),
	}
	canvasSnapshotJson, err := json.Marshal(canvasSnapshot)
	if err != nil {
		return fmt.Errorf("failed to marshal canvas snapshot: %v", err)
	}

	// Post the data as blob
	apiKey := os.Getenv("AVAIL_TURBO_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("AVAIL_TURBO_API_KEY environment variable not set")
	}

	// Compress the canvas
	var compressedCanvas bytes.Buffer
	writer := gzip.NewWriter(&compressedCanvas)
	if _, err := writer.Write(canvasSnapshotJson); err != nil {
		return fmt.Errorf("failed to compress canvas snapshot: %v", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("failed to close gzip writer: %v", err)
	}
	compressedCanvasBytes := compressedCanvas.Bytes()

	// TODO: Move urls to config file
	// url := "https://staging.turbo-api.availproject.org/v1/submit_raw_data"
	url := "https://turbo-api.availproject.org/v1/submit_raw_data"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(compressedCanvasBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}
	// Set headers
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("Content-Encoding", "gzip")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		SubmissionID string `json:"submission_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("request failed with status %d: %s", resp.StatusCode, response.SubmissionID)
	}
	fmt.Printf("Successfully submitted canvas snapshot for canvas %d - Block %d, SubmissionID: %s",
		canvasId,
		blockNumber,
		response.SubmissionID)
	return nil
}
