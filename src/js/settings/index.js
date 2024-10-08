const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let rustServerProcess = null;

function startRustServer() {
    console.log("Starting Rust server...");
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
        console.log("Node.js environment detected. Node version:", process.version);
        const extensionRoot = getExtensionRootPath();
        console.log('Extension root path:', extensionRoot);

        let decodedPath;
        if (process.platform === 'win32') {
            decodedPath = decodeURIComponent(extensionRoot.replace(/^file:[/\\]*/, ''));
        } else if (process.platform === 'darwin') {
            decodedPath = '/' + decodeURIComponent(extensionRoot.replace(/^file:\/\//, ''));
        } else {
            console.error(`Unsupported platform: ${process.platform}`);
            return;
        }
        console.log('Decoded Extension Root Path:', decodedPath);

        let rustExecutablePath;
        if (process.platform === 'win32') {
            rustExecutablePath = path.join(decodedPath, 'target', 'release', 'audio_importer.exe');
        } else if (process.platform === 'darwin') {
            rustExecutablePath = path.join(decodedPath, 'target', 'release', 'audio_importer');
        } else {
            console.error(`Unsupported platform: ${process.platform}`);
            return;
        }
        rustExecutablePath = path.normalize(rustExecutablePath);
        console.log('Corrected Rust executable path:', rustExecutablePath);

        if (!fs.existsSync(rustExecutablePath)) {
            console.error(`Rust executable not found at ${rustExecutablePath}`);
            return;
        }

        rustServerProcess = spawn(rustExecutablePath, [], {
            cwd: path.dirname(rustExecutablePath),
            env: {...process.env, RUST_BACKTRACE: '1'},
            stdio: ['inherit', 'pipe', 'pipe'],
            detached: false // Ensure the child process is not detached
        });

        rustServerProcess.stdout.on('data', (data) => {
            console.log(`Rust server stdout: ${data}`);
        });

        rustServerProcess.stderr.on('data', (data) => {
            console.error(`Rust server stderr: ${data}`);
        });

        rustServerProcess.on('error', (err) => {
            console.error(`Failed to start Rust server: ${err}`);
        });

        rustServerProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Rust server process exited with code ${code}`);
            } else {
                console.log('Rust server process exited successfully');
            }
            rustServerProcess = null;
        });
    } else {
        console.error('This script should only be run in a Node.js environment.');
    }
}

function stopRustServer() {
    if (rustServerProcess) {
        console.log("Stopping Rust server...");
        rustServerProcess.kill();
    }
}

function getExtensionRootPath() {
    if (typeof window !== 'undefined' && window.__adobe_cep__) {
        return window.__adobe_cep__.getSystemPath('extension');
    } else {
        // Fallback for development environment
        return process.cwd();
    }
}

console.log("Background script loaded. Starting Rust server...");
startRustServer();

// Handle extension shutdown
process.on('exit', stopRustServer);
process.on('SIGINT', stopRustServer);
process.on('SIGTERM', stopRustServer);

// For Windows, handle the SIGBREAK signal
if (process.platform === 'win32') {
    process.on('SIGBREAK', stopRustServer);
}

// If we're in the Adobe CEP environment, try to use its event system
if (typeof window !== 'undefined' && window.__adobe_cep__) {
    window.__adobe_cep__.addEventListener('com.adobe.csxs.events.ApplicationBeforeQuit', stopRustServer);
}