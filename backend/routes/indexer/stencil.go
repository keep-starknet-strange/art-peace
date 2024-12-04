package indexer

import (
	"context"
	"strconv"

	"github.com/keep-starknet-strange/art-peace/backend/core"
)

func processStencilAddedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]
	hashHex := event.Event.Data[0][2:] // Remove the 0x prefix
	widthHex := event.Event.Data[1]
	heightHex := event.Event.Data[2]
	positionHex := event.Event.Data[3]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilAddedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilAddedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilWidth, err := strconv.ParseInt(widthHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilAddedEvent", "Failed to parse widthHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilHeight, err := strconv.ParseInt(heightHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilAddedEvent", "Failed to parse heightHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilPosition, err := strconv.ParseInt(positionHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilAddedEvent", "Failed to parse positionHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Stencils (stencil_id, world_id, hash, width, height, position) VALUES ($1, $2, $3, $4, $5, $6)", stencilId, canvasId, hashHex, stencilWidth, stencilHeight, stencilPosition)
	if err != nil {
		PrintIndexerError("processStencilAddedEvent", "Failed to insert into Stencils", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}
}

func revertStencilAddedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilAddedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilAddedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Stencils WHERE stencil_id = $1 AND world_id = $2", stencilId, canvasId)
	if err != nil {
		PrintIndexerError("revertStencilAddedEvent", "Failed to delete from Stencils", canvasIdHex, stencilIdHex, err)
		return
	}
}

func processStencilRemovedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilRemovedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilRemovedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Stencils WHERE stencil_id = $1 AND world_id = $2", stencilId, canvasId)
	if err != nil {
		PrintIndexerError("processStencilRemovedEvent", "Failed to delete from Stencils", canvasIdHex, stencilIdHex, err)
		return
	}
}

func revertStencilRemovedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]
	hashHex := event.Event.Data[0]
	widthHex := event.Event.Data[1]
	heightHex := event.Event.Data[2]
	positionHex := event.Event.Data[3]

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilRemovedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilRemovedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilWidth, err := strconv.ParseInt(widthHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilRemovedEvent", "Failed to parse widthHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilHeight, err := strconv.ParseInt(heightHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilRemovedEvent", "Failed to parse heightHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	stencilPosition, err := strconv.ParseInt(positionHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilRemovedEvent", "Failed to parse positionHex", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Stencils (stencil_id, world_id, hash, width, height, position) VALUES ($1, $2, $3, $4, $5, $6)", stencilId, canvasId, hashHex, stencilWidth, stencilHeight, stencilPosition)
	if err != nil {
		PrintIndexerError("revertStencilRemovedEvent", "Failed to insert into Stencils", canvasIdHex, stencilIdHex, hashHex, widthHex, heightHex, positionHex, err)
		return
	}
}

func processStencilFavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]
	userAddressHex := event.Event.Keys[3][2:] // Remove the 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilFavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilFavoritedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO StencilFavorites (stencil_id, world_id, user_address) VALUES ($1, $2, $3)", stencilId, canvasId, userAddressHex)
	if err != nil {
		PrintIndexerError("processStencilFavoritedEvent", "Failed to insert into StencilFavorites", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}
}

func revertStencilFavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]
	userAddressHex := event.Event.Keys[3][2:] // Remove the 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilFavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilFavoritedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM StencilFavorites WHERE stencil_id = $1 AND world_id = $2 AND user_address = $3", stencilId, canvasId, userAddressHex)
	if err != nil {
		PrintIndexerError("revertStencilFavoritedEvent", "Failed to delete from StencilFavorites", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}
}

func processStencilUnfavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]
	userAddressHex := event.Event.Keys[3][2:] // Remove the 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilUnfavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("processStencilUnfavoritedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM StencilFavorites WHERE stencil_id = $1 AND world_id = $2 AND user_address = $3", stencilId, canvasId, userAddressHex)
	if err != nil {
		PrintIndexerError("processStencilUnfavoritedEvent", "Failed to delete from StencilFavorites", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}
}

func revertStencilUnfavoritedEvent(event IndexerEvent) {
	canvasIdHex := event.Event.Keys[1]
	stencilIdHex := event.Event.Keys[2]
	userAddressHex := event.Event.Keys[3][2:] // Remove the 0x prefix

	canvasId, err := strconv.ParseInt(canvasIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilUnfavoritedEvent", "Failed to parse canvasIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	stencilId, err := strconv.ParseInt(stencilIdHex, 0, 64)
	if err != nil {
		PrintIndexerError("revertStencilUnfavoritedEvent", "Failed to parse stencilIdHex", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}

	_, err = core.ArtPeaceBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO StencilFavorites (stencil_id, world_id, user_address) VALUES ($1, $2, $3)", stencilId, canvasId, userAddressHex)
	if err != nil {
		PrintIndexerError("revertStencilUnfavoritedEvent", "Failed to insert into StencilFavorites", canvasIdHex, stencilIdHex, userAddressHex, err)
		return
	}
}
