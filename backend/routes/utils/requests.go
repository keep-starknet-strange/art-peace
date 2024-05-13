package routeutils

import (
	"encoding/json"
	"io"
	"net/http"
)

func ReadJsonBody[bodyType any](r *http.Request) (*bodyType, error) {
	reqBody, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}

	var body bodyType
	err = json.Unmarshal(reqBody, &body)
	if err != nil {
		return nil, err
	}

	// TODO: close body?

	return &body, nil
}
