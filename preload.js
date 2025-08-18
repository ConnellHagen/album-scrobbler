const { contextBridge, ipcRenderer } = require("electron");
const Database = require("./js/database.js");
const LastFM = require("./js/lastfm.js");
const Discogs = require("./js/discogs.js");

const db = new Database();
const lastfm = new LastFM();
const discogs = new Discogs();

contextBridge.exposeInMainWorld("db", {
    write: () => db.write(),
    getAlbum: (artist, title) => db.selectAlbum(artist, title),
    getAlbumByID: (albumID) => db.selectAlbumByID(albumID),
    deleteAlbumByID: (albumID) => db.deleteAlbumByID(albumID),
    getAllAlbums: () => db.selectAllAlbums(),
    addAlbum: (artist, title, cover) => db.insertAlbum(artist, title, cover),
    addAlbumWithDiscogsID: (artist, title, cover, discogsID) => db.insertAlbumWithDiscogsID(artist, title, cover, discogsID),
    updateAlbum: (albumID, artist, title, cover) => db.updateAlbum(albumID, artist, title, cover),
    coverFromImagePath: (path) => Database.coverFromImagePath(path),
    coverFromImageURL: (url) => Database.coverFromImageURL(url),
    getUser: () => db.getUser(),
    setUser: (name, pfp) => db.setUser(name, pfp),
    removeUser: () => db.removeUser(),
    clearTracks: (albumID) => db.removeTracks(albumID),
    getTracks: (albumID) => db.getTracks(albumID),
    addAlbumTracks: (albumID, tracks) => db.addTracks(albumID, tracks)
});

contextBridge.exposeInMainWorld("lastfm", {
    requestAuth: () => lastfm.requestAuth(),
    createSession: () => lastfm.createSession(),
    getAPIKey: () => lastfm.getAPIKey(),
    setAPIKey: (key) => lastfm.setAPIKey(key), 
    getAPISecret: () => lastfm.getAPISecret(),
    setAPISecret: (secret) => lastfm.setAPISecret(secret),
    getSessionKey: () => lastfm.getSessionKey(),
    isSession: () => lastfm.isSession(),
    endSession: () => lastfm.endSession(),
    sendScrobbles: (tracks, artists, albums, albumArtists, timestamps) => lastfm.sendScrobbles(tracks, artists, albums, albumArtists, timestamps),
    testSessionKeyValid: () => lastfm.testSessionKeyValid()
});

contextBridge.exposeInMainWorld("discogs", {
    getPersonalAccessToken: () => discogs.getPersonalAccessToken(),
    setPersonalAccessToken: (token) => discogs.setPersonalAccessToken(token),
    search: (query) => discogs.searchByQuery(query),
    getMaster: (masterId) => discogs.getMaster(masterId)
});

ipcRenderer.on("close-db", async () => {
    try {
        db.close();
        ipcRenderer.send("db-closed");
    } catch (error) {
        console.error("Error while closing the database: ", error);
    }
});
