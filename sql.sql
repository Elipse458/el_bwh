CREATE TABLE `bwh_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receiver` text NOT NULL,
  `sender` varchar(60) NOT NULL,
  `length` datetime NULL,
  `reason` text NOT NULL,
  `unbanned` TINYINT NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);
CREATE TABLE `bwh_warnings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receiver` text NOT NULL,
  `sender` varchar(60) NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`id`)
);
CREATE TABLE `bwh_identifiers` (
  `steam` VARCHAR(60) NOT NULL,
  `license` VARCHAR(60) NOT NULL,
  `ip` VARCHAR(60) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `xbl` VARCHAR(60) NULL,
  `live` VARCHAR(60) NULL,
  `discord` VARCHAR(60) NULL,
  `fivem` VARCHAR(60) NULL,
  PRIMARY KEY (`steam`)
);