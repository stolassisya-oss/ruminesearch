var data = [];
var query = "";
document.querySelector("form").onsubmit = function(e){e.preventDefault();}

// Для локального JSONL файла
var url = "forum_messages.jsonl"; // просто положи файл рядом с HTML

function IsJsonString(str) {
    try { JSON.parse(str); } catch (e) { return false; }
    return true;
}

function copyText(a) {
    var b = document.createElement('textarea');
    c = document.getSelection();
    b.textContent = a;
    document.body.appendChild(b);
    c.removeAllRanges();
    b.select();
    document.execCommand('copy');
    c.removeAllRanges();
    document.body.removeChild(b);
}

var permalink = document.querySelector("#permalink");
permalink.href = window.location.href;
permalink.onclick = function(e){
    e.preventDefault();
    copyText(window.location.href);
    document.querySelector("#error-text").innerHTML = "Permalink copied!";
    document.querySelector(".error-banner").style.display = "flex";
    document.querySelector(".error-banner").style.opacity = 1;
}

$(document).ready(function(){
    $.ajax({
        url: url,
        method: "GET",
        success: function(item){
            // Разбор JSONL
            var lines = item.split("\n");
            data = [];
            lines.forEach(function(line){
                if(line.trim() !== "" && IsJsonString(line)){
                    data.push(JSON.parse(line));
                }
            });

            if(data.length == 0){
                $("#error-text").html("ERROR: Database empty or invalid format");
                $(".error-banner").css("display", "flex");
                return;
            }

            $('#txt-search').removeAttr("readonly");
            $('#txt-search').focus();
            $('#entries').html(data.length);

            if (window.location.search.includes("q=")) {
                var params = new URLSearchParams(window.location.search);
                var query = params.get("q");
                performSearch(query);
                $('#txt-search').val(query);
            }
        },
        error: function(){
            $("#error-text").html("ERROR: Failed to load local database (forum_messages.jsonl)");
            $(".error-banner").css("display", "flex");
        }
    });

    $('#txt-search').keyup(function() {
        var searchField = $(this).val();
        var home = window.location.href.split("?")[0];
        permalink.href = home + "?q=" + encodeURIComponent(searchField);
        permalink.onclick = function(e){
            e.preventDefault();
            copyText(permalink.href);
            document.querySelector("#error-text").innerHTML = "Permalink copied!";
            document.querySelector(".error-banner").style.display = "flex";
            document.querySelector(".error-banner").style.opacity = 1;
        }
        performSearch(searchField);
    });
});

// Универсальная функция поиска и вывода
function performSearch(searchField){
    if(!searchField){
        $('#filter-records').html('');
        $('#results').html('');
        return;
    }

    var regexAll = searchField.slice(0,1) == "*" ? null : new RegExp(searchField, "i");
    var output = '<div class="row">';
    var count = 1;

    data.forEach(function(val){
        if(!regexAll || (val.author && val.author.search(regexAll) != -1) || (val.text && val.text.search(regexAll) != -1)){
            output += '<div class="col-md-6 well" style="margin-bottom:20px;">';
            output += '<div class="col-md-12">';
            output += '<h5 style="margin-bottom:5px;">' + val.author + '</h5>';
            output += '<p style="max-height:150px; overflow:auto; white-space:pre-wrap;">' + val.text + '</p>';
            if(val.date) output += '<small>' + val.date + '</small><br>';
            if(val.post_number) {
                output += '<a class="btn btn-sm btn-primary" style="margin-top:5px;" href="https://ru-minecraft.ru/forum/showtopic-15361/findpost-' + val.post_number + '/" target="_blank">Перейти к сообщению</a>';
            }
            output += '</div></div>';
            if(count % 2 == 0){
                output += '</div><div class="row">';
            }
            count++;
        }
    });

    output += '</div>';
    $('#results').html(count - 1 + " results");
    $('#filter-records').html(output);
}
