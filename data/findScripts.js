var reEnablers = new Array();

self.on("re-enable",function(which) {
    reEnablers[which]();
});

document.addEventListener('DOMContentLoaded',function() {
    var scripts = document.getElementsByTagName('script');
    reEnablers = new Array(scripts.length);
    for(var which=0;which<scripts.length;++which) {
        /* just assume the language is javascript for now */
        var script = scripts[which];
        console.log("found script",which);
        var src = script.getAttribute('src');
        if (src) {
            if (src.indexOf('chrome:')==0) {
                continue;
            }
            console.log('src der',src);
            script.removeAttribute('src'); // don't want this firing while we wait!
            Request({
                url: URL(src,current.location),
                onComplete: function(response) {
                    reEnablers[which] = function() {
                        script.setAttribute('src',src);
                    }
                    self.port.emit("found",response.text,which);
                }
            });
        } else {
            var content = script.innerHTML;
            script.innerHTML = "";
            if (content) {
                self.port.emit("found",content,which);
            }
        }
    }
}
