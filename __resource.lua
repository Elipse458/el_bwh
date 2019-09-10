resource_manifest_version '44febabe-d386-4d18-afbe-5e627f4af937'

files {
    "html/index.html",
    "html/script.js",
    "html/style.css",
    "html/jquery.datetimepicker.min.css",
    "html/jquery.datetimepicker.full.min.js",
    "html/date.format.js"
}
client_scripts {
    "config.lua",
    "client.lua"
}
server_scripts {
    "@mysql-async/lib/MySQL.lua",
    "config.lua",
    "server.lua"
}

ui_page "html/index.html"