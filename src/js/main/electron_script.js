const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Ensuring preload.js is correctly loaded
            contextIsolation: true, // Security: isolates context to protect against prototype pollution
            nodeIntegration: false,  // Security: disables node integration in renderer process
        },
    });

    mainWindow.loadURL('http://localhost:3000'); // Load your React app

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') { // On macOS, it's common to keep apps open until explicitly closed
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('execute-premiere-script', (event, { script, args }) => {
    console.log(`Received request to execute script: ${script} with args: ${args.join(' ')}`);
    const scriptPath = path.join(__dirname, script);
    const command = `osascript ${scriptPath} ${args.join(' ')}`;
    
    execFile(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return;
        }
        console.log(`Script executed: ${stdout}`);
    });
});

