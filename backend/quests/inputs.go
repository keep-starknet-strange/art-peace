package quests

type PixelQuestInputs struct {
	PixelsNeeded uint32
	IsDaily      bool
	ClaimDay     uint32
	IsColor      bool
	Color        uint8
}

type VoteQuestInputs struct {
	DayIndex uint32
}

type HodlQuestInputs struct {
	Amount int
}

type NFTQuestInputs struct {
	IsDaily  bool
	ClaimDay uint32
}

func NewPixelQuestInputs(encodedInputs []int) *PixelQuestInputs {
	return &PixelQuestInputs{
		PixelsNeeded: uint32(encodedInputs[0]),
		IsDaily:      encodedInputs[1] == 1,
		ClaimDay:     uint32(encodedInputs[2]),
		IsColor:      encodedInputs[3] == 1,
		Color:        uint8(encodedInputs[4]),
	}
}

func NewVoteQuestInputs(encodedInputs []int) *VoteQuestInputs {
	return &VoteQuestInputs{
		DayIndex: uint32(encodedInputs[0]),
	}
}

func NewHodlQuestInputs(encodedInputs []int) *HodlQuestInputs {
	return &HodlQuestInputs{
		Amount: encodedInputs[0],
	}
}

func NewNFTQuestInputs(encodedInputs []int) *NFTQuestInputs {
	return &NFTQuestInputs{
		IsDaily:  encodedInputs[0] == 1,
		ClaimDay: uint32(encodedInputs[1]),
	}
}
