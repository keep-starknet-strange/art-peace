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
  time timestamp NOT NULL,
  UNIQUE (address)
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
  day_index integer NOT NULL,
  quest_id integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL,
  PRIMARY KEY (day_index, quest_id)
);
CREATE INDEX dailyQuests_day_index_index ON DailyQuests (day_index);
CREATE INDEX dailyQuests_quest_id_index ON DailyQuests (quest_id);

-- TODO: Add calldata field
-- Table for storing the daily quests that the user has completed
CREATE TABLE UserDailyQuests (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  day_index integer NOT NULL,
  quest_id integer NOT NULL,
  completed boolean NOT NULL,
  completed_at timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_address, day_index, quest_id)
);
CREATE INDEX userDailyQuests_user_address_index ON UserDailyQuests (user_address);
CREATE INDEX userDailyQuests_quest_id_index ON UserDailyQuests (quest_id);

CREATE TABLE MainQuests (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL
);

-- Table for storing the main quests that the user has completed
CREATE TABLE UserMainQuests (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  quest_id integer NOT NULL,
  completed boolean NOT NULL,
  completed_at timestamp
);
CREATE INDEX userMainQuests_user_address_index ON UserMainQuests (user_address);
CREATE INDEX userMainQuests_quest_id_index ON UserMainQuests (quest_id);

-- TODO: key to color_idx
CREATE TABLE Colors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hex text NOT NULL
);

-- TODO: Add day_index
CREATE TABLE VotableColors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hex text NOT NULL
);

CREATE TABLE ColorVotes (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  day_index integer NOT NULL,
  color_key integer NOT NULL,
  UNIQUE (user_address, day_index)
);
CREATE INDEX colorVotes_user_address_index ON ColorVotes (user_address);
CREATE INDEX colorVotes_day_index ON ColorVotes (day_index);
CREATE INDEX colorVotes_color_key_index ON ColorVotes (color_key);

CREATE TABLE TemplateData (
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hash text NOT NULL,
  data bytea NOT NULL
);

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
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  icon text,
  leader char(64) NOT NULL,
  pixel_pool integer NOT NULL
);
CREATE INDEX factions_leader_index ON Factions (leader);

CREATE TABLE FactionLinks (
  link_type text NOT NULL,
  link_url text NOT NULL,
  faction_id integer NOT NULL
);
CREATE INDEX factionLinks_faction_id_index ON FactionLinks (faction_id);

CREATE TABLE FactionChats (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sender char(64) NOT NULL,
  faction_key integer NOT NULL REFERENCES Factions(key),
  message text NOT NULL,
  time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TODO: Should allocation be here or somewhere else?
CREATE TABLE FactionMembersInfo (
  faction_id integer NOT NULL,
  member_id integer NOT NULL,
  user_address char(64) NOT NULL,
  allocation integer NOT NULL,
  last_placed_time timestamp NOT NULL,
  member_pixels integer NOT NULL,
  UNIQUE (faction_id, member_id)
);
CREATE INDEX factionMembersInfo_faction_id_index ON FactionMembersInfo (faction_id);
CREATE INDEX factionMembersInfo_user_address_index ON FactionMembersInfo (user_address);

CREATE TABLE FactionTemplates (
  template_key integer NOT NULL,
  faction_key INTEGER NOT NULL REFERENCES Factions(key)
);
