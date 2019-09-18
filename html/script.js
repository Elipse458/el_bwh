var reqhidetimeout;

function toggle(window, state) {
    $(".hideable").hide();
    if (window !== undefined && state)
        $("#" + window).show();
}

function searchList(w, input) {
    $("#" + w + " > table > tbody > tr").each(function(a) {
        if (!input.trim()) {
            $(this).show();
        } else {
            var show = false;
            $(this).children().each(function(b) {
                if (show) return;
                show = $(this).text().toLowerCase().indexOf(input.toLowerCase()) !== -1;
            });
            if (show)
                $(this).show();
            else
                $(this).hide();
        }
    });
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.addMonths = function(months) {
    var date = new Date(this.valueOf());
    date.setMonth(date.getMonth() + months);
    return date;
}

$("#banbtn").click(function() {
    var offline = $("#ban > #offban").is(":checked");
    var target = offline ? $("#ban > #offtarget").val() : $("#ban > select[name=target]").val(),
        reason = $("#ban > input[name=reason]").val(),
        length = $("#ban > input[name=length]").val();
    if (target == 0 || target == "" || reason == "" || length == "") {
        alert("one or more required fields are left empty");
    } else {
        alert(offline);
        $.post("http://el_bwh/ban", JSON.stringify({ target: target, reason: reason, length: length, offline: offline }));
    }
});

$("#bandaybtn").click(function() { $("#datepicker").val(new Date().addDays(1).format("Y/m/d H:i")); });
$("#banweekbtn").click(function() { $("#datepicker").val(new Date().addDays(7).format("Y/m/d H:i")); });
$("#banmonthbtn").click(function() { $("#datepicker").val(new Date().addMonths(1).format("Y/m/d H:i")); });
$("#bansixmonthsbtn").click(function() { $("#datepicker").val(new Date().addMonths(6).format("Y/m/d H:i")); });

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

$("#bansearch").on("input", function() {
    searchList("banlist", $(this).val());
});

$("#warnsearch").on("input", function() {
    searchList("warnlist", $(this).val());
});

$("#offban").change(function() {
    if ($("#offban").is(":checked")) {
        $("#ban > #offtarget").show();
        $("#ban > #targetsel").hide();
    } else {
        $("#ban > #offtarget").hide();
        $("#ban > #targetsel").show();
    }
});

$("body").on("click", "#unbanbtn", function() {
    $.post("http://el_bwh/unban", JSON.stringify({ id: $(this).data("id") }));
    $($($(this).parent()).parent()).remove();
});

$(function() {
    $("#datepicker").datetimepicker({ theme: "dark", minDate: 0, minTime: 0, dayOfWeekStart: 1, parentID: "#ban" });

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