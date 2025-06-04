package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

func InitNFTRoutes() {
	http.HandleFunc("/get-canvas-nft-address", getCanvasNFTAddress)
	http.HandleFunc("/set-canvas-nft-address", setCanvasNFTAddress)
	http.HandleFunc("/get-nft", getNFT)
	http.HandleFunc("/get-nfts", getNFTs)
	http.HandleFunc("/get-new-nfts", getNewNFTs)
	http.HandleFunc("/get-my-nfts", getMyNFTs)
	http.HandleFunc("/get-nft-likes", getNftLikeCount)
	http.HandleFunc("/get-nft-pixel-data", getNftPixelData)
	// http.HandleFunc("/like-nft", LikeNFT)
	// http.HandleFunc("/unlike-nft", UnLikeNFT)
	http.HandleFunc("/get-liked-nfts", getLikedNFTs)
	http.HandleFunc("/get-top-nfts", getTopNFTs)
	http.HandleFunc("/get-hot-nfts", getHotNFTs)
	if !core.ArtPeaceBackend.BackendConfig.Production {
		http.HandleFunc("/mint-nft-devnet", mintNFTDevnet)
		http.HandleFunc("/like-nft-devnet", likeNFTDevnet)
		http.HandleFunc("/unlike-nft-devnet", unlikeNFTDevnet)
	}
	// Create a static file server for the nft images
	// TODO: Versioning here?
}

func InitNFTStaticRoutes() {
	http.Handle("/nft/", http.StripPrefix("/nft/", http.FileServer(http.Dir("./nfts"))))
}

func getCanvasNFTAddress(w http.ResponseWriter, r *http.Request) {
	contractAddress := os.Getenv("CANVAS_NFT_CONTRACT_ADDRESS")
	routeutils.WriteDataJson(w, "\""+contractAddress+"\"")
}

func setCanvasNFTAddress(w http.ResponseWriter, r *http.Request) {
	// Only allow admin to set contract address
	if routeutils.AdminMiddleware(w, r) {
		return
	}

	data, err := io.ReadAll(r.Body)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}
	os.Setenv("CANVAS_NFT_CONTRACT_ADDRESS", string(data))
	routeutils.WriteResultJson(w, "Contract address set")
}

type NFTData struct {
	TokenID     int    `json:"tokenId"`
	Position    int    `json:"position"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Name        string `json:"name"`
	ImageHash   string `json:"imageHash"`
	BlockNumber int    `json:"blockNumber"`
	DayIndex    int    `json:"dayIndex"`
	Minter      string `json:"minter"`
	Owner       string `json:"owner"`
	Likes       int    `json:"likes"`
	Liked       bool   `json:"liked"`
}

type NFTLikesRequest struct {
	NFTKey      int    `json:"nftkey"`
	UserAddress string `json:"useraddress"`
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

	query := `
        SELECT 
            nfts.*, 
            COALESCE(like_count, 0) AS likes,
            COALESCE((SELECT true FROM nftlikes WHERE liker = $1 AND nftlikes.nftkey = nfts.token_id), false) as liked
        FROM 
            nfts
        LEFT JOIN (
            SELECT 
                nftKey, 
                COUNT(*) AS like_count
            FROM 
                nftlikes
            GROUP BY 
                nftKey
        ) nftlikes ON nfts.token_id = nftlikes.nftKey
        WHERE 
            nfts.owner = $1
        ORDER BY nfts.token_id DESC
        LIMIT $2 OFFSET $3`
	nfts, err := core.PostgresQueryJson[NFTData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func getNFT(w http.ResponseWriter, r *http.Request) {
	tokenId := r.URL.Query().Get("tokenId")

	// TODO: Get like info
	nft, err := core.PostgresQueryOneJson[NFTData]("SELECT * FROM nfts WHERE token_id = $1", tokenId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFT")
		return
	}

	routeutils.WriteDataJson(w, string(nft))
}

func getNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
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

	query := `
        SELECT 
            nfts.*, 
            COALESCE(like_count, 0) AS likes,
            COALESCE((SELECT true FROM nftlikes WHERE liker = $1 AND nftlikes.nftkey = nfts.token_id), false) as liked
        FROM 
            nfts
        LEFT JOIN (
            SELECT 
                nftKey, 
                COUNT(*) AS like_count
            FROM 
                nftlikes
            GROUP BY 
                nftKey
        ) nftlikes ON nfts.token_id = nftlikes.nftKey
        ORDER BY nfts.token_id DESC
        LIMIT $2 OFFSET $3`
	nfts, err := core.PostgresQueryJson[NFTData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func getNewNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
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

	query := `
        SELECT 
            nfts.*, 
            COALESCE(like_count, 0) AS likes,
            COALESCE((SELECT true FROM nftlikes WHERE liker = $1 AND nftlikes.nftkey = nfts.token_id), false) as liked
        FROM 
            nfts
        LEFT JOIN (
            SELECT 
                nftKey, 
                COUNT(*) AS like_count
            FROM 
                nftlikes
            GROUP BY 
                nftKey
        ) nftlikes ON nfts.token_id = nftlikes.nftKey
        ORDER BY nfts.token_id DESC
        LIMIT $2 OFFSET $3`
	nfts, err := core.PostgresQueryJson[NFTData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func getNftPixelData(w http.ResponseWriter, r *http.Request) {
	tokenId := r.URL.Query().Get("tokenId")
	if tokenId == "" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "TokenId parameter is required")
		return
	}

	// First get the NFT data to access the imageHash
	nft, err := core.PostgresQueryOneJson[NFTData]("SELECT * FROM nfts WHERE token_id = $1", tokenId)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusNotFound, "NFT not found")
		return
	}

	var nftData NFTData
	if err := json.Unmarshal([]byte(nft), &nftData); err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to parse NFT data")
		return
	}

	// Try to read from file first
	roundNumber := os.Getenv("ROUND_NUMBER")
	if roundNumber == "" {
		roundNumber = "1" // Default to round 1 if not set
	}

	filename := fmt.Sprintf("nfts/round-%s/images/nft-%s.png", roundNumber, tokenId)
	fileBytes, err := os.ReadFile(filename)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to read image file")
		return
	}

	// If we have the file, process it using imageToPixelData
	pixelData, err := imageToPixelData(fileBytes, 10)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to process image")
		return
	}

	response := struct {
		Width     int   `json:"width"`
		Height    int   `json:"height"`
		PixelData []int `json:"pixelData"`
	}{
		Width:     nftData.Width,
		Height:    nftData.Height,
		PixelData: pixelData,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to create response")
		return
	}

	routeutils.WriteDataJson(w, string(jsonResponse))
}

func mintNFTDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
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

	name := (*jsonBody)["name"]

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.MintNFTDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "mint_nft", strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height), name)
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to mint NFT on devnet")
		return
	}

	routeutils.WriteResultJson(w, "NFT minted on devnet")
}

// TODO
// func LikeNFT(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method not allowed")
// 		return
// 	}
//
// 	nftlikeReq, err := routeutils.ReadJsonBody[NFTLikesRequest](r)
// 	if err != nil {
// 		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
// 		return
// 	}
//
// 	// TODO: ensure that the nft exists
// 	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTLikes (nftKey, liker) VALUES ($1, $2)", nftlikeReq.NFTKey, nftlikeReq.UserAddress)
// 	if err != nil {
// 		routeutils.WriteErrorJson(w, http.StatusBadRequest, "NFT already liked by user")
// 		return
// 	}
//
// 	routeutils.WriteResultJson(w, "NFT liked successfully")
// }
//
// func UnLikeNFT(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		routeutils.WriteErrorJson(w, http.StatusMethodNotAllowed, "Method not allowed")
// 		return
// 	}
//
// 	nftlikeReq, err := routeutils.ReadJsonBody[NFTLikesRequest](r)
// 	if err != nil {
// 		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
// 		return
// 	}
//
// 	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM nftlikes WHERE nftKey = $1 AND liker = $2", nftlikeReq.NFTKey, nftlikeReq.UserAddress)
// 	if err != nil {
// 		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to unlike NFT")
// 		return
// 	}
//
// 	routeutils.WriteResultJson(w, "NFT unliked successfully")
// }

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

func getTopNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
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

	query := `
        SELECT 
            nfts.*, 
            COALESCE(like_count, 0) AS likes,
            COALESCE((SELECT true FROM nftlikes WHERE liker = $1 AND nftlikes.nftkey = nfts.token_id), false) as liked
        FROM 
            nfts
        LEFT JOIN (
            SELECT 
                nftKey, 
                COUNT(*) AS like_count
            FROM 
                nftlikes
            GROUP BY 
                nftKey
        ) nftlikes ON nfts.token_id = nftlikes.nftKey
        ORDER BY 
            likes DESC
        LIMIT $2 OFFSET $3`
	nfts, err := core.PostgresQueryJson[NFTData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func likeNFTDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	// TODO: Read tokenId into a big.Int
	tokenId := (*jsonBody)["tokenId"]

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.LikeNFTDevnet
	contract := os.Getenv("CANVAS_NFT_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "like_nft", tokenId, "0")
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to like NFT on devnet")
		return
	}

	routeutils.WriteResultJson(w, "NFT liked on devnet")
}

func unlikeNFTDevnet(w http.ResponseWriter, r *http.Request) {
	// Disable this in production
	if routeutils.NonProductionMiddleware(w, r) {
		return
	}

	jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	tokenId := (*jsonBody)["tokenId"]

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.UnlikeNFTDevnet
	contract := os.Getenv("CANVAS_NFT_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "unlike_nft", tokenId, "0")
	_, err = cmd.Output()
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to unlike NFT on devnet")
		return
	}

	routeutils.WriteResultJson(w, "NFT unliked on devnet")
}

func getHotNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		address = "0"
	}
	// hot limit is the number of last likes to consider when calculating hotness
	hotLimit, err := strconv.Atoi(r.URL.Query().Get("hotLimit"))
	if err != nil || hotLimit <= 0 {
		hotLimit = 100
	}
	if hotLimit > 500 {
		hotLimit = 500
	}
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

	query := `
      SELECT
          nfts.*,
          COALESCE(like_count, 0) AS likes,
          COALESCE((
              SELECT true FROM nftlikes
              WHERE liker = $1 AND nftlikes.nftkey = nfts.token_id),
          false) as liked
      FROM
          nfts
      LEFT JOIN (
          SELECT
              nftKey,
              COUNT(*) AS like_count FROM nftlikes GROUP BY nftKey
      ) nftlikes ON nfts.token_id = nftlikes.nftKey
      LEFT JOIN (
          SELECT
              latestlikes.nftKey,
              COUNT(*) as rank
          FROM (
              SELECT * FROM nftlikes
              ORDER BY key DESC LIMIT $2
          ) latestlikes
          GROUP BY nftkey
      ) rank ON nfts.token_id = rank.nftkey
      ORDER BY COALESCE(rank, 0) DESC
      LIMIT $3 OFFSET $4;`
	nfts, err := core.PostgresQueryJson[NFTData](query, address, hotLimit, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve Hot NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}

func getLikedNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" || address == "0" {
		routeutils.WriteErrorJson(w, http.StatusBadRequest, "Valid address required for liked NFTs")
		return
	}

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

	query := `
        SELECT 
            nfts.*, 
            COALESCE(like_count, 0) AS likes,
            true as liked
        FROM 
            nfts
        LEFT JOIN (
            SELECT 
                nftKey, 
                COUNT(*) AS like_count
            FROM 
                nftlikes
            GROUP BY 
                nftKey
        ) nftlikes ON nfts.token_id = nftlikes.nftKey
        WHERE 
            nfts.token_id IN (
                SELECT nftkey 
                FROM nftlikes 
                WHERE liker = $1
            )
        ORDER BY nfts.token_id DESC
        LIMIT $2 OFFSET $3`

	nfts, err := core.PostgresQueryJson[NFTData](query, address, pageLength, offset)
	if err != nil {
		routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to retrieve liked NFTs")
		return
	}
	routeutils.WriteDataJson(w, string(nfts))
}
