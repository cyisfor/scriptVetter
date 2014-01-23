var data = require("sdk/self").data;
var store = require("sdk/simple-storage").storage;
var Panel = require("sdk/panel").Panel;
var Request = require("sdk/request").Request;
var Widget = require("sdk/widget").Widget;
var URL = require("sdk/url").URL;
var windows = require("sdk/windows").browserWindows;
var derp = require("sdk/window/utils");

var sha3 = require("sha3").sha3;

if(!store.allowed) {
    store.allowed = new Object();
}

/* Disable all scripts with option to re-enable later if they check out. */
function findScripts(current,addRow) {
    var scripts = current.getElementsByTagName('script');
    for(var i=0;i<scripts.length;++i) {
        /* just assume the language is javascript for now */
        var script = scripts[i];
        console.log("found script",i);
        var src = script.getAttribute('src');
        if (src.indexOf('chrome:')==0) {
            continue;
        }
        if (src) {
            console.log('src der',src);
            script.removeAttribute('src'); // don't want this firing while we wait!
            Request({
                url: URL(src,current.location),
                onComplete: function(response) {
                    var id = sha3(response.text);
                    var enabled = store.allowed[id];
                    function reEnable() {
                        script.setAttribute('src',src);
                    }
                    if (enabled) {
                        reEnable();
                    }
                    addRow(id,src,response.text.substr(0,20),enabled,reEnable);
                }
            });
        } else {
            var content = script.innerHTML;
            script.innerHTML = "";
            if (content) {
                console.log('content der',content);
                var id = sha3(content);
                var enabled = store.allowed[id];
                function reEnable() {
                    script.innerHTML = content;
                }
                if (enabled) {
                    reEnable();
                }
                addRow(id,src,content.substr(0,20),enabled,reEnable);
            }
        }
    }
}
                    
var panel = Panel({
    width: 640,
    height: 480,
    contentURL: data.url("config.html"),
    contentScriptFile: data.url("update.js")
});

panel.on("show",function() {
    panel.port.emit("show");
});

/* what tabs each script has */
var tabscripts = new Object();
// SIGH...
var scriptabs = new Object();

function aset(a,i,o) {
    var test = a[i];
    if(!test) {
        test = new Array();
        a[i] = test;
    }
    test.append(o);
}

function cleanout(tab) {
    var st = scriptabs[tab];
    if(st) {
        st.forEach(function (id) {
            var ts = tabscripts[id];
            ts.remove(tab);
        });
        if (ts.length == 0) {
            delete tabscripts[id];
        }
        delete scriptabs[tab];
    }
}

tabs.on('ready',function(tab) {
    cleanout(tab);
    tab.attach({
        contentScriptFile: data.url("findScripts.js")
    });
    tab.port.on("found",function(url,source,which) {
        var id = sha3(source);
        var enabled = store.allowed[id]
        if(enabled) {
            tab.port.emit("re-enable",which);
        } else {
            /* not allowed... remember this tab for future re-enabling */
            aset(tabscripts,id,[tab,which]);
        }
        aset(scriptabs,tab,[id,url,source,enabled]);
    });
});

tabs.on('close',function(tab) {
    cleanout(tab);
});

panel.port.on("state-changed", function(id, which, enabled) {
    if(enabled) {
        store.allowed[id] = true;
        var ts = tabscripts[id];
        if(ts) {
            ts.forEach(function (derp) {
                var tab = derp[0];
                var which = derp[1];
                tab.port.emit("re-enable",which);
            });
        }
    } else {
        delete store.allowed[id];
    }
});

var widget = Widget({
    id: "svetter-link",
    label: "Script Vetter",
    contentURL: data.url("icon.png"),
    onClick: function() {
        var current = tabs.activeTab;
        console.log("click for",current);
        panel.port.once("need-rows",function() {
            var rows = scriptabs[current];
            rows.forEach(function(row) {
                panel.port.emit("add-row",row[0],row.slice(1));
            });
        });
        panel.show();
    }
});
