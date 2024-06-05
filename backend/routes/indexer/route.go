package indexer

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	routeutils "github.com/keep-starknet-strange/art-peace/backend/routes/utils"
)

// TODO: Remove error json messages

func InitIndexerRoutes() {
	http.HandleFunc("/consume-indexer-msg", consumeIndexerMsg)
}

type IndexerCursor struct {
	OrderKey  int    `json:"orderKey"`
	UniqueKey string `json:"uniqueKey"`
}

type IndexerEvent struct {
	Event struct {
		FromAddress string   `json:"fromAddress"`
		Keys        []string `json:"keys"`
		Data        []string `json:"data"`
	} `json:"event"`
}

type IndexerMessage struct {
	Data struct {
		Cursor    IndexerCursor `json:"cursor"`
		EndCursor IndexerCursor `json:"end_cursor"`
		Finality  string        `json:"finality"`
		Batch     []struct {
			Status string         `json:"status"`
			Events []IndexerEvent `json:"events"`
		} `json:"batch"`
	} `json:"data"`
}

// TODO: When will there be multiple events in a batch?
//       Try interacting with multiple contracts in a single block

// TODO: Pointers?
// TODO: Load on init
var LatestPendingMessage *IndexerMessage
var LastProcessedPendingMessage *IndexerMessage
var PendingMessageLock = &sync.Mutex{}
var LastAcceptedEndKey int
var AcceptedMessageQueue []IndexerMessage
var AcceptedMessageLock = &sync.Mutex{}

const (
	newDayEvent             = "0x00df776faf675d0c64b0f2ec596411cf1509d3966baba3478c84771ddbac1784"
	pixelPlacedEvent        = "0x02d7b50ebf415606d77c7e7842546fc13f8acfbfd16f7bcf2bc2d08f54114c23"
	basicPixelPlacedEvent   = "0x03089ae3085e1c52442bb171f26f92624095d32dc8a9c57c8fb09130d32daed8"
	memberPixelsPlacedEvent = "0x0165248ea72ba05120b18ec02e729e1f03a465f728283e6bb805bb284086c859"
	extraPixelsPlacedEvent  = "0x000e8f5c4e6f651bf4c7b093805f85c9b8ec2ec428210f90a4c9c135c347f48c"
	dailyQuestClaimedEvent  = "0x02025eddbc0f68a923d76519fb336e0fe1e0d6b9053ab3a504251bbd44201b10"
	mainQuestClaimedEvent   = "0x0121172d5bc3847c8c39069075125e53d3225741d190df6d52194cb5dd5d2049"
	voteColorEvent          = "0x02407c82b0efa2f6176a075ba5a939d33eefab39895fabcf3ac1c5e897974a40"
	factionCreatedEvent     = "0x00f3878d4c85ed94271bb611f83d47ea473bae501ffed34cd21b73206149f692"
	memberReplacedEvent     = "0x01f8936599822d668e09401ffcef1989aca342fb1f003f9b3b1fd1cbf605ed6b"
	nftMintedEvent          = "0x030826e0cd9a517f76e857e3f3100fe5b9098e9f8216d3db283fb4c9a641232f"
	usernameClaimedEvent    = "0x019be6537c04b790ae4e3a06d6e777ec8b2e9950a01d76eed8a2a28941cc511c"
	usernameChangedEvent    = "0x03c44b98666b0a27eadcdf5dc42449af5f907b19523858368c4ffbc7a2625dab"
	templateAddedEvent      = "0x03e18ec266fe76a2efce73f91228e6e04456b744fc6984c7a6374e417fb4bf59"
	nftTransferEvent        = "0x0099cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"
)

var eventProcessors = map[string](func(IndexerEvent)){
	newDayEvent:             processNewDayEvent,
	pixelPlacedEvent:        processPixelPlacedEvent,
	basicPixelPlacedEvent:   processBasicPixelPlacedEvent,
	memberPixelsPlacedEvent: processMemberPixelsPlacedEvent,
	extraPixelsPlacedEvent:  processExtraPixelsPlacedEvent,
	dailyQuestClaimedEvent:  processDailyQuestClaimedEvent,
	mainQuestClaimedEvent:   processMainQuestClaimedEvent,
	voteColorEvent:          processVoteColorEvent,
	factionCreatedEvent:     processFactionCreatedEvent,
	memberReplacedEvent:     processMemberReplacedEvent,
	nftMintedEvent:          processNFTMintedEvent,
	usernameClaimedEvent:    processUsernameClaimedEvent,
	usernameChangedEvent:    processUsernameChangedEvent,
	templateAddedEvent:      processTemplateAddedEvent,
	nftTransferEvent:        processNFTTransferEvent,
}

