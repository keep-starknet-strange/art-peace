package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
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
	http.HandleFunc("/like-nft", LikeNFT)
	http.HandleFunc("/unlike-nft", UnLikeNFT)
	http.HandleFunc("/mint-nft-devnet", mintNFTDevnet)
	// Create a static file server for the nft images
	http.Handle("/nft-images/", http.StripPrefix("/nft-images/", http.FileServer(http.Dir("."))))
	//http.HandleFunc("/nft-image", nftImage)
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

type NFTLikes struct {
	nftkey	int 			`json:"nftkey"`
	useraddress 	string 		`json:"useraddress"`
}


func getNFT(w http.ResponseWriter, r *http.Request) {
	tokenId := r.URL.Query().Get("tokenId")

	var nftData NFTData
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM nfts WHERE token_id = $1", tokenId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	defer rows.Close()

	err = rows.Scan(&nftData.TokenID, &nftData.Position, &nftData.Width, &nftData.Height, &nftData.ImageHash, &nftData.BlockNumber, &nftData.Minter)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(nftData)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}

func getMyNFTs(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")

	var nftDatas []NFTData
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM nfts WHERE minter = $1", address)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	defer rows.Close()

	for rows.Next() {
		var nftData NFTData
		err = rows.Scan(&nftData.TokenID, &nftData.Position, &nftData.Width, &nftData.Height, &nftData.ImageHash, &nftData.BlockNumber, &nftData.Minter)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		nftDatas = append(nftDatas, nftData)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(nftDatas)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}

func getNFTs(w http.ResponseWriter, r *http.Request) {
	// TODO: Pagination & Likes
	var nftDatas []NFTData
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM nfts")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	defer rows.Close()

	for rows.Next() {
		var nftData NFTData
		err = rows.Scan(&nftData.TokenID, &nftData.Position, &nftData.Width, &nftData.Height, &nftData.ImageHash, &nftData.BlockNumber, &nftData.Minter)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		nftDatas = append(nftDatas, nftData)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	out, err := json.Marshal(nftDatas)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte(out))
}

// func nftImage(w http.ResponseWriter, r *http.Request) {
//   // Get the png image at location "nft-{tokenId}.png"
//   tokenId := r.URL.Query().Get("tokenId")
//   imageLocation := fmt.Sprintf("nft-%s.png", tokenId)
//
//   image, err := os.Open(imageLocation)
//   if err != nil {
//     w.WriteHeader(http.StatusInternalServerError)
//     w.Write([]byte(err.Error()))
//     return
//   }
//   defer image.Close()
//
//   w.Header().Set("Access-Control-Allow-Origin", "*")
//   w.Header().Set("Content-Type", "image/png")
//   w.WriteHeader(http.StatusOK)
//
//   io.Copy(w, image)
// }

func mintNFTDevnet(w http.ResponseWriter, r *http.Request) {
	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	var jsonBody map[string]string
	err = json.Unmarshal(reqBody, &jsonBody)
	if err != nil {
		panic(err)
	}

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

	shellCmd := core.ArtPeaceBackend.BackendConfig.Scripts.MintNFTDevnet
	contract := os.Getenv("ART_PEACE_CONTRACT_ADDRESS")

	cmd := exec.Command(shellCmd, contract, "mint_nft", strconv.Itoa(position), strconv.Itoa(width), strconv.Itoa(height))
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error executing shell command: ", err)
		panic(err)
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write([]byte("Minted NFT on devnet"))
}


func LikeNFT(w http.ResponseWriter, r *http.Request) {

	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	var nftlike NFTLikes
		err = json.Unmarshal(reqBody, &nftlike)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	// check if the user has like the nft 

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	 rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM NFTLikes WHERE nftKey = $1 AND liker = $2", nftlike.nftkey, nftlike.useraddress)
    
	 if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        w.Write([]byte(err.Error()))
        return
    }

	defer rows.Close()
	
	 if !rows.Next() { // No rows returned, user hasn't liked the NFT yet

        _, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO NFTLikes (nftKey, liker) VALUES ($1, $2)", nftlike.nftkey, nftlike.useraddress)
        if err != nil {
            w.WriteHeader(http.StatusInternalServerError)
            w.Write([]byte(err.Error()))
            return
        }

        w.WriteHeader(http.StatusOK)
        w.Write([]byte("NFT Liked By User"))
        fmt.Println("NFT Liked By User")
        return
  }

	 // User has already liked the NFT
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("NFT Already Liked By User"))
    fmt.Println("NFT Already Liked By User")


}


func UnLikeNFT(w http.ResponseWriter, r *http.Request) {

	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	var nftlike NFTLikes
	err = json.Unmarshal(reqBody, &nftlike)
	
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	// check if the user has like the nft 
	rows, err := core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "SELECT * FROM NFTLikes WHERE nftKey = $1 AND liker = $2", nftlike.nftkey, nftlike.useraddress)
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	defer rows.Close()
	
	if !rows.Next() { // No rows returned, user hasn't liked the NFT yet

			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Cannot Unlike an NFT You did not Like"))
			fmt.Println("Cannot Unlike an NFT You did not Like")
			return 

  }

		// delete the like here  
		_, err = core.ArtPeaceBackend.Databases.Postgres.Query(context.Background(), "DELETE FROM nftlikes WHERE nftKey = $1 AND liker = $2", nftlike.nftkey, nftlike.useraddress)
	
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("NFT Unlike By User"))
		fmt.Println("NFT Unlike By User")
		return

}

