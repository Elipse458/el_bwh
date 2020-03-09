var reqhidetimeout, curwin, page;

function toggle(window, state) {
    $(".hideable").hide();
    if (window !== undefined && state) {
        $("#" + window).show();
        curwin = window;
    }
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

function toast(message) {
    $("#toastmsg").html(message);
    $(".toast").toast("show");
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
    var offline = $("#offbanc").is(":checked");
    var perm = $("#permbanc").is(":checked");
    var target = offline ? $("#ban > #offtarget").val() : $("#ban > select[name=target]").val(),
        reason = $("#ban > input[name=reason]").val(),
        length = $("#ban > input[name=length]").val();
    if (target == 0 || target == "" || reason == "" || (length == "" && !perm)) {
        toast("One or more required fields are left empty");
    } else {
        $.post(`http://${GetParentResourceName()}/ban`, JSON.stringify({ target: target, reason: reason, length: perm ? null : length, offline: offline }));
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
        toast("One or more required fields are left empty");
    } else {
        $.post(`http://${GetParentResourceName()}/warn`, JSON.stringify({ target: target, message: message, anon: anon }));
    }
});

$("#bansearch").on("input", function() {
    searchList("banlist", $(this).val());
});

$("#warnsearch").on("input", function() {
    searchList("warnlist", $(this).val());
});

$("#offbanc").change(function() {
    if ($("#offbanc").is(":checked")) {
        $("#ban > #offtarget").show();
        $("#ban > #targetsel").hide();
    } else {
        $("#ban > #offtarget").hide();
        $("#ban > #targetsel").show();
    }
});

$("#permbanc").change(function() {
    $("#datepicker, #bandaybtn, #banweekbtn, #banmonthbtn, #bansixmonthsbtn").prop("disabled", $("#permbanc").is(":checked"));
});

$("body").on("click", "#unbanbtn", function() {
    $.post(`http://${GetParentResourceName()}/unban`, JSON.stringify({ id: $(this).data("id") }));
    $(this).parent().parent().addClass("text-muted");
    var expiration = $($(this).parent().parent().find("#expire"));
    expiration.html(expiration.html() + " (unbanned)");
    $(this).parent().text("None");
});

$("body").on("click", ".page-link", function() {
    if (curwin != "banlist" && curwin != "warnlist" || $(this).hasClass("active")) return;
    page = $(this).data("page");
    $(".page-link").removeClass("active");
    $(this).addClass("active");
    $("#" + curwin + " > table > tbody").empty();
    $(".loader").show();
    if (curwin == "banlist") {
        $.post(`http://${GetParentResourceName()}/getListData`, JSON.stringify({ list: curwin, page: page }), function(data) {
            $(".loader").hide();
            if (data === undefined) return;
            $.each(JSON.parse(data), function(i, item) {
                var expired = (item.length > 0 && item.length < Date.now()) || item.unbanned,
                    receiver = JSON.parse(item.receiver);
                $("<tr" + (expired ? " class='text-muted'" : "") + ">").append(
                    $("<td>").text(item.id),
                    $("<td>").text((item.sender_name || "UNKNOWN") + " (" + item.sender + ")"),
                    $("<td>").html("<a data-toggle='collapse' data-target='#reccol" + i + "' aria-expanded='false'><span>" + (item.receiver_name || "UNKNOWN") + " (" + receiver[0] + ")</span> <i class='arrow'></i></a><br><div class='collapse' id='reccol" + i + "'>" + receiver.slice(1, receiver.length).join("<br>") + "</div>"),
                    $("<td>").text(item.reason),
                    $("<td id='expire'>").html((item.length == 0 ? "<span class='text-danger'>PERMANENT</span>" : new Date(item.length).format("Y/m/d H:i:s")) + (expired ? (item.unbanned ? " (unbanned)" : " (expired)") : "")),
                    $("<td>").html(expired ? "None" : '<a id="unbanbtn" class="text-success" data-id="' + item.id + '">Unban</a>')
                ).appendTo("#banlist > table > tbody");
            });
        });
    } else {
        $.post(`http://${GetParentResourceName()}/getListData`, JSON.stringify({ list: curwin, page: page }), function(data) {
            $(".loader").hide();
            if (data === undefined) return;
            $.each(JSON.parse(data), function(i, item) {
                $("<tr>").append(
                    $("<td>").text(item.id),
                    $("<td>").text((item.sender_name || "UNKNOWN") + " (" + item.sender + ")"),
                    $("<td>").text((item.receiver_name || "UNKNOWN") + " (" + item.receiver + ")"),
                    $("<td>").text(item.message)
                ).appendTo("#warnlist > table > tbody");
            });
        });
    }
});

