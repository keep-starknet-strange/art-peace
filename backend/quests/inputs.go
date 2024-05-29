package quests

type PixelQuestInputs struct {
	PixelsNeeded uint32
	IsDaily      bool
	ClaimDay     uint32
	IsColor      bool
	Color        uint8
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
