const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const db = require('./js/database.js');

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.on('close', (event) => {
        event.preventDefault();

        mainWindow.webContents.send('close-db');
        ipcMain.once('db-closed', () => {
            mainWindow.destroy();
        });
    });

    mainWindow.loadFile('html/home.html');
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
