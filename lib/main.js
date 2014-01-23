var data = require("sdk/self").data;
var store = require("sdk/simple-storage").storage;
var Panel = require("sdk/panel").Panel;
var Request = require("sdk/request").Request;
var Widget = require("sdk/widget").Widget;
var URL = require("sdk/url").URL;
var tabs = require("sdk/tabs");

var sha3 = require("sha3").sha3;

if(!store.allowed) {
    store.allowed = new Object();
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

/* what scripts haven't enabled yet, indexed by tab,array */
var scriptsAwaiting = new Object();
/* what scripts each tab has */
var scriptsForTab = new Object();

/* a[i].append(o) but w/ default */
function aset(a,i,o) {
    var test = a[i];
    if(!test) {
        test = new Array();
        a[i] = test;
    }
    test.append(o);
}

function cleanout(tab) {
    var st = scriptsForTab[tab];
    if(st) {
        st.forEach(function (id) {
            var ts = scriptsAwaiting[id];
            ts.remove(tab);
        });
        if (ts.length == 0) {
            delete scriptsAwaiting[id];
        }
        delete scriptsForTab[tab];
    }
}

tabs.on('ready',function(tab) {
    console.log('er',tab)
    cleanout(tab);
    var port = tab.attach({
        contentScriptFile: data.url("findScripts.js")
    }).port;
    tab.on("ready",function() port.emit("ready"));
    port.on("found",function(url,source,which) {
        var id = sha3(source);
        var enabled = store.allowed[id]
        if(enabled) {
            port.emit("re-enable",which);
        } else {
            /* not allowed... remember this tab for future re-enabling */
            aset(scriptsAwaiting,id,[tab,which,port]);
        }
        aset(scriptsForTab,tab,[id,url,source,enabled]);
    });
});

tabs.on('close',function(tab) {
    cleanout(tab);
});

panel.port.on("state-changed", function(id, which, enabled) {
    if(enabled) {
        store.allowed[id] = true;
        var ts = scriptsAwaiting[id];
        if(ts) {
            ts.forEach(function (derp) {
                var tab = derp[0];
                var which = derp[1];
                var port = derp[2];
                port.emit("re-enable",which);
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
        panel.port.once("need-rows",function() {
            var rows = scriptsForTab[current];
            if(rows) {
                rows.forEach(function(row) {
                    panel.port.emit("add-row",row[0],row.slice(1));
                });
            }
        });
        panel.show();
    }
});
