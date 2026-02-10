// main.js — поддержка .jsonl через чанки на GitHub Pages
// Данные лежат в chunks/forum_messages_1.jsonl, forum_messages_2.jsonl и т.д.

var data = [];
var currentChunk = 1;
var loading = false;
var CHUNK_PATH = "chunks/forum_messages_"; // путь к чанкам
var totalChunksLoaded = 0;

// Утилиты
function isJsonLine(str){
    try { JSON.parse(str); return true; } catch(e){ return false; }
}
function escapeHtml(str){
    if(str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function escapeRegExp(s){
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function copyText(a){
    var b = document.createElement('textarea');
    b.value = a;
    document.body.appendChild(b);
    b.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(b);
}

// Переменные элементов
var $txtSearch = $('#txt-search');
var $entries = $('#entries');
var $results = $('#results');
var $filterRecords = $('#filter-records');
var $errorText = $('#error-text');
var $errorBanner = $('.error-banner');
var permalink = document.querySelector("#permalink");
if(permalink){
    permalink.href = window.location.href;
    permalink.onclick = function(e){
        e.preventDefault();
        copyText(window.location.href);
        $errorText && $errorText.html("Permalink copied!");
        $errorBanner && $errorBanner.css("display","flex").css("opacity",1);
    };
}

// Загрузка следующего чанка
function loadNextChunk(){
    if(loading) return;
    loading = true;

    $.ajax({
        url: CHUNK_PATH + currentChunk + ".jsonl",
        method: "GET",
        dataType: "text",
        success: function(text){
            var lines = text.split(/\r?\n/);
            lines.forEach(function(line){
                if(line.trim() !== "" && isJsonLine(line)){
                    try {
                        data.push(JSON.parse(line));
                    } catch(e){}
                }
            });
            totalChunksLoaded++;
            $entries && $entries.html(data.length);
            currentChunk++;
            loading = false;
        },
        error: function(){
            // Больше чанков нет — это нормально
            loading = false;
            console.log("Все чанки загружены");
        }
    });
}

// Переключение длинного текста
function toggleText(btn){
    var p = btn.closest('.message-card').querySelector('.message-text');
    if(!p) return;
    if(p.style.maxHeight && p.style.maxHeight !== "150px"){
        p.style.maxHeight = "150px";
        p.style.overflow = "auto";
        btn.innerText = "Показать больше";
    } else {
        p.style.maxHeight = "none";
        p.style.overflow = "visible";
        btn.innerText = "Свернуть";
    }
}

// Функция поиска и рендеринга
function performSearch(searchField){
    if(!searchField || String(searchField).trim() === ""){
        $filterRecords && $filterRecords.html('');
        $results && $results.html('');
        return;
    }

    searchField = String(searchField).trim();
    var showAll = searchField.slice(0,1) === "*";
    var regex = null;
    if(!showAll){
        try { regex = new RegExp(escapeRegExp(searchField), "i"); }
        catch(e){ regex = null; }
    }

    var out = '<div class="row">';
    var count = 0;

    data.forEach(function(val){
        var author = val && val.author ? String(val.author) : "";
        var text = val && val.text ? String(val.text) : "";
        var date = val && val.date ? String(val.date) : "";
        var post_number = val && (val.post_number || val.post_number === 0) ? val.post_number : "";

        var matches = showAll || (!regex ? false : ((author && author.search(regex) !== -1) || (text && text.search(regex) !== -1)));
        if(!showAll && regex === null){
            var needle = searchField.toLowerCase();
            matches = (author && author.toLowerCase().indexOf(needle) !== -1) || (text && text.toLowerCase().indexOf(needle) !== -1);
        }

        if(showAll || matches){
            count++;
            var safeAuthor = escapeHtml(author) || "—";
            var safeText = escapeHtml(text).replace(/\r?\n/g, "<br>");
            var safeDate = escapeHtml(date);

            out += '<div class="col-md-6 well message-card" style="margin-bottom:20px;">';
            out += '<div class="col-md-12">';
            out += '<h5 style="margin-bottom:5px;">' + safeAuthor + '</h5>';
            out += '<p class="message-text" style="max-height:150px; overflow:auto; white-space:pre-wrap; margin-bottom:6px;">' + safeText + '</p>';

            if(safeDate) out += '<small>' + safeDate + '</small><br>';
            if(post_number){
                var href = 'https://ru-minecraft.ru/forum/showtopic-15361/findpost-' + encodeURIComponent(post_number) + '/';
                out += '<a class="btn btn-sm btn-primary" style="margin-top:5px; margin-right:6px;" href="' + href + '" target="_blank" rel="noopener noreferrer">Перейти к сообщению</a>';
            }

            if(text && text.length > 300){
                out += '<button class="btn btn-sm btn-link" style="margin-top:6px; padding-left:0;" onclick="toggleText(this)">Показать больше</button>';
            }

            out += '</div></div>';
            if(count % 2 === 0){ out += '</div><div class="row">'; }
        }
    });

    out += '</div>';
    $results && $results.html(count + " results");
    $filterRecords && $filterRecords.html(out);
}

// Документ готов
$(document).ready(function(){
    loadNextChunk(); // грузим первый чанк

    $txtSearch && $txtSearch.removeAttr("readonly").focus();

    // Прокрутка вниз — подгрузка следующих чанков
    $(window).on("scroll", function(){
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 300){
            loadNextChunk();
        }
    });

    $txtSearch && $txtSearch.on('keyup', function(){
        var searchField = $(this).val();
        var home = window.location.href.split("?")[0];
        if(permalink) permalink.href = home + "?q=" + encodeURIComponent(searchField);
        performSearch(searchField);
    });

    // Если в URL есть ?q=... — подставляем и ищем
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if(q){ $txtSearch && $txtSearch.val(q); performSearch(q); }
});
