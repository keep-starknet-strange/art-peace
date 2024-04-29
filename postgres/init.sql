-- TODO: unique, ... constraints

CREATE TABLE Pixels (
  address char(64) NOT NULL,
  position integer NOT NULL,
  day integer NOT NULL,
  color integer NOT NULL,
  time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX pixels_address_index ON Pixels (address);
CREATE INDEX pixels_position_index ON Pixels (position);
CREATE INDEX pixels_day_index ON Pixels (day);
CREATE INDEX pixels_color_index ON Pixels (color);
CREATE INDEX pixels_time_index ON Pixels (time);

CREATE TABLE LastPlacedTime (
  address char(64) NOT NULL,
  time timestamp NOT NULL
);
CREATE INDEX lastPlacedTime_address_index ON LastPlacedTime (address);
CREATE INDEX lastPlacedTime_time_index ON LastPlacedTime (time);

CREATE TABLE ExtraPixels (
  address char(64) NOT NULL UNIQUE,
  available integer NOT NULL,
  used integer NOT NULL
);
CREATE INDEX extraPixels_address_index ON ExtraPixels (address);

CREATE TABLE Users (
  address char(64) NOT NULL,
  name text NOT NULL
);
CREATE INDEX user_address_index ON Users (address);

CREATE TABLE Days (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  day_index integer NOT NULL,
  day_start timestamp NOT NULL,
  day_end timestamp
);
CREATE INDEX days_day_index_index ON Days (day_index);

CREATE TABLE DailyQuests (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL,
  day_index integer NOT NULL
);
CREATE INDEX dailyQuests_day_index_index ON DailyQuests (day_index);

-- TODO: Add calldata field
-- Table for storing the daily quests that the user has completed
CREATE TABLE UserDailyQuests (
  key integer NOT NULL PRIMARY KEY,
  user_address char(64) NOT NULL,
  quest_key integer NOT NULL,
  completed boolean NOT NULL,
  completed_at timestamp
);
CREATE INDEX userDailyQuests_user_address_index ON UserDailyQuests (user_address);
CREATE INDEX userDailyQuests_quest_key_index ON UserDailyQuests (quest_key);

CREATE TABLE MainQuests (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL
);

-- Table for storing the main quests that the user has completed
CREATE TABLE UserMainQuests (
  key integer NOT NULL PRIMARY KEY,
  user_address char(64) NOT NULL,
  quest_key integer NOT NULL,
  completed boolean NOT NULL,
  completed_at timestamp
);
CREATE INDEX userMainQuests_user_address_index ON UserMainQuests (user_address);
CREATE INDEX userMainQuests_quest_key_index ON UserMainQuests (quest_key);

-- TODO: key to color_idx
CREATE TABLE Colors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hex text NOT NULL
);

CREATE TABLE VotableColors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hex text NOT NULL
);

CREATE TABLE ColorVotes (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  color_key integer NOT NULL
);
CREATE INDEX colorVotes_user_address_index ON ColorVotes (user_address);
CREATE INDEX colorVotes_color_key_index ON ColorVotes (color_key);

-- TODO: key -> template_id?
CREATE TABLE Templates (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  hash text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  position integer NOT NULL,
  reward integer NOT NULL,
  reward_token char(64) NOT NULL
);

-- TODO: Owner & change on transfer
CREATE TABLE NFTs (
  token_id integer NOT NULL PRIMARY KEY,
  position integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  image_hash text NOT NULL,
  block_number integer NOT NULL,
  minter char(64) NOT NULL
);

CREATE TABLE NFTLikes (
  nftKey integer NOT NULL,
  liker char(64) NOT NULL,
  PRIMARY KEY (nftKey, liker)
);
CREATE INDEX nftLikes_nft_key_index ON NFTLikes (nftKey);
CREATE INDEX nftLikes_liker_index ON NFTLikes (liker);

CREATE TABLE Factions (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  icon text NOT NULL,
  leader char(64) NOT NULL
);

CREATE TABLE FactionLinks (
  link_type text NOT NULL,
  link text NOT NULL,
  faction_key integer NOT NULL
);

CREATE TABLE FactionChats (
  sender char(64) NOT NULL,
  faction_key integer NOT NULL,
  message text NOT NULL,
  time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE FactionMembers (
  user_address char(64) NOT NULL,
  faction_key integer NOT NULL
);

CREATE TABLE FactionTemplates (
  template_key integer NOT NULL,
  faction_key integer NOT NULL
);
