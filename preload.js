const { contextBridge, ipcRenderer } = require("electron");
const Database = require("./js/database.js");

const db = new Database();

contextBridge.exposeInMainWorld('db', {
    getAlbum: (artist, title) => db.selectAlbum(artist, title),
    getAllAlbums: () => db.selectAllAlbums(),
    addAlbum: (artist, title, cover) => db.insertAlbum(artist, title, cover),
    coverFromImage: (path) => Database.coverFromImage(path),
    test: () => db.test()
});

ipcRenderer.on('close-db', async () => {
    try {
        db.close();
        ipcRenderer.send('db-closed');
    } catch (error) {
        console.error('Error while closing the database: ', error);
    }
});
