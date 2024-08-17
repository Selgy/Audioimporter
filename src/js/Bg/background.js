const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ipcMain } = require('electron');

function startRustServer() {
    console.log("Starting Rust server...");
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
        console.log("Node.js environment detected. Node version:", process.version);

        // Use the specific path provided
        const rustExecutablePath = 'E:\\AudioImporter\\src\\target\\release\\audio_importer.exe';
        console.log('Rust executable path:', rustExecutablePath);

        // Check if the file exists
        if (!fs.existsSync(rustExecutablePath)) {
            console.error(`Rust executable not found at ${rustExecutablePath}`);
            return;
        }

        const child = spawn(rustExecutablePath, [], {
            cwd: path.dirname(rustExecutablePath), // Set working directory to executable's directory
            env: process.env,
            stdio: 'inherit',
        });

        child.on('error', (err) => {
            console.error(`Failed to start Rust server: ${err}`);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`Rust server process exited with code ${code}`);
            } else {
                console.log('Rust server process exited successfully');
            }
        });
    } else {
        console.error('This script should only be run in a Node.js environment.');
    }
}

console.log("Background script loaded. Starting Rust server...");
startRustServer();

ipcMain.on('import-audio', (event, { filePath, track }) => {
    console.log(`Importing audio: ${filePath} to track: ${track}`);
    executePremiereProScript(filePath, track);
});
function executePremiereProScript(filePath, track) {
    if (!filePath || isNaN(track)) {
        console.error("Invalid file path or track number.");
        return;
    }

    const script = `
        function importAudioToTrack(filePath, trackIndex) {
            app.project.rootItem;
            var activeSequence = app.project.activeSequence;
            var importResult = app.project.importFiles([filePath], 1, app.project.rootItem, false);
            var importedItem = app.project.rootItem.children[app.project.rootItem.children.numItems - 1];
            var audioTrack = activeSequence.audioTracks[trackIndex - 1];
            var time = activeSequence.getPlayerPosition();
            var newClip = audioTrack.insertClip(importedItem, time.seconds);
        }
        importAudioToTrack("${filePath.replace(/\\/g, '\\\\')}", ${track});
    `;

    window.__adobe_cep__.evalScript(script, (result) => {
        console.log(`Script executed with result: ${result}`);
    });
}

console.log("Background script loaded and listening for import-audio events.");
