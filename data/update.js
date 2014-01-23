(function() {

var template;
var T = document.createTextNode;
var E = document.createElement;

var template = document.getElementById('template');
var table = template.parentNode;
table.removeChild(template);
var odd = false;

self.port.on("show",function(e) {
    while(table.firstChild.nextSibling) {
        table.removeChild(table.firstChild.nextSibing);
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
