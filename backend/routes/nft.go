package routes

import (
	"context"
	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
	"net/http"
	"os"
	"os/exec"
	"strconv"
)

func InitNFTRoutes() {
	http.HandleFunc("/get-nft", getNFT)
	http.HandleFunc("/get-nfts", getNFTs)
	http.HandleFunc("/get-my-nfts", getMyNFTs)
	http.HandleFunc("/get-nft-likes", getNftLikeCount)
	http.HandleFunc("/like-nft", LikeNFT)
	http.HandleFunc("/unlike-nft", UnLikeNFT)
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
	Owner       string `json:"owner"`
}

type NFTLikesRequest struct {
	NFTKey      int    `json:"nftkey"`
	UserAddress string `json:"useraddress"`
}

func getNFT(w http.ResponseWriter, r *http.Request) {
	tokenId := r.URL.Query().Get("tokenId")

	nft, err := core.PostgresQueryOneJson[NFTData]("SELECT * FROM nfts WHERE token_id = $1", tokenId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFT")
		return
	}

	routeutils.WriteDataJson(w, string(nft))
}

func getMyNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `SELECT * FROM nfts WHERE owner = $1 LIMIT $2 OFFSET $3`
	nfts, err := core.PostgresQueryJson[NFTData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func getNFTs(w http.ResponseWriter, r *http.Request) {
	pageLength, err := strconv.Atoi(r.URL.Query().Get("pageLength"))
	if err != nil || pageLength <= 0 {
		pageLength = 25
	}
	if pageLength > 50 {
		pageLength = 50
	}
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageLength

	query := `SELECT * FROM nfts LIMIT $1 OFFSET $2`
	nfts, err := core.PostgresQueryJson[NFTData](query, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func mintNFTDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method only allowed in non-production mode")
		return
	}

	// TODO: map[string]int instead of map[string]string
	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	position, err := strconv.Atoi((*jsonBody)["position"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert position to int")
		return
	}

	width, err := strconv.Atoi((*jsonBody)["width"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert width to int")
		return
	}

	height, err := strconv.Atoi((*jsonBody)["height"])
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to convert height to int")
		return
	}

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.MintNFTDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "mint_nft", strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height))
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to mint NFT on devnet")
		return
	}

	routeutils.WriteResultJson(w, "NFT minted on devnet")
}

func LikeNFT(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	nftlikeReq, err := routeutils.ReadJsonBody[NFTLikesRequest](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	// TODO:  ensure that the nft exists
	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTLikes (nftKey, liker) VALUES ($1, $2)", nftlikeReq.NFTKey, nftlikeReq.UserAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "NFT already liked by user")
		return
	}

	routeutils.WriteResultJson(w, "NFT liked successfully")
}

func UnLikeNFT(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	nftlikeReq, err := routeutils.ReadJsonBody[NFTLikesRequest](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM nftlikes WHERE nftKey = $1 AND liker = $2", nftlikeReq.NFTKey, nftlikeReq.UserAddress)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to unlike NFT")
		return
	}

	routeutils.WriteResultJson(w, "NFT unliked successfully")
}

func getNftLikeCount(w http.ResponseWriter, r *http.Request) {
	nftkey := r.URL.Query().Get("nft_key")
	if nftkey == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "NFT key not provided")
		return
	}

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM nftlikes WHERE nftKey = $1", nftkey)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve like count")
		return
	}

	routeutils.WriteDataJson(w, strconv.Itoa(*count))
}
