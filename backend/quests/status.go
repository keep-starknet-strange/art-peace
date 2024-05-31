package quests

import "github.com/keep-starknet-strange/art-peace/backend/core"

var QuestChecks = map[int]func(*Quest, string) (int, int){
	AuthorityQuestType:  CheckAuthorityStatus,
	HodlQuestType:       CheckHodlStatus,
	NftQuestType:        CheckNftStatus,
	PixelQuestType:      CheckPixelStatus,
	RainbowQuestType:    CheckRainbowStatus,
	TemplateQuestType:   CheckTemplateStatus,
	UnruggableQuestType: CheckUnruggableStatus,
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
	// TODO: Implement this
	return 0, 1
}

func CheckNftStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
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

func CheckRainbowStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
}

func CheckTemplateStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
}

func CheckUnruggableStatus(q *Quest, user string) (progress int, needed int) {
	// TODO: Implement this
	return 0, 1
}
