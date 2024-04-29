package routes

import "net/http"

func SetupAccessHeaders(w http.ResponseWriter) {
  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
  w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func SetupHeaders(w http.ResponseWriter) {
  SetupAccessHeaders(w)

  w.Header().Set("Content-Type", "application/json")
}

func BasicErrorJson(err string) []byte {
  return []byte(`{"error": "` + err + `"}`)
}

func WriteErrorJson(w http.ResponseWriter, errCode int, err string) {
  SetupHeaders(w)
  w.WriteHeader(errCode)
  w.Write(BasicErrorJson(err))
}

func BasicResultJson(result string) []byte {
  return []byte(`{"result": "` + result + `"}`)
}

func WriteResultJson(w http.ResponseWriter, result string) {
  SetupHeaders(w)
  w.WriteHeader(http.StatusOK)
  w.Write(BasicResultJson(result))
}

// TODO: To string
func BasicDataJson(data string) []byte {
  return []byte(`{"data": ` + data + `}`)
}

func WriteDataJson(w http.ResponseWriter, data string) {
  SetupHeaders(w)
  w.WriteHeader(http.StatusOK)
  w.Write(BasicDataJson(data))
}
