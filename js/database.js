const fs = require("fs");
const initSqlJs = require("sql.js");
const sharp = require("sharp");

const dbName = "./db/albums.sqlite";

class Database {
    static initLock = false;

    constructor() {
        this.filebuffer = fs.readFileSync(dbName);
        this.db = null;
        this.initPromise = this.init(); // can be awaited to ensure init() has finished before doing something
    }

    // must be an independent method because the constructor cannot be async and await `initSqlJs()`
    async init() {
        let SQL = await initSqlJs();
        this.db = new SQL.Database(this.filebuffer);
        this.db.run("PRAGMA foreign_keys = ON");
    }

    async close() {
        await this.write();
        this.db.close();
        this.db = null;
    }

    static async coverFromImagePath(path) {
        return (
            await sharp(path)
            .resize({
                width: 400,
                height: 400,
                fit: sharp.fit.fill
            })
            .toBuffer()
        );
    }

    static async coverFromImageURL(url) {
        // Fetch image data from the URL
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Pass buffer to sharp for processing
        return await sharp(buffer)
            .resize({
                width: 400,
                height: 400,
                fit: sharp.fit.fill
            })
            .toBuffer();
    }

    // returns null if did not insert successfully
    async insertAlbum(artist, title, cover) {
        await this.initPromise;

        if (!artist || !title) {
            return null;
        }

        let existing = await this.selectAlbum(artist, title);
        if (existing) {
            await this.updateAlbum(existing["ID"], artist, title, cover);
            return existing["ID"];
        }

        const insertAlbumStmt = this.db.prepare(`
            INSERT INTO Albums(Artist, Title, Cover, DiscogsID)
            VALUES (?, ?, ?, ?)
        `);
        insertAlbumStmt.run([artist, title, cover, null]);
        insertAlbumStmt.free();
        let results = await this.selectAlbum(artist, title);

        if (results) {
            return results["ID"];
        }   

        return null;
    }

    async insertAlbumWithDiscogsID(artist, title, cover, discogsID) {
        await this.initPromise;

        if (!artist || !title) {
            return null;
        }

        let existing = await this.selectAlbum(artist, title);
        if (existing) {
            throw new Error("Album with artist/title already exists");
        }

        existing = await this.selectAlbumByDiscogsID(discogsID);
        if (existing) {
            throw new Error("Album with discogs ID already exists");
        }

        const insertAlbumStmt = this.db.prepare(`
            INSERT INTO Albums(Artist, Title, Cover, DiscogsID)
            VALUES (?, ?, ?, ?)
        `);
        insertAlbumStmt.run([artist, title, cover, discogsID]);
        insertAlbumStmt.free();
        let results = await this.selectAlbum(artist, title);

        if (results) {
            return results["ID"];
        }

        return null;
    }

    async updateAlbum(id, artist, title, cover) {
        await this.initPromise;

        const updateAlbumStmt = this.db.prepare(`
            UPDATE Albums
            SET Cover = ?, Artist = ?, Title = ?
            WHERE ID = ?
        `);
        
        updateAlbumStmt.run([cover, artist, title, id]);
        updateAlbumStmt.free();
    }

    async selectAlbum(artist, title) {
        await this.initPromise;

        const selectAlbumStmt = this.db.prepare(`
            SELECT *
            FROM Albums
            WHERE Artist = ? AND Title = ? 
        `);

        selectAlbumStmt.bind([artist, title]);
        selectAlbumStmt.step();
        let row = selectAlbumStmt.getAsObject();
        selectAlbumStmt.free();

        // if there are no rows returned, row.Artist is falsey
        if (!row.Artist) {
            return null;
        }
        else {
            return row;
        }
    }

    async selectAlbumByID(albumID) {
        await this.initPromise;

        const selectAlbumByIDStmt = this.db.prepare(`
            SELECT *
            FROM Albums
            WHERE ID = ?
        `);

        selectAlbumByIDStmt.bind([albumID]);
        selectAlbumByIDStmt.step();
        let row = selectAlbumByIDStmt.getAsObject();
        selectAlbumByIDStmt.free();

        // if there are no rows returned, row.Artist is falsey
        if (!row.Artist) {
            return null;
        }
        else {
            return row;
        }
    }

