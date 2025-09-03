const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
        icon: path.join(__dirname, 'app', 'frontend', 'assets', 'icons', 'app-icon.png'),
        show: false
    });

    // Start Python server (executable in production, script in development)
    startPythonServer();

    // Load the app
    mainWindow.loadURL('http://localhost:5000');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (pythonProcess) {
            pythonProcess.kill();
            pythonProcess = null;
        }
    });
}

function startPythonServer() {
    if (app.isPackaged) {
        // --- PRODUCTION MODE ---
        // Run the packaged executable
        const backendAppName = process.platform === 'win32' ? 'app.exe' : 'app';
        const executablePath = path.join(process.resourcesPath, 'app-backend', backendAppName);
        
        console.log(`Starting packaged backend at: ${executablePath}`);
        pythonProcess = spawn(executablePath, [], {
            cwd: path.dirname(executablePath)
        });

    } else {
        // --- DEVELOPMENT MODE ---
        // Run the Python script directly
        const pythonScript = path.join(__dirname, 'app', 'backend', 'app.py');
        const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';

        console.log(`Starting development backend with: ${pythonExecutable} ${pythonScript}`);
        pythonProcess = spawn(pythonExecutable, [pythonScript], {
            cwd: path.join(__dirname, 'app', 'backend'),
            stdio: 'pipe'
        });
    }


    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code !== 0 && mainWindow) {
            mainWindow.webContents.send('python-error', `Python server exited with code ${code}`);
        }
    });
    
    pythonProcess.on('error', (error) => {
        console.error('Failed to start Python server:', error);
        if (mainWindow) {
            mainWindow.webContents.send('python-error', `Failed to start Python server: ${error.message}`);
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handlers for communication with renderer process
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});
