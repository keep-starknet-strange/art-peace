-- TODO: Allow marking claimed
CREATE TABLE AwardWinners (
  address char(64) NOT NULL,
  amount int NOT NULL,
  type text NOT NULL
);
CREATE INDEX address ON AwardWinners (address);
CREATE INDEX type ON AwardWinners (type);
