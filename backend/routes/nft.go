package routes

import (
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func InitNFTRoutes() {
	http.HandleFunc("/get-nft", getNFT)
	http.HandleFunc("/get-nfts", getNFTs)
	http.HandleFunc("/get-my-nfts", getMyNFTs)
  if !core.ArtPeaceBackend.BackendConfig.Production {
	  http.HandleFunc("/mint-nft-devnet", mintNFTDevnet)
  }
	// Create a static file server for the nft images
	http.Handle("/nft-images/", http.StripPrefix("/nft-images/", http.FileServer(http.Dir("."))))
}

type NFTData struct {
	TokenID     int    `json:"tokenId"`
	Position    int    `json:"position"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	ImageHash   string `json:"imageHash"`
	BlockNumber int    `json:"blockNumber"`
	Minter      string `json:"minter"`
}

func getNFT(w http.ResponseWriter, r *http.Request) {
	tokenId := r.URL.Query().Get("tokenId")

  nft, err := core.PostgresQueryOneJson[NFTData]("SELECT * FROM nfts WHERE token_id = $1", tokenId)
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFT")
    return
  }
  
  WriteDataJson(w, string(nft))
}

func getMyNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")

  nfts, err := core.PostgresQueryJson[NFTData]("SELECT * FROM nfts WHERE minter = $1", address)
	if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
  WriteDataJson(w, string(nfts))
}

func getNFTs(w http.ResponseWriter, r *http.Request) {
	// TODO: Pagination & Likes
  nfts, err := core.PostgresQueryJson[NFTData]("SELECT * FROM nfts")
  if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
    return
  }

  WriteDataJson(w, string(nfts))
}

func mintNFTDevnet(w http.ResponseWriter, r *http.Request) {
  // Disable this in production
  if NonProductionMiddleware(w, r) {
    return
  }

  // TODO: map[string]int instead of map[string]string
  jsonBody, err := ReadJsonBody[map[string]string](r)
  if err != nil {
    WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
    return
  }

	position, err := strconv.Atoi((*jsonBody)["position"])
	if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert position to int")
    return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert width to int")
    return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert height to int")
    return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.MintNFTDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "mint_nft", strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height))
	_, err = cmd.Output()
	if err != nil {
    WriteErrorJson(w, http.StatusInternalServerError, "Failed to mint NFT on devnet")
    return
	}

  WriteResultJson(w, "NFT minted on devnet")
}
