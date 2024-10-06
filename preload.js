const { contextBridge, ipcRenderer } = require("electron");
const Database = require("./js/database.js");
const LastFM = require("./js/lastfm.js");

const db = new Database();
const lastfm = new LastFM();

contextBridge.exposeInMainWorld('db', {
    getAlbum: (artist, title) => db.selectAlbum(artist, title),
    getAllAlbums: () => db.selectAllAlbums(),
    addAlbum: (artist, title, cover) => db.insertAlbum(artist, title, cover),
    coverFromImage: (path) => Database.coverFromImage(path),
    getUser: () => db.getUser(),
    setUser: (name, pfp) => db.setUser(name, pfp),
    removeUser: () => db.removeUser()
    // , test: () => db.test()
});

contextBridge.exposeInMainWorld('lastfm', {
    requestAuth: () => lastfm.requestAuth(),
    createSession: () => lastfm.createSession(),
    getAPIKey: () => lastfm.getAPIKey(),
    setAPIKey: (key) => lastfm.setAPIKey(key), 
    getAPISecret: () => lastfm.getAPISecret(),
    setAPISecret: (secret) => lastfm.setAPISecret(secret),
    getSessionKey: () => lastfm.getSessionKey(),
    isSession: () => lastfm.isSession(),
    endSession: () => lastfm.endSession()
});

ipcRenderer.on('close-db', async () => {
    try {
        db.close();
        ipcRenderer.send('db-closed');
    } catch (error) {
        console.error('Error while closing the database: ', error);
    }
});