var eventReverters = map[string](func(IndexerEvent)){
	newDayEvent:             revertNewDayEvent,
	pixelPlacedEvent:        revertPixelPlacedEvent,
	basicPixelPlacedEvent:   revertBasicPixelPlacedEvent,
	memberPixelsPlacedEvent: revertMemberPixelsPlacedEvent,
	extraPixelsPlacedEvent:  revertExtraPixelsPlacedEvent,
	dailyQuestClaimedEvent:  revertDailyQuestClaimedEvent,
	mainQuestClaimedEvent:   revertMainQuestClaimedEvent,
	voteColorEvent:          revertVoteColorEvent,
	factionCreatedEvent:     revertFactionCreatedEvent,
	memberReplacedEvent:     revertMemberReplacedEvent,
	nftMintedEvent:          revertNFTMintedEvent,
	usernameClaimedEvent:    revertUsernameClaimedEvent,
	usernameChangedEvent:    revertUsernameChangedEvent,
	templateAddedEvent:      revertTemplateAddedEvent,
	nftTransferEvent:        revertNFTTransferEvent,
}

// TODO: Think about this more
var eventRequiresOrdering = map[string]bool{
	newDayEvent:             false,
	pixelPlacedEvent:        true,
	basicPixelPlacedEvent:   false,
	memberPixelsPlacedEvent: false,
	extraPixelsPlacedEvent:  false,
	dailyQuestClaimedEvent:  false,
	mainQuestClaimedEvent:   false,
	voteColorEvent:          true,
	factionCreatedEvent:     false,
	memberReplacedEvent:     true,
	nftMintedEvent:          false,
	usernameClaimedEvent:    false,
	usernameChangedEvent:    true,
	templateAddedEvent:      false,
	nftTransferEvent:        true,
}

const (
	DATA_STATUS_FINALIZED = "DATA_STATUS_FINALIZED"
	DATA_STATUS_ACCEPTED  = "DATA_STATUS_ACCEPTED"
	DATA_STATUS_PENDING   = "DATA_STATUS_PENDING"
)

func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
	message, err := routeutils.ReadJsonBody[IndexerMessage](r)
	if err != nil {
		PrintIndexerError("consumeIndexerMsg", "error reading indexer message", err)
		return
	}

	if len(message.Data.Batch) == 0 {
		fmt.Println("No events in batch")
		return
	}

	if message.Data.Finality == DATA_STATUS_FINALIZED {
		// TODO: Track diffs with accepted messages? / check if accepted message processed
		fmt.Println("Finalized message")
		return
	} else if message.Data.Finality == DATA_STATUS_ACCEPTED {
		AcceptedMessageLock.Lock()
		// TODO: Ensure ordering w/ EndCursor?
		AcceptedMessageQueue = append(AcceptedMessageQueue, *message)
		AcceptedMessageLock.Unlock()
		return
	} else if message.Data.Finality == DATA_STATUS_PENDING {
		PendingMessageLock.Lock()
		LatestPendingMessage = message
		PendingMessageLock.Unlock()
		return
	} else {
		fmt.Println("Unknown finality status")
	}
}

func ProcessMessageEvents(message IndexerMessage) {
	for _, event := range message.Data.Batch[0].Events {
		eventKey := event.Event.Keys[0]
		eventProcessor, ok := eventProcessors[eventKey]
		if !ok {
			PrintIndexerError("consumeIndexerMsg", "error processing event", eventKey)
			return
		}
		eventProcessor(event)
	}
}

// TODO: Improve this with hashing?
func EventComparator(event1 IndexerEvent, event2 IndexerEvent) bool {
	if event1.Event.FromAddress != event2.Event.FromAddress {
		return false
	}

	if len(event1.Event.Keys) != len(event2.Event.Keys) {
		return false
	}

	if len(event1.Event.Data) != len(event2.Event.Data) {
		return false
	}

	for idx := 0; idx < len(event1.Event.Keys); idx++ {
		if event1.Event.Keys[idx] != event2.Event.Keys[idx] {
			return false
		}
	}

	for idx := 0; idx < len(event1.Event.Data); idx++ {
		if event1.Event.Data[idx] != event2.Event.Data[idx] {
			return false
		}
	}

	return true
}

