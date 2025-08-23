const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { hash } = require("node:crypto");
const migrateDatabase = require('./js/migrate');

let mainWindow;

const singleInstanceLock = app.requestSingleInstanceLock();

process.chdir(__dirname);

let startApplication = () => {
    const createWindow = () => {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            icon: path.join(__dirname, './img/icon.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                sandbox: false,
                // devTools: false,
                preload: path.join(__dirname, "preload.js")
            }
        });
        
        mainWindow.on("close", (event) => {
            event.preventDefault();
            
            mainWindow.webContents.send("close-db");
            ipcMain.once("db-closed", () => {
                mainWindow.destroy();
            });
        });
        
        mainWindow.loadFile(path.join(__dirname, "html/home.html"));
    };
    
    app.whenReady().then(() => {
        createWindow();
        
        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0)
                createWindow();
        });
    });

    app.on("second-instance", (event, argv, workingDirectory) => {
        // focus the existing window
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.focus();
        }
    });
    
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin")
            app.quit();
    });
    
    ipcMain.handle("fetchGET", async (event, url, _headers = {Accept: "application/json"}) => {
        const response = await fetch(url, {
            method: "GET",
            headers: _headers
        });

        const data = await response.json();
        
        return JSON.stringify(data);
    });

    ipcMain.handle("fetchPOST", async (event, url, params = "", _headers = {Accept: "application/json"}) => {
        const formBody = new URLSearchParams(params).toString();

        const response = await fetch(url, {
            method: "POST",
            headers: _headers,
            body: formBody
        });

        const data = await response.json();
        
        return JSON.stringify(data);
    });

    ipcMain.handle("md5", (event, content) => {
        return hash("md5", content, "hex");
    });
}

if (!singleInstanceLock) {
    app.quit();
} else {
    (async () => {
        await migrateDatabase();
        startApplication();
    })();
}
