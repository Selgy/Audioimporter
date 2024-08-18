const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function startRustServer() {
    console.log("Starting Rust server...");
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
        console.log("Node.js environment detected. Node version:", process.version);

        // Use the specific path provided
        const rustExecutablePath = 'E:\\DEV\\AudioImporter\\src\\target\\release\\audio_importer.exe';
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

// Add any other background tasks or message listeners here