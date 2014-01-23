(function() {

var template;
var table;
var odd;
var T;
var E;
var header;

self.port.on("show",function(e) {
    if(!template) {
        T = document.createTextNode;
        E = document.createElement;

        header = document.getElementById('head');
        template = document.getElementById('template');
        table = template.parentNode;
        table.removeChild(template);
        odd = false;
    } else {
        table.innerHTML = "";
        table.appendChild(header);
    }
    var addRow = function(id, url, source, enabled) {
        var snippet = source.substr(0,20);
        var tr = template.cloneNode(true);
        if(odd) {
            tr.setAttribute('class','odd');
        } else {
            tr.setAttribute('class','even');
        }
        odd = !odd;
        tr.getElementById("id").appendChild(T(id));
        var a = E('a');
        a.setAttribute('href',url);
        a.appendChild(T(url));
        tr.getElementById("url").appendChild(a);
        tr.getElementById("snippet").appendChild(T(snippet));
        var check = tr.getElementById("enabled");
        check.checked = enabled;
        check.addEventListener('click',function(e) {
            self.port.emit('state-changed', id, [!check.checked]);
        });
        table.appendChild(tr);

    }
    self.port.on("add-row",addRow);
    self.port.emit("need-rows");
});
})();
