package core

import (
	"context"
	"os"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"

	"github.com/keep-starknet-strange/art-peace/backend/config"
)

type Databases struct {
	DatabaseConfig *config.DatabaseConfig

	Redis    *redis.Client
	Postgres *pgx.Conn
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
	pgConn, err := pgx.Connect(context.Background(), postgresConnString)
	if err != nil {
		panic(err)
	}
	d.Postgres = pgConn

	return d
}

func (d *Databases) Close() {
	d.Redis.Close()
	d.Postgres.Close(context.Background())
}
