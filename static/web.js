"use strict";

var samples = 2;

function send(path, data, callback) {
    var result = document.getElementById("result");

    result.textContent = "Running...";

    var request = new XMLHttpRequest();
    request.open("POST", path, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            var json;

            try {
                json = JSON.parse(request.response);
            } catch (e) {
                console.log("JSON.parse(): " + e);
            }

            if (request.status == 200) {
                callback(json);
            } else {
                result.textContent = "connection failure";
            }
        }
    }
    request.timeout = 10000;
    request.ontimeout = function() {
        result.textContent = "connection timed out"
    }
    request.send(JSON.stringify(data));
}

function evaluate(editor, result, code, lang, version, optimize) {
    send("/evaluate.json", {code: code, version: version, optimize: optimize, language: lang},
         function(object) {
             result.textContent = object['result'] || object['error'];
             editor.resize();

          /*
          var div = document.createElement("div");
          div.className = "message";
          div.textContent = "Program ended.";
          result.appendChild(div);
          */
    });
}

function compile(emit, result, code, version, optimize) {
    send("/compile.json", {emit: emit, code: code, version: version, optimize: optimize,
                           highlight: true},
         function(object) {
          if ("error" in object) {
              result.textContent = object["error"];
          } else {
              result.innerHTML = object["result"];
          }
    });
}

function format(result, session, version) {
    send("/format.json", {code: session.getValue(), version: version}, function(object) {
          if ("error" in object) {
              result.textContent = object["error"];
          } else {
              result.textContent = "";
              session.setValue(object["result"]);
          }
    });
}

function share(result, version, code) {
    var playurl = "https://play.rust-lang.org?code=" + encodeURIComponent(code);
    if (version != "master") {
        playurl += "&version=" + encodeURIComponent(version);
    }
    if (playurl.length > 5000) {
        result.textContent = "resulting URL above character limit for sharing. " +
            "Length: " + playurl.length + "; Maximum: 5000";
        return;
    }

    var url = "https://is.gd/create.php?format=json&url=" + encodeURIComponent(playurl);

    var request = new XMLHttpRequest();
    request.open("GET", url, true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {
                setResponse(JSON.parse(request.responseText)['shorturl']);
            } else {
                result.textContent = "connection failure";
            }
        }
    }

    request.send();

    function setResponse(shorturl) {
        while(result.firstChild) {
            result.removeChild(result.firstChild);
        }

        var link = document.createElement("a");
        link.href = link.textContent = shorturl;

        result.textContent = "short url: ";
        result.appendChild(link);
    }
}

function getQueryParameters() {
    var a = window.location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; i++) {
        var p = a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}

function set_keyboard(editor, mode) {
    if (mode == "Emacs") {
        editor.setKeyboardHandler("ace/keyboard/emacs");
    } else if (mode == "Vim") {
        editor.setKeyboardHandler("ace/keyboard/vim");
    } else {
        editor.setKeyboardHandler(null);
    }
}

function activate(editor, result, lang, no_exec) {
    var editor = ace.edit(editor);
    var session = editor.getSession();

    editor.setTheme("ace/theme/monokai");
    session.setMode("ace/mode/" + lang);

    function run() {
        evaluate(editor, result, session.getValue(), lang, 'master', '0');
    }

    if (!no_exec) {
        run();
    }

    function setFocused(f) {
        editor.setHighlightActiveLine(f);
        editor.setHighlightGutterLine(f);
        //editor.setReadOnly(!f);
    }

    setFocused(false);

    editor.on('focus', function() { setFocused(true); });
    editor.on('blur', function() { setFocused(false); });

    editor.commands.addCommand({
        name: "evaluate",
        exec: run,
        bindKey: {win: "Ctrl-Enter", mac: "Ctrl-Enter"}
    });
}

function init(lang, code, no_exec) {
    var editor = document.getElementById('editor');
    var result = document.getElementById('result');
    editor.textContent = code;
    activate(editor, result, lang, no_exec);
}
