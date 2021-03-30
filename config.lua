Config = {
    admin_groups = {"admin","superadmin"}, -- groups that can use admin commands
    banformat = "BANNED!\nReason: %s\nExpires: %s\nBanned by: %s (Ban ID: #%s)", -- message shown when banned (1st %s = reason, 2nd %s = expire, 3rd %s = banner, 4th %s = ban id)
    popassistformat = "Player %s is requesting help\nWrite <span class='text-success'>/accassist %s</span> to accept or <span class='text-danger'>/decassist</span> to decline", -- popup assist message format
    chatassistformat = "Player %s is requesting help\nWrite ^2/accassist %s^7 to accept or ^1/decassist^7 to decline\n^4Reason^7: %s", -- chat assist message format
    assist_keys = {enable=true,accept=208,decline=207}, -- keys for accepting/declining assist messages (default = page up, page down) - https://docs.fivem.net/game-references/controls/
    warning_screentime = 7.5, -- warning display length (in seconds)
    backup_kick_method = false, -- set this to true if banned players don't get kicked when banned or they can re-connect after being banned.
    kick_without_steam = true, -- prevent a player from joining your server without a steam identifier.
    page_element_limit = 250,
    ip_ban = false -- set to true to use ip in bans
}

-- To enable discord logs go to line 2 of the server.lua and paste your discord webhook between the quotes.