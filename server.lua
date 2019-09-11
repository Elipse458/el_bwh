ESX = nil
local bancache = {} -- id,sender,sender_name,receiver,reason,length
local open_assists,active_assists = {},{}

Citizen.CreateThread(function() -- startup
    TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
    while ESX==nil do Wait(0) end
    
    MySQL.ready(function()
        refreshBanCache()
    end)

    ESX.RegisterServerCallback("el_bwh:ban", function(source,cb,target,reason,length)
        if not target or not reason or not length then return end
        local xPlayer = ESX.GetPlayerFromId(source)
        local xTarget = ESX.GetPlayerFromId(target)
        if not xPlayer or not xTarget then cb(nil); return end
        if isAdmin(xPlayer) then
            banPlayer(xPlayer,xTarget,reason,length)
            cb(true)
        else logUnfairUse(xPlayer); cb(false) end
    end)

    ESX.RegisterServerCallback("el_bwh:warn",function(source,cb,target,message,anon)
        if not target or not message then return end
        local xPlayer = ESX.GetPlayerFromId(source)
        local xTarget = ESX.GetPlayerFromId(target)
        if not xPlayer or not xTarget then cb(nil); return end
        if isAdmin(xPlayer) then
            warnPlayer(xPlayer,xTarget,message,anon)
            cb(true)
        else logUnfairUse(xPlayer); cb(false) end
    end)

    ESX.RegisterServerCallback("el_bwh:getWarnList",function(source,cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        if isAdmin(xPlayer) then
            local warnlist,namecache = {},{}
            for k,v in ipairs(MySQL.Sync.fetchAll("SELECT * FROM bwh_warnings")) do
                if namecache[v.sender]==nil then namecache[v.sender] = MySQL.Sync.fetchScalar("SELECT name FROM users WHERE identifier=@id",{["@id"]=v.sender}) end -- my shot at optimalization of db queries
                v["sender_name"]=namecache[v.sender]
                table.insert(warnlist,v)
            end
            cb(json.encode(warnlist))
        else logUnfairUse(xPlayer); cb(false) end
    end)

    ESX.RegisterServerCallback("el_bwh:getBanList",function(source,cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        if isAdmin(xPlayer) then
            local banlist,namecache = {},{}
            for k,v in ipairs(MySQL.Sync.fetchAll("SELECT * FROM bwh_bans")) do
                if namecache[v.sender]==nil then namecache[v.sender] = MySQL.Sync.fetchScalar("SELECT name FROM users WHERE identifier=@id",{["@id"]=v.sender}) end -- my shot at optimalization of db queries
                v["sender_name"]=namecache[v.sender]
                table.insert(banlist,v)
            end
            cb(json.encode(banlist))
        else logUnfairUse(xPlayer); cb(false) end
    end)

    ESX.RegisterServerCallback("el_bwh:unban",function(source,cb,id)
        local xPlayer = ESX.GetPlayerFromId(source)
        if isAdmin(xPlayer) then
            MySQL.Async.execute("DELETE FROM bwh_bans WHERE id=@id",{["@id"]=id},function(rc)
                for k,v in ipairs(bancache) do
                    if v.id==id then table.remove(bancache,k); break end
                end
                cb(rc>0)
            end)
        else logUnfairUse(xPlayer); cb(false) end
    end)
end)

AddEventHandler("playerConnecting",function(name, setKick, def)
    local banned, data = isBanned(GetPlayerIdentifiers(source))
    if banned then
        print(("Banned player %s (%s) tried to join, their ban expires on %s (Ban ID: #%s)"):format(GetPlayerName(source),data.receiver[1],os.date("%Y-%m-%d %H:%M:%S",data.length),data.id))
        def.done(Config.banformat:format(data.reason,os.date("%Y-%m-%d %H:%M:%S",data.length),data.sender_name,data.id))
    end
end)

AddEventHandler("playerDropped",function(reason)
    if open_assists[source] then open_assists[source]=nil end
    for k,v in ipairs(active_assists) do
        if v==source then
            active_assists[k]=nil
            TriggerClientEvent("chat:addMessage",k,{color={255,0,0},multiline=false,args={"BWH","The admin that was helping you dropped from the server"}})
            return
        elseif k==source then
            TriggerClientEvent("el_bwh:assistDone",v)
            TriggerClientEvent("chat:addMessage",v,{color={255,0,0},multiline=false,args={"BWH","The player you were helping dropped from the server, teleporting back..."}})
            active_assists[k]=nil
            return
        end
    end
end)

function refreshBanCache()
    bancache={}
    local namecache = {}
    for k,v in ipairs(MySQL.Sync.fetchAll("SELECT id,receiver,sender,reason,UNIX_TIMESTAMP(length) AS length FROM bwh_bans")) do
        if namecache[v.sender]==nil then namecache[v.sender] = MySQL.Sync.fetchScalar("SELECT name FROM users WHERE identifier=@id",{["@id"]=v.sender}) end -- my shot at optimalization of db queries
        table.insert(bancache,{id=v.id,sender=v.sender,sender_name=namecache[v.sender],receiver=json.decode(v.receiver),reason=v.reason,length=v.length})
    end
end

function logAdmin(msg)
    for k,v in ipairs(ESX.GetPlayers()) do
        if isAdmin(ESX.GetPlayerFromId(v)) then
            TriggerClientEvent("chat:addMessage",v,{color={255,0,0},multiline=false,args={"BWH",msg}})
        end
    end
end

function isBanned(identifiers)
    for _,ban in ipairs(bancache) do
        if ban.length>os.time() then
            for _,bid in ipairs(ban.receiver) do
                for _,pid in ipairs(identifiers) do
                    if bid==pid then return true, ban end
                end
            end
        end
    end
    return false, nil
end

function isAdmin(xPlayer)
    local admin = false
    for k,v in ipairs(Config.admin_groups) do
        if xPlayer.getGroup()==v then return true end
    end
    return xPlayer.getPermissions()>=Config.admin_level
end

function execOnAdmins(func)
    local ac = 0
    for k,v in ipairs(ESX.GetPlayers()) do
        if isAdmin(ESX.GetPlayerFromId(v)) then
            ac = ac + 1
            func(v)
        end
    end
    return ac
end

function logUnfairUse(xPlayer)
    if not xPlayer then return end
    print((GetCurrentResourceName()..": Player %s (%s) tried to use an admin feature"):format(xPlayer.getName(),xPlayer.identifier))
    logAdmin(("Player %s (%s) tried to use an admin feature"):format(xPlayer.getName(),xPlayer.identifier))
end

function banPlayer(xPlayer,xTarget,reason,length)
    MySQL.Async.execute("INSERT INTO bwh_bans(id,receiver,sender,length,reason) VALUES(NULL,@receiver,@sender,@length,@reason)",{["@receiver"]=json.encode(GetPlayerIdentifiers(xTarget.source)),["@sender"]=xPlayer.identifier,["@length"]=length,["@reason"]=reason},function(_)
        local banid = MySQL.Sync.fetchScalar("SELECT MAX(id) FROM bwh_bans")
        logAdmin(("Player %s (%s) got banned by %s, expiration: %s, reason: '%s'"):format(xTarget.getName(),xTarget.identifier,xPlayer.getName(),length,reason))
        table.insert(bancache,{id=banid==nil and "1" or banid,sender=xPlayer.identifier,reason=reason,sender_name=xPlayer.getName(),receiver=GetPlayerIdentifiers(xTarget.source),length=MySQL.Sync.fetchScalar("SELECT UNIX_TIMESTAMP(@date)",{["@date"]=length})})
        DropPlayer(xTarget.source,Config.banformat:format(reason,length,xPlayer.getName(),banid==nil and "1" or banid))
    end)
end

function warnPlayer(xPlayer,xTarget,message,anon)
    MySQL.Async.execute("INSERT INTO bwh_warnings(id,receiver,sender,message) VALUES(NULL,@receiver,@sender,@message)",{["@receiver"]=xTarget.identifier,["@sender"]=xPlayer.identifier,["@message"]=message})
    TriggerClientEvent("el_bwh:receiveWarn",xTarget.source,anon and "" or xPlayer.getName(),message)
    logAdmin(("Admin ^1%s^7 warned ^1%s^7 (%s), Message: '%s'"):format(xPlayer.getName(),xTarget.getName(),xTarget.identifier,message))
end

TriggerEvent('es:addCommand', 'assist', function(source, args, user)
    if not open_assists[source] and not active_assists[source] then
        local ac = execOnAdmins(function(admin) TriggerClientEvent("el_bwh:requestedAssist",admin,source); TriggerClientEvent("chat:addMessage",admin,{color={0,255,255},multiline=Config.chatassistformat:find("\n")~=nil,args={"BWH",Config.chatassistformat:format(GetPlayerName(source),source)}}) end)
        if ac>0 then
            open_assists[source]=true
            Citizen.SetTimeout(120000,function()
                if open_assists[source] then open_assists[source]=nil end
            end)
            TriggerClientEvent("chat:addMessage",source,{color={0,255,0},multiline=false,args={"BWH","Assist request sent (expires in 120s), write ^1/cassist^7 to cancel your request"}})
        else
            TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","There's no admins on the server"}})
        end
    else
        TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","Someone is already helping your or you already have a pending assist request"}})
    end
end)

TriggerEvent('es:addCommand', 'cassist', function(source, args, user)
    if open_assists[source] then
        open_assists[source]=nil
        TriggerClientEvent("chat:addMessage",source,{color={0,255,0},multiline=false,args={"BWH","Your request was successfuly cancelled"}})
        execOnAdmins(function(admin) TriggerClientEvent("el_bwh:hideAssistPopup",admin) end)
    else
        TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","You don't have any pending help requests"}})
    end
end)

TriggerEvent('es:addCommand', 'finassist', function(source, args, user)
    local xPlayer = ESX.GetPlayerFromId(source)
    if isAdmin(xPlayer) then
        local found = false
        for k,v in pairs(active_assists) do
            if v==source then
                found = true
                active_assists[k]=nil
                TriggerClientEvent("chat:addMessage",source,{color={0,255,0},multiline=false,args={"BWH","Assist closed, teleporting back"}})
                TriggerClientEvent("el_bwh:assistDone",source)
            end
        end
        if not found then TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","You're not helping anyone"}}) end
    else
        TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","You don't have permissions to use this command!"}})
    end
end)

TriggerEvent('es:addCommand', 'bwh', function(source, args, user)
    local xPlayer = ESX.GetPlayerFromId(source)
    if isAdmin(xPlayer) then
        if args[1]=="ban" or args[1]=="warn" or args[1]=="warnlist" or args[1]=="banlist" then
            TriggerClientEvent("el_bwh:showWindow",source,args[1])
        elseif args[1]=="refresh" then
            TriggerClientEvent("chat:addMessage",source,{color={0,255,0},multiline=false,args={"BWH","Refreshing ban cache..."}})
            refreshBanCache()
        else
            TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","Invalid sub-command! (^4ban^7,^4warn^7,^4banlist^7,^4warnlist^7,^4refresh^7)"}})
        end
    else
        TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","You don't have permissions to use this command!"}})
    end
end)

TriggerEvent('es:addCommand', 'accassist', function(source, args, user)
    local xPlayer = ESX.GetPlayerFromId(source)
    local target = tonumber(args[1])
    if isAdmin(xPlayer) then
        for k,v in pairs(active_assists) do
            if v==source then
                TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","You're already helping someone"}})
                return
            end
        end
        if open_assists[target] and not active_assists[target] then
            open_assists[target]=nil
            active_assists[target]=source
            TriggerClientEvent("el_bwh:acceptedAssist",source,target)
            TriggerClientEvent("el_bwh:hideAssistPopup",source)
            TriggerClientEvent("chat:addMessage",source,{color={0,255,0},multiline=false,args={"BWH","Teleporting to player..."}})
        elseif not open_assists[target] and active_assists[target] and active_assists[target]~=source then
            TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","Someone is already helping this player"}})
        else
            TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","Player with that id did not request help"}})
        end
    else
        TriggerClientEvent("chat:addMessage",source,{color={255,0,0},multiline=false,args={"BWH","You don't have permissions to use this command!"}})
    end
end)