package core

import (
	"context"
	"encoding/json"
	"os"
	"strconv"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/keep-starknet-strange/art-peace/backend/config"
)

type Databases struct {
	DatabaseConfig *config.DatabaseConfig

	Redis    *redis.Client
	Postgres *pgxpool.Pool
}

func NewDatabases(databaseConfig *config.DatabaseConfig) *Databases {
	d := &Databases{}
	d.DatabaseConfig = databaseConfig

	// Connect to Redis
	d.Redis = redis.NewClient(&redis.Options{
		Addr:     databaseConfig.Redis.Host + ":" + strconv.Itoa(databaseConfig.Redis.Port),
		Password: "", // TODO: Read from env
		DB:       0,
	})

	// Connect to Postgres
	postgresConnString := "postgresql://" + databaseConfig.Postgres.User + ":" + os.Getenv("POSTGRES_PASSWORD") + "@" + databaseConfig.Postgres.Host + ":" + strconv.Itoa(databaseConfig.Postgres.Port) + "/" + databaseConfig.Postgres.Database
	// TODO: crd_audit?sslmode=disable
	pgPool, err := pgxpool.New(context.Background(), postgresConnString)
	if err != nil {
		panic(err)
	}
	d.Postgres = pgPool

	return d
}

func (d *Databases) Close() {
	d.Redis.Close()
	d.Postgres.Close()
}

func PostgresQuery[RowType any](query string, args ...interface{}) ([]RowType, error) {
	var result []RowType
	err := pgxscan.Select(context.Background(), ArtPeaceBackend.Databases.Postgres, &result, query, args...)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func PostgresQueryOne[RowType any](query string, args ...interface{}) (*RowType, error) {
	var result RowType
	err := pgxscan.Get(context.Background(), ArtPeaceBackend.Databases.Postgres, &result, query, args...)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func PostgresQueryJson[RowType any](query string, args ...interface{}) ([]byte, error) {
	result, err := PostgresQuery[RowType](query, args...)
	if err != nil {
		return nil, err
	}

	json, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}

	return json, nil
}

func PostgresQueryOneJson[RowType any](query string, args ...interface{}) ([]byte, error) {
	result, err := PostgresQueryOne[RowType](query, args...)
	if err != nil {
		return nil, err
	}

	json, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}

	return json, nil
}
