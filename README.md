# el_bwh
FiveM Ban/Warning/Help-Assist System for ESX

## Installation
1. Download the [resource](https://github.com/Elipse458/el_bwh/archive/master.zip)
2. Rename it to `el_bwh` and put it in your resources folder
3. Import sql.sql into your database
4. Edit the config to your liking
5. Add `start el_bwh` to your server.cfg ***Make sure to add this after mysql-async and es_extended***
6. Start it and you're good to go

## Documentation
There's a few commands this adds:
- /bwh             <- root admin command, this will display all sub-commands
- /bwh ban         <- opens the ban menu
- /bwh warn        <- opens the warn menu
- /bwh banlist     <- opens the ban list
- /bwh warnlist    <- opens the warning list
- /bwh assists     <- shows pending/active assists in the chat
- /bwh refresh     <- pulls all bans from the database and refreshes the ban cache
- /accassist `<player id>` <- admin command, admins can accept help requests from players
- /finassist       <- admin command, this closes the current help request and teleports you back to your original position
- /decassist       <- admin command, this just hides the current assist popup on the screen
- /assist `<reason>` <- player command, players can request help with this
- /cassist         <- player command, this cancels the players ongoing assist request  

External banning/warning:
**!! THESE ARE SERVER ONLY EVENTS !!**
```lua
-- banning
-- 1st parameter -> ESX user object of the sender
-- 2nd parameter -> ESX user object of the receiver OR if the player is offline, their steam identifier
-- 3rd parameter -> reason
-- 4th parameter -> length (exp. date of ban) in this format YYYY/MM/DD HH:SS, other formats won't work
-- 5th parameter -> if the player is offline, set to true, otherwise leave false or nil
TriggerEvent("el_bwh:ban", ESX.GetPlayerFromId(sender), ESX.GetPlayerFromId(target), reason, length, offline)

-- warning
-- 1st parameter -> ESX user object of the sender
-- 2nd parameter -> ESX user object of the receiver
-- 3rd parameter -> message of warn
-- 4th parameter -> boolean, if set to true the sender name will not show for the player
TriggerEvent("el_bwh:warn", ESX.GetPlayerFromId(sender), ESX.GetPlayerFromId(target), message, anonymous)
```

To unban someone, go to the ban list and scroll far right to the "Actions" section, you'll find a green unban button there  

## Important notes
This bans **all** players identifiers, that means their ip,license,steam,discord,xbl ids will get banned  
Offline bans only ban steam identifier and license because that's all that's stored in the db  
If you rename the folder to something else than `el_bwh`, **it will break things**.  
To rename it successfully you'll have to do some additional stuff as well. I also recommend to have the name in lowercase because it does some weird things if there's some upper case letters in the folder name.  
To do this, open `html/script.js` and replace every occurence of `el_bwh` with your new folder name, it should only be these lines
```
$.post("http://el_bwh/ban", JSON.stringify({ target: target, reason: reason, length: length }));
$.post("http://el_bwh/warn", JSON.stringify({ target: target, message: message, anon: anon }));
$.post("http://el_bwh/unban", JSON.stringify({ id: $(this).data("id") }));
$.post("http://el_bwh/hidecursor", JSON.stringify({}));
```
After you replace it, it should look like this
```
$.post("http://<YOUR FOLDER NAME>/ban", JSON.stringify({ target: target, reason: reason, length: length }));
$.post("http://<YOUR FOLDER NAME>/warn", JSON.stringify({ target: target, message: message, anon: anon }));
$.post("http://<YOUR FOLDER NAME>/unban", JSON.stringify({ id: $(this).data("id") }));
$.post("http://<YOUR FOLDER NAME>/hidecursor", JSON.stringify({}));
```

If you don't like the current design (i don't blame you, i'm really not a designer), you can edit the `html/index.html` and `html/style.css` files to change the design to your liking

If find any bugs, please join my [discord server](https://discord.gg/GbT49uH) and report it in the #bug-reports channel  
If you like my work, please check out [my page](https://elipse458.me), i'll probably release a few more things if i have the time and feel like it
