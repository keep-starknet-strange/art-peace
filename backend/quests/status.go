package quests

import (
	"github.com/keep-starknet-strange/art-peace/backend/core"
)

var QuestChecks = map[int]func(*Quest, string) (int, int){
	AuthorityQuestType:    CheckAuthorityStatus,
	HodlQuestType:         CheckHodlStatus,
	NFTMintQuestType:      CheckNftStatus,
	PixelQuestType:        CheckPixelStatus,
	RainbowQuestType:      CheckRainbowStatus,
	TemplateQuestType:     CheckTemplateStatus,
	UnruggableQuestType:   CheckUnruggableStatus,
	VoteQuestType:         CheckVoteStatus,
	FactionQuestType:      CheckFactionStatus,
	ChainFactionQuestType: CheckChainFactionStatus,
	UsernameQuestType:     CheckUsernameStatus,
}

func (q *Quest) CheckStatus(user string) (progress int, needed int) {
	check := QuestChecks[q.Type]
	if check == nil {
		return 0, 0
	}
	return check(q, user)
}

func CheckAuthorityStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
}

func CheckHodlStatus(q *Quest, user string) (progress int, needed int) {
	hodlQuestInputs := NewHodlQuestInputs(q.InputData)
	available, err := core.PostgresQueryOne[int]("SELECT available FROM ExtraPixels WHERE address = $1", user)

	if err != nil {
		return 0, hodlQuestInputs.Amount
	}
	return *available, hodlQuestInputs.Amount
}

func CheckNftStatus(q *Quest, user string) (progress int, needed int) {
	nftQuestInputs := NewNFTQuestInputs(q.InputData)
	if nftQuestInputs.IsDaily {
		nfts_minted_by_user, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM NFTs WHERE minter = $1 AND day_index = $2", user, nftQuestInputs.ClaimDay)
		if err != nil {
			return 0, 1
		}
		return *nfts_minted_by_user, 1
	} else {
		nfts_minted_by_user, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM NFTs WHERE minter = $1", user)
		if err != nil {
			return 0, 1
		}
		return *nfts_minted_by_user, 1
	}
}

func CheckPixelStatus(q *Quest, user string) (progress int, needed int) {
	pixelQuestInputs := NewPixelQuestInputs(q.InputData)
	if pixelQuestInputs.IsDaily {
		day := pixelQuestInputs.ClaimDay
		if pixelQuestInputs.IsColor {
			// TODO: Use coalesce
			count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1 AND color = $2 AND day = $3", user, pixelQuestInputs.Color, day)
			if err != nil {
				return 0, 1
			}
			return *count, int(pixelQuestInputs.PixelsNeeded)
		} else {
			count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1 AND day = $2", user, day)
			if err != nil {
				return 0, 1
			}
			return *count, int(pixelQuestInputs.PixelsNeeded)
		}
	} else {
		if pixelQuestInputs.IsColor {
			count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1 AND color = $2", user, pixelQuestInputs.Color)
			if err != nil {
				return 0, 1
			}
			return *count, int(pixelQuestInputs.PixelsNeeded)
		} else {
			count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM Pixels WHERE address = $1", user)
			if err != nil {
				return 0, 1
			}
			return *count, int(pixelQuestInputs.PixelsNeeded)
		}
	}
}

func CheckVoteStatus(q *Quest, user string) (progress int, needed int) {
	voteQuestInputs := NewVoteQuestInputs(q.InputData)

	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM ColorVotes WHERE user_address = $1 AND day_index = $2", user, voteQuestInputs.DayIndex)
	if err != nil {
		return 0, 1
	}

	return *count, 1
}

func CheckChainFactionStatus(q *Quest, user string) (progress int, needed int) {
	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM ChainFactionMembersInfo WHERE user_address = $1", user)
	if err != nil {
		return 0, 1
	}

	return *count, 1
}

func CheckFactionStatus(q *Quest, user string) (progress int, needed int) {
	count, err := core.PostgresQueryOne[int]("SELECT COUNT(*) FROM FactionMembersInfo WHERE user_address = $1", user)
	if err != nil {
		return 0, 1
	}

	return *count, 1
}

type RainbowStatus struct {
	Used   int `json:"used"`
	Colors int `json:"colors"`
}

func CheckRainbowStatus(q *Quest, user string) (progress int, needed int) {
	status, err := core.PostgresQueryOne[RainbowStatus]("SELECT COUNT(DISTINCT p.color) as used, (SELECT COUNT(*) FROM Colors) as colors FROM Pixels p WHERE p.address = $1", user)
	if err != nil {
		return 0, 1
	}

	return status.Used, status.Colors
}

func CheckTemplateStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
}

func CheckUnruggableStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
}

func CheckUsernameStatus(q *Quest, user string) (progress int, needed int) {
	count, err := core.PostgresQueryOne[int]("SELECT COUNT (*) FROM Users where address = $1", user)

	if err != nil {
		return 0, 1
	} else {
		return *count, 1
	}
}