func processMessageEventsWithReverter(oldMessage IndexerMessage, newMessage IndexerMessage) {
	var idx int
	var latestEventIndex int
	var unorderedEvents []IndexerEvent
	for idx = 0; idx < len(oldMessage.Data.Batch[0].Events); idx++ {
		oldEvent := oldMessage.Data.Batch[0].Events[idx]
		newEvent := newMessage.Data.Batch[0].Events[idx]
		// Check if events are the same
		if EventComparator(oldEvent, newEvent) {
			latestEventIndex = idx
			continue
		}

		// Non-matching events, revert remaining old events based on ordering
		// TODO: Print note here and see how often this happens
		// Revert events from end of old events to current event
		latestEventIndex = idx
		for idx = len(oldMessage.Data.Batch[0].Events) - 1; idx >= latestEventIndex; idx-- {
			eventKey := oldMessage.Data.Batch[0].Events[idx].Event.Keys[0]
			if eventRequiresOrdering[eventKey] {
				// Revert event
				eventReverter, ok := eventReverters[eventKey]
				if !ok {
					PrintIndexerError("consumeIndexerMsg", "error reverting event", eventKey)
					return
				}
				eventReverter(oldMessage.Data.Batch[0].Events[idx])
			} else {
				unorderedEvents = append(unorderedEvents, oldMessage.Data.Batch[0].Events[idx])
			}
		}
		break
	}

	// Process new events
	for idx = latestEventIndex + 1; idx < len(newMessage.Data.Batch[0].Events); idx++ {
		eventKey := newMessage.Data.Batch[0].Events[idx].Event.Keys[0]

		// Check if event is in unordered events
		var wasProcessed bool
		for idx, unorderedEvent := range unorderedEvents {
			if EventComparator(unorderedEvent, newMessage.Data.Batch[0].Events[idx]) {
				// Remove event from unordered events
				unorderedEvents = append(unorderedEvents[:idx], unorderedEvents[idx+1:]...)
				wasProcessed = true
				break
			}
		}
		if wasProcessed {
			continue
		}

		eventProcessor, ok := eventProcessors[eventKey]
		if !ok {
			PrintIndexerError("consumeIndexerMsg", "error processing event", eventKey)
			return
		}
		eventProcessor(newMessage.Data.Batch[0].Events[idx])
	}

	// Revert remaining unordered events
	for _, unorderedEvent := range unorderedEvents {
		eventKey := unorderedEvent.Event.Keys[0]
		eventReverter, ok := eventReverters[eventKey]
		if !ok {
			PrintIndexerError("consumeIndexerMsg", "error reverting event", eventKey)
			return
		}
		eventReverter(unorderedEvent)
	}
}

func ProcessMessage(message IndexerMessage) {
	// Check if there are pending messages for this start key
	// TODO: OrderKey or UniqueKey or both?
	if LastProcessedPendingMessage != nil && LastProcessedPendingMessage.Data.Cursor.OrderKey == message.Data.Cursor.OrderKey {
		processMessageEventsWithReverter(*LastProcessedPendingMessage, message)
	} else {
		ProcessMessageEvents(message)
	}
}

func TryProcessAcceptedMessages() bool {
	AcceptedMessageLock.Lock()
	defer AcceptedMessageLock.Unlock()

	if len(AcceptedMessageQueue) > 0 {
		message := AcceptedMessageQueue[0]
		AcceptedMessageQueue = AcceptedMessageQueue[1:]
		ProcessMessage(message)
		return true
	}
	return false
}

func TryProcessPendingMessage() bool {
	PendingMessageLock.Lock()
	defer PendingMessageLock.Unlock()

	if LatestPendingMessage == nil {
		return false
	}

	ProcessMessage(*LatestPendingMessage)
	LastProcessedPendingMessage = LatestPendingMessage
	LatestPendingMessage = nil
	return true
}

func StartMessageProcessor() {
	// Goroutine to process pending/accepted messages
	go func() {
		for {
			// Prioritize accepted messages
			if TryProcessAcceptedMessages() {
				continue
			}

			if TryProcessPendingMessage() {
				continue
			}

			// No messages to process, sleep for 1 second
			time.Sleep(1 * time.Second)
		}
	}()
}

// TODO: User might miss some messages between loading canvas and connecting to websocket?
// TODO: Check thread safety of these things
// TODO: only allow indexer to call this endpoint