$(function() {
    $(".toast").toast({ animation: true, autohide: true, delay: 5000 });
    $("#datepicker").datetimepicker({ theme: "dark", minDate: 0, minTime: 0, dayOfWeekStart: 1 });

    document.onkeyup = function(data) {
        if (data.which == 27) {
            toggle();
            $.post(`http://${GetParentResourceName()}/hidecursor`, JSON.stringify({}));
        }
    };

    window.addEventListener('message', function(event) {
        if (event.data.loading) {
            $(".pagination").empty();
            $("#banlist > table > tbody,#warnlist > table > tbody").empty();
            toggle(event.data.window, true);
            $(".loader").show();
        }
        if (event.data.show) {
            toggle(event.data.window, true);
            page = 1;
            $(".pagination").empty();
            $("#bansearch,#warnsearch").val("");
            if (event.data.window == "ban" || event.data.window == "warn") {
                $("#" + event.data.window + " > #targetsel").empty();
                $.each(JSON.parse(event.data.players), function(k, v) {
                    $("#" + event.data.window + " > #targetsel").append($("<option>", { value: k, html: k + " - " + v }));
                });
            } else if (event.data.window == "banlist") {
                $("#banlist > table > tbody").empty();
                for (i = 1; i < event.data.pages + 1; i++) {
                    $(".pagination").append('<li class="page-item"><a class="page-link bg-dark ' + (i == page ? "active" : "") + '" data-page="' + i + '">' + i + '</a></li>');
                }
                $.each(JSON.parse(event.data.list), function(i, item) {
                    var expired = (item.length > 0 && item.length < Date.now()) || item.unbanned,
                        receiver = JSON.parse(item.receiver);
                    $("<tr" + (expired ? " class='text-muted'" : "") + ">").append(
                        $("<td>").text(item.id),
                        $("<td>").text((item.sender_name || "UNKNOWN") + " (" + item.sender + ")"),
                        $("<td>").html("<a data-toggle='collapse' data-target='#reccol" + i + "' aria-expanded='false'><span>" + (item.receiver_name || "UNKNOWN") + " (" + receiver[0] + ")</span> <i class='arrow'></i></a><br><div class='collapse' id='reccol" + i + "'>" + receiver.slice(1, receiver.length).join("<br>") + "</div>"),
                        $("<td>").text(item.reason),
                        $("<td id='expire'>").html((item.length == 0 ? "<span class='text-danger'>PERMANENT</span>" : new Date(item.length).format("Y/m/d H:i:s")) + (expired ? (item.unbanned ? " (unbanned)" : " (expired)") : "")),
                        $("<td>").html(expired ? "None" : '<a id="unbanbtn" class="text-success" data-id="' + item.id + '">Unban</a>')
                    ).appendTo("#banlist > table > tbody");
                });
                $(".loader").hide();
            } else if (event.data.window == "warnlist") {
                $("#warnlist > table > tbody").empty();
                for (i = 1; i < event.data.pages + 1; i++) {
                    $(".pagination").append('<li class="page-item"><a class="page-link bg-dark ' + (i == page ? "active" : "") + '" data-page="' + i + '">' + i + '</a></li>');
                }
                $.each(JSON.parse(event.data.list), function(i, item) {
                    $("<tr>").append(
                        $("<td>").text(item.id),
                        $("<td>").text((item.sender_name || "UNKNOWN") + " (" + item.sender + ")"),
                        $("<td>").text((item.receiver_name || "UNKNOWN") + " (" + item.receiver + ")"),
                        $("<td>").text(item.message)
                    ).appendTo("#warnlist > table > tbody");
                });
                $(".loader").hide();
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