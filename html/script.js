var reqhidetimeout;

function toggle(window, state) {
    $(".hideable").hide();
    if (window !== undefined && state)
        $("#" + window).show();
}

$("#banbtn").click(function() {
    var target = $("#ban > select[name=target]").val(),
        reason = $("#ban > input[name=reason]").val(),
        length = $("#ban > input[name=length]").val();
    if (target == 0 || target == "" || reason == "" || length == "") {
        alert("one or more required fields are left empty");
    } else {
        $.post("http://el_bwh/ban", JSON.stringify({ target: target, reason: reason, length: length }));
    }
});

$("#warnbtn").click(function() {
    var target = $("#warn > select[name=target]").val(),
        message = $("#warn > input[name=message]").val(),
        anon = $("#warn > div > input[name=anon]").is(":checked");
    if (target == 0 || target == "" || message == "") {
        alert("one or more required fields are left empty");
    } else {
        $.post("http://el_bwh/warn", JSON.stringify({ target: target, message: message, anon: anon }));
    }
});

$("body").on("click", "#unbanbtn", function() {
    $.post("http://el_bwh/unban", JSON.stringify({ id: $(this).data("id") }));
    $($($(this).parent()).parent()).remove();
});

$(function() {
    $("#datepicker").datetimepicker();

    document.onkeyup = function(data) {
        if (data.which == 27) {
            toggle();
            $.post("http://el_bwh/hidecursor", JSON.stringify({}));
        }
    };

    window.addEventListener('message', function(event) {
        if (event.data.show) {
            toggle(event.data.window, true);
            if (event.data.window == "ban" || event.data.window == "warn") {
                $("#" + event.data.window + " > #targetsel").empty();
                $.each(JSON.parse(event.data.players), function(k, v) {
                    $("#" + event.data.window + " > #targetsel").append($("<option>", { value: k, html: k + " - " + v }));
                });
            } else if (event.data.window == "banlist") {
                $("#banlist > table > tbody").empty();
                $.each(JSON.parse(event.data.list), function(i, item) {
                    var expired = item.length < Date.now();
                    $("<tr" + (expired ? " class='text-muted'" : "") + ">").append(
                        $("<td>").text(item.id),
                        $("<td>").text(item.sender_name + " (" + item.sender + ")"),
                        $("<td>").text(JSON.parse(item.receiver).join(",\n")),
                        $("<td>").text(item.reason),
                        $("<td>").text(new Date(item.length).format("Y/m/d H:i:s") + (expired ? " (expired)" : "")),
                        $("<td>").html(expired ? "None" : '<a id="unbanbtn" class="text-success" data-id="' + item.id + '">Unban</a>')
                    ).appendTo("#banlist > table > tbody");
                });
            } else if (event.data.window == "warnlist") {
                $("#warnlist > table > tbody").empty();
                $.each(JSON.parse(event.data.list), function(i, item) {
                    $("<tr>").append(
                        $("<td>").text(item.id),
                        $("<td>").text(item.sender_name + " (" + item.sender + ")"),
                        $("<td>").text(item.receiver),
                        $("<td>").text(item.message)
                    ).appendTo("#warnlist > table > tbody");
                });
            } else if (event.data.window == "assistreq") {
                if (reqhidetimeout !== undefined) {
                    clearTimeout(reqhidetimeout);
                    reqhidetimeout = undefined;
                }
                $("#assistreq").html(event.data.data);
                $("#assistreq").show();
                reqhidetimeout = setTimeout(function() {
                    $("#assistreq").hide();
                }, 120000);
            }
        } else if (event.data.hide) {
            toggle();
        }
    });
});