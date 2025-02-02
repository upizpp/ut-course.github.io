function readFile(url, doneCallback) {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = handleStateChange;
    xhr.open("GET", url, true);
    xhr.send();
    function handleStateChange() {
        if (xhr.readyState === 4) {
            doneCallback(xhr.status == 200 ? xhr.responseText : null);
        }
    }
}

function insertStr(soure, start, newStr) {
    return soure.slice(0, start) + newStr + soure.slice(start);
}

function highlight_word(text, keyword, color) {
    const Separators = [
        "%0D",
        ",",
        ".",
        ";",
        ":",
        "(",
        ")",
        "[",
        "]",
        "{",
        "}",
        "%3E",
        "%3C",
        ">",
        "/",
        "\\",
        '"',
        "'",
        "?",
        "<",
        ">",
        "-",
        "`",
        "~",
        "!",
        "@",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0",
        "=",
        "+",
        "\t",
        undefined,
    ];
    let temp = text.indexOf(keyword);
    let back = 0;
    let result = text;
    while (temp != -1) {
        if (
            !(
                (temp > 0 &&
                    temp < text.length &&
                    Separators.includes(encodeURI(text[temp - 1])) &&
                    Separators.includes(
                        encodeURI(text[temp + keyword.length])
                    )) ||
                temp == 0 ||
                temp == text.length ||
                temp + keyword.length == text.length
            )
        ) {
            temp = text.indexOf(keyword, temp + 1);
            continue;
        }

        let span = '<span style="color: ' + color + '">';
        let espan = "</span>";
        result = insertStr(result, temp + back, span);
        back += span.length;
        result = insertStr(result, temp + keyword.length + back, espan);
        back += espan.length;
        temp = text.indexOf(keyword, temp + 1);
    }
    return result;
}

function region(text, begin, end, color, end_offset = 0, escape = false) {
    let result = text;
    let back = 0;
    let flag = false;

    for (let i = 0; i < text.length; i++) {
        if (
            text.substr(i, begin.length) == begin ||
            text.substr(i, end.length) == end
        ) {
            flag = !flag;
            if (flag) {
                if (text.substr(i, begin.length) == begin) {
                    if (escape && text[i - 1] == "\\") {
                        flag = !flag;
                        continue;
                    }
                    let temp = '<span style="color: ' + color + '">';
                    result = insertStr(result, i + back, temp);
                    back += temp.length;
                } else {
                    flag = !flag;
                }
            } else {
                if (text.substr(i, end.length) == end) {
                    if (escape && text[i - 1] == "\\") {
                        flag = !flag;
                        continue;
                    }
                    let temp = "</span>";
                    result = insertStr(result, i + back + end_offset + 1, temp);
                    back += temp.length;
                } else {
                    flag = !flag;
                }
            }
        }
    }

    return result;
}

function highlight(text, ext) {
    let CodeKeywords1 = " ";
    let CodeKeywords2 = " ";
    let CodeKeywords3 = " ";
    let CodeKeywords4 = " ";
    const Keyword1 = "#fb8ac9";
    const Keyword2 = "#e2667a";
    const Keyword3 = "#42fdc0";
    const Keyword4 = "#89e5c6";

    let result = text;
    result = region(result, '"', '"', "#ffeca1", 0, true);
    result = region(result, "'", "'", "#ffeca1", 0, true);
    result = region(result, "func", "(", "#66e6ff", -1);
    result = region(result, "$", "<br>", "#64bd59", -1);
    //result = region(result, ".", "(", "#54adf7", -1);

    switch (ext.toLowerCase()) {
        case "lua":
            CodeKeywords1 =
                "break do else elseif end for function if repeat return then until while goto";
            CodeKeywords2 =
                "true false math print type tostring tonumber setmetatable pairs ipairs pcall xpcall load loadstring require error and or not local in assert";
            CodeKeywords3 = "number table string boolean";
            CodeKeywords4 =
                "math debugger coroutine io collectgarbage self os _G _VERSION";
            result = region(result, "--", "<br>", "#7e8189", -1);
            result = region(result, "--[[", "]]", "#7e8189", 1);
            break;
        case "gd":
            CodeKeywords1 =
                "return break do else elif for if while static rpc";
            CodeKeywords2 =
                "self as in str not and or null const onready var export true false print func class class_name extends enum";
            CodeKeywords3 = "Vector2 Vector3 Rect2 bool int float String";
            CodeKeywords4 = "";
            result = region(result, "#&nbsp;", "<br>", "#7e8189", -1);
            result = region(result, "class_name&nbsp;", "<br>", "#c7ffed", -1);
            result = region(result, "extends&nbsp;", "<br>", "#89f6d3", -1);
            break;
    }

    {
        if (CodeKeywords1 != "") {
            let keywords = CodeKeywords1.split(" ");
            for (let i = 0; i < keywords.length; i++) {
                result = highlight_word(result, keywords[i], Keyword1);
            }
        }
    }
    {
        if (CodeKeywords2 != "") {
            let keywords = CodeKeywords2.split(" ");
            for (let i = 0; i < keywords.length; i++) {
                result = highlight_word(result, keywords[i], Keyword2);
            }
        }
    }
    {
        if (CodeKeywords3 != "") {
            let keywords = CodeKeywords3.split(" ");
            for (let i = 0; i < keywords.length; i++) {
                result = highlight_word(result, keywords[i], Keyword3);
            }
        }
    }
    {
        if (CodeKeywords4 != "") {
            let keywords = CodeKeywords4.split(" ");
            for (let i = 0; i < keywords.length; i++) {
                result = highlight_word(result, keywords[i], Keyword4);
            }
        }
    }

    return result;
}

class CodeHighlight extends HTMLElement {
    constructor() {
        super();

        let failback = this.getAttribute("failback") || "File read error.";
        let url = this.getAttribute("src");
        let copyable = this.getAttribute("copyable") || "true";
        copyable = copyable == "true" ? true : false;
        let title_content = this.getAttribute("title");
        title_content = title_content == null ? url : title_content;

        let container = document.createElement("div");
        let copy_button;
        let copy_cache;
        let title;

        if (copyable) {
            copy_button = document.createElement("button");
            copy_cache = document.createElement("textarea");

            copy_cache.style.opacity = 0;

            copy_button.innerHTML = "复制";
            copy_button.className = "code_highlight_copy_button";
            copy_button.flag = false;

            copy_button.set_copyed = function() {
                let content = "已复制" + url + "的所有内容";
                copy_button.innerHTML = content;
                copy_button.style.width = content.length * 15 + "px";
                copy_cache.innerHTML = container.code;
                copy_button.flag = true;
                copy_cache.select();
                document.execCommand("Copy");
                copy_button.flag = false;
            };
            copy_button.back_normal = function() {
                if (copy_button.flag) return;

                copy_button.innerHTML = "复制";
                copy_button.style.width = "75px";
            };

            copy_button.onmouseover = function () {
                copy_button.innerHTML = "点击复制";
                copy_button.style.width = "100px";
            };
            copy_button.onmouseleave = function () {
                copy_button.back_normal()
            };

            copy_button.onclick = () => {
                if (copy_button.innerHTML != "点击复制" && copy_button.innerHTML != "复制") return;

                copy_button.set_copyed();
                setTimeout(() => {
                    copy_button.back_normal();
                }, 1000);
            };
            copy_button.onblur = () => {
                copy_button.back_normal();
            };
        } else {
            container.style.userSelect = "none";
        }
        if (title_content != ""){
            title = document.createElement("div");
            title.className = "code_highlight_title"
            title.innerHTML = title_content
        }

        container.className = "code_highlight_container notranslate";

        readFile(url, function (text) {
            if (text != null) {
                container.code = text;

                text = text.replaceAll(" ", "&nbsp;");
                text = text.replaceAll("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");

                let line_span =
                    "<span class=code_highlight_line_number>%d</span>";
                text = line_span + text;
                text = text.replaceAll("\n", "<br>" + line_span);

                let i = 1;
                let j = text.indexOf("%d");
                while (j != -1) {
                    text = text.replace("%d", i.toString());
                    j = text.indexOf("%d", j + 1);
                    i++;
                }

                text = highlight(text, url.substr(url.lastIndexOf(".") + 1));

                container.innerHTML = text;

                let spans = document.getElementsByClassName(
                    "code_highlight_line_number"
                );
                let max_length = 0;
                {
                    let l = spans.length;
                    while (l > 0) {
                        l = Math.floor(l / 10);
                        max_length++;
                    }
                }
                for (let i = 0; i < spans.length; i++) {
                    const element = spans[i];
                    element.style.userSelect = "none";
                    element.style.paddingRight =
                        (max_length - element.innerHTML.length) * 8.8 +
                        16.0 +
                        "px";
                }
            } else {
                container.innerHTML = failback;
            }
        });

        if (title_content != ""){
            this.appendChild(title)
        }
        this.appendChild(container);
        if (copyable) {
            this.appendChild(copy_button);
            this.appendChild(copy_cache);
        }
    }
}

window.onload = () => customElements.define("code-highlight", CodeHighlight);
function update_element(){
    customElements.define("code-highlight", CodeHighlight);
}
