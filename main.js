const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const db = require('./js/database.js');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    db.init();

    win.loadFile('html/collection.html');
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});

app.on('before-quit', () => {
    db.quit();
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});

