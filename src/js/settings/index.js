const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function startRustServer() {
    console.log("Starting Rust server...");
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
        console.log("Node.js environment detected. Node version:", process.version);
        const extensionRoot = getExtensionRootPath();
        console.log('Extension root path:', extensionRoot);

        // Decode the URI and remove 'file:' for Windows paths
        let decodedPath = decodeURIComponent(extensionRoot.replace(/^file:[/\\]*/, '')); // Remove 'file:' and any leading slashes or backslashes
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

        // Check if the Rust executable exists
        if (!fs.existsSync(rustExecutablePath)) {
            console.error(`Rust executable not found at ${rustExecutablePath}`);
            return;
        }

        const child = spawn(rustExecutablePath, [], {
            cwd: path.dirname(rustExecutablePath),
            env: {...process.env, RUST_BACKTRACE: '1'},
            stdio: ['inherit', 'pipe', 'pipe']
        });

        child.stdout.on('data', (data) => {
            console.log(`Rust server stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`Rust server stderr: ${data}`);
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
