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
  key integer NOT NULL PRIMARY KEY,
  dayIndex integer NOT NULL,
  dayStart timestamp NOT NULL,
  dayEnd timestamp NOT NULL
);
CREATE INDEX days_dayIndex_index ON Days (dayIndex);

CREATE TABLE DailyQuests (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL,
  dayIndex integer NOT NULL
);
CREATE INDEX dailyQuests_dayIndex_index ON DailyQuests (dayIndex);

-- TODO: Add calldata field
-- Table for storing the daily quests that the user has completed
CREATE TABLE UserDailyQuests (
  key integer NOT NULL PRIMARY KEY,
  userAddress char(64) NOT NULL,
  questKey integer NOT NULL,
  completed boolean NOT NULL,
  completedAt timestamp
);
CREATE INDEX userDailyQuests_userAddress_index ON UserDailyQuests (userAddress);
CREATE INDEX userDailyQuests_questKey_index ON UserDailyQuests (questKey);

CREATE TABLE MainQuests (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL
);

-- Table for storing the main quests that the user has completed
CREATE TABLE UserMainQuests (
  key integer NOT NULL PRIMARY KEY,
  userAddress char(64) NOT NULL,
  questKey integer NOT NULL,
  completed boolean NOT NULL,
  completedAt timestamp
);
CREATE INDEX userMainQuests_userAddress_index ON UserMainQuests (userAddress);
CREATE INDEX userMainQuests_questKey_index ON UserMainQuests (questKey);

-- TODO: key to color_idx
CREATE TABLE Colors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hex text NOT NULL
);

CREATE TABLE VotableColors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hex text NOT NULL,
  votes integer NOT NULL
);
CREATE INDEX votableColors_votes_index ON VotableColors (votes);

CREATE TABLE ColorVotes (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  userAddress char(64) NOT NULL,
  colorKey integer NOT NULL
);
CREATE INDEX colorVotes_userAddress_index ON ColorVotes (userAddress);
CREATE INDEX colorVotes_colorKey_index ON ColorVotes (colorKey);

CREATE TABLE Templates (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  hash text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  position integer NOT NULL,
  reward integer NOT NULL,
  rewardToken char(64) NOT NULL
--  ,data bytea NOT NULL
);

-- TODO: Owner & change on transfer
CREATE TABLE NFTs (
  key integer NOT NULL PRIMARY KEY,
  position integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  imageHash text NOT NULL,
  blockNumber integer NOT NULL,
  minter char(64) NOT NULL
);

CREATE TABLE NFTLikes (
  nftKey integer NOT NULL,
  liker char(64) NOT NULL,
  PRIMARY KEY (nftKey, liker)
);

CREATE INDEX nftLikes_nft_key_index ON NFTLikes (nftKey);
CREATE INDEX nftLikes_liker_index ON NFTLikes (liker);
