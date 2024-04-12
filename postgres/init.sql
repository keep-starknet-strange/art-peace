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

-- TODO: Remove completedStatus & status from Quests?
CREATE TABLE Quests (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL,
  dayIndex integer NOT NULL,
  completedStatus integer NOT NULL
);
CREATE INDEX quests_dayIndex_index ON Quests (dayIndex);

-- TODO: Add calldata field
CREATE TABLE UserQuests (
  key integer NOT NULL PRIMARY KEY,
  userAddress char(64) NOT NULL,
  questKey integer NOT NULL,
  status integer NOT NULL,
  completed boolean NOT NULL,
  completedAt timestamp
);
CREATE INDEX userQuests_userAddress_index ON UserQuests (userAddress);
CREATE INDEX userQuests_questKey_index ON UserQuests (questKey);

CREATE TABLE Colors (
  key integer NOT NULL PRIMARY KEY,
  hex text NOT NULL
);

CREATE TABLE VotableColors (
  key integer NOT NULL PRIMARY KEY,
  hex text NOT NULL,
  votes integer NOT NULL
);
CREATE INDEX votableColors_votes_index ON VotableColors (votes);

CREATE TABLE ColorVotes (
  key integer NOT NULL PRIMARY KEY,
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
  data bytea NOT NULL
);
