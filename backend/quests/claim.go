package quests

import "github.com/keep-starknet-strange/art-peace/backend/core"

var QuestClaimData = map[int]func(*Quest, string) []int{
	NFTMintQuestType: NFTMintQuestClaimData,
}

func (q *Quest) GetQuestClaimData(user string) []int {
	if f, ok := QuestClaimData[q.Type]; ok {
		return f(q, user)
	}
	return nil
}

func NFTMintQuestClaimData(q *Quest, user string) []int {
	nftQuestInputs := NewNFTQuestInputs(q.InputData)
	if nftQuestInputs.IsDaily {
		tokenId, err := core.PostgresQueryOne[int]("SELECT token_id FROM NFTs WHERE minter = $1 AND day_index = $2", user, nftQuestInputs.ClaimDay)
		if err != nil {
			return nil
		}
		return []int{*tokenId}
	} else {
		tokenId, err := core.PostgresQueryOne[int]("SELECT token_id FROM NFTs WHERE minter = $1", user)
		if err != nil {
			return nil
		}
		return []int{*tokenId}
	}
}
