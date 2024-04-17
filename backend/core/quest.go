package core

// Quest represents a quest from the database
type Quest struct {
  ID           int    `json:"id"`
  Name         string `json:"name"`
  Description  string `json:"description"`
  Reward       int    `json:"reward"`
  DayIndex     int    `json:"dayIndex"`
  Completed    int    `json:"completed"`
}