    async selectAlbumByDiscogsID(discogsID) {
        await this.initPromise;
    
        const selectAlbumByDiscogsIDStmt = this.db.prepare(`
            SELECT *
            FROM Albums
            WHERE DiscogsID = ?
        `);
        selectAlbumByDiscogsIDStmt.bind([discogsID]);
        selectAlbumByDiscogsIDStmt.step();
        let row = selectAlbumByDiscogsIDStmt.getAsObject();
        selectAlbumByDiscogsIDStmt.free();

        // if there are no rows returned, row.Artist is falsey
        if (!row.Artist) {  
            return null;
        }
        else {
            return row;
        }
    }

    async deleteAlbumByID(albumID) {
        await this.initPromise;

        const deleteAlbumByIDStmt = this.db.prepare(`
            DELETE
            FROM Albums
            WHERE ID = ?
        `);

        deleteAlbumByIDStmt.run([albumID]);
        deleteAlbumByIDStmt.free();
    }

    async selectAllAlbums() {
        await this.initPromise;

        const selectAllAlbumsStmt = this.db.prepare(`
            SELECT *
            FROM Albums
        `);

        let rows = [];
        while (selectAllAlbumsStmt.step()) {
            rows.push(selectAllAlbumsStmt.getAsObject());
        }

        selectAllAlbumsStmt.free();

        return rows;
    }

    async removeTracks(albumID) {
        const removeTracksStmt = this.db.prepare(`
            DELETE
            FROM Tracks
            WHERE AlbumID = ?
        `);
        removeTracksStmt.run([albumID]);
        removeTracksStmt.free();
    }

    async addTracks(albumID, tracks) {
        let albumInfo = await this.selectAlbumByID(albumID);
        if (!albumInfo) {
            return;
        }

        const addTracksStmt = this.db.prepare(`
            INSERT INTO Tracks(AlbumID, TrackNum, Artist, Title, Length)
            VALUES (?, ?, ?, ?, ?)
        `);

        tracks.forEach(track => {
            const params = [
                albumID,
                track["num"],
                track["artist"] ? track["artist"] : albumInfo["Artist"],
                track["title"] ? track["title"] : `Track ${track["num"]}`,
                track["length"] ? track["length"] : 180
            ];

            addTracksStmt.run(params);
            addTracksStmt.reset();
        });
        addTracksStmt.free();
    }

    async getTracks(albumID) {
        await this.initPromise;

        const getTracksStmt = this.db.prepare(`
            SELECT Artist, Title, Length
            FROM Tracks
            WHERE AlbumID = ?
        `);
        getTracksStmt.bind([albumID]);

        let rows = [];
        while (getTracksStmt.step()) {
            rows.push(getTracksStmt.get());
        }

        getTracksStmt.free();

        return rows;
    }

    async getUser() {
        await this.initPromise;

        let rows = this.db.exec(`SELECT * FROM User`);
        return rows[0];
    }

    async setUser(name, profilePicture) {
        await this.initPromise;

        this.db.run(`DELETE FROM User`);
        const setUserStmt = this.db.prepare(`
            INSERT INTO User(Username, ProfilePicture)
            VALUES (?, ?)
        `);
        setUserStmt.run([name, profilePicture]);
        setUserStmt.free();
    }

    async removeUser() {
        await this.initPromise;

        this.db.run(`DELETE FROM User`);
    }

    async write() {
        await this.initPromise;

        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbName, buffer);
    }
    
    async createTables() {
        await this.initPromise;
        
        // TODO flyway scripts
        this.db.run(`
            CREATE TABLE Albums (
                ID          INTEGER PRIMARY KEY,
                Artist      TEXT,
                Title       TEXT,
                Cover       BLOB,
                DiscogsID   INTEGER 
            );
            CREATE TABLE Tracks (
                TrackNum    INTEGER,
                Artist      TEXT,
                Title       TEXT,
                Length      INTEGER,
                AlbumID     INTEGER,
                FOREIGN KEY(AlbumID) REFERENCES Albums(ID) ON DELETE CASCADE
            );
            CREATE TABLE User (
                Username        TEXT,
                ProfilePicture  BLOB
            );
        `);
    }
}

module.exports = Database;
