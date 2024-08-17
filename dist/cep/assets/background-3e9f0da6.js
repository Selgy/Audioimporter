import"./modulepreload-polyfill-3cfb730f.js";const c=require("ws"),i=new c.Server({port:8080});i.on("connection",e=>{console.log("WebSocket connection established"),e.on("message",o=>{const{filePath:t,track:r}=JSON.parse(o);console.log(`Importing audio: ${t} to track: ${r}`),a(t,r)})});function a(e,o){if(!e||isNaN(o)){console.error("Invalid file path or track number.");return}const t=`
        function importAudioToTrack(filePath, trackIndex) {
            app.project.rootItem;
            var activeSequence = app.project.activeSequence;
            var importResult = app.project.importFiles([filePath], 1, app.project.rootItem, false);
            var importedItem = app.project.rootItem.children[app.project.rootItem.children.numItems - 1];
            var audioTrack = activeSequence.audioTracks[trackIndex - 1];
            var time = activeSequence.getPlayerPosition();
            var newClip = audioTrack.insertClip(importedItem, time.seconds);
        }
        importAudioToTrack("${e.replace(/\\/g,"\\\\")}", ${o});
    `;console.log(`Executing script: ${t}`)}console.log("WebSocket server started, listening for import-audio messages.");
//# sourceMappingURL=background-3e9f0da6.js.map
