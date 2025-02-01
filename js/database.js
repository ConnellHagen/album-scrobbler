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

        this.insertAlbumStmt = this.db.prepare(`
            INSERT INTO Albums(Artist, Title, Cover)
            VALUES (?, ?, ?)
        `);
        this.updateAlbumStmt = this.db.prepare(`
            UPDATE Albums
            SET Cover = ?, Artist = ?, Title = ?
            WHERE ID = ?
        `);
        this.selectAlbumStmt = this.db.prepare(`
            SELECT *
            FROM Albums
            WHERE Artist = ? AND Title = ? 
        `);
        this.selectAlbumByIDStmt = this.db.prepare(`
            SELECT *
            FROM Albums
            WHERE ID = ?
        `);
        this.deleteAlbumByIDStmt = this.db.prepare(`
            DELETE
            FROM Albums
            WHERE ID = ?
        `);
        this.selectAllAlbumsStmt = this.db.prepare(`
            SELECT *
            FROM Albums
        `);
        this.removeTracksStmt = this.db.prepare(`
            DELETE
            FROM Tracks
            WHERE AlbumID = ?
        `);
        this.addTracksStmt = this.db.prepare(`
            INSERT INTO Tracks(AlbumID, TrackNum, Artist, Title, Length)
            VALUES (?, ?, ?, ?, ?)
        `);
        this.getTracksStmt = this.db.prepare(`
            SELECT Artist, Title, Length
            FROM Tracks
            WHERE AlbumID = ?
        `);
        this.setUserStmt = this.db.prepare(`
            INSERT INTO User(Username, ProfilePicture)
            VALUES (?, ?)
        `);
    }

    async close() {
        await this.#write();
        this.db.close();
        this.db = null;
    }

    static async coverFromImage(path) {
        return (await sharp(path)
            .resize({
                width: 400,
                height: 400,
                fit: sharp.fit.fill
            })
            .toBuffer()
            .then(data => data)
        );
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

        this.insertAlbumStmt.run([artist, title, cover]);
        let results = await this.selectAlbum(artist, title);

        if (results) {
            return results["ID"];
        }   

        return null;
    }

    async updateAlbum(id, artist, title, cover) {
        await this.initPromise;
        
        this.updateAlbumStmt.run([cover, artist, title, id]);
    }

    async selectAlbum(artist, title) {
        await this.initPromise;

        this.selectAlbumStmt.bind([artist, title]);
        this.selectAlbumStmt.step();
        let row = this.selectAlbumStmt.getAsObject();
        this.selectAlbumStmt.reset();

        // if there are no rows returned, row.Artist is falsey
        if (!row.Artist) {
            return null;
        } else {
            return row;
        }
    }

    async selectAlbumByID(albumID) {
        await this.initPromise;

        this.selectAlbumByIDStmt.bind([albumID]);
        this.selectAlbumByIDStmt.step();
        let row = this.selectAlbumByIDStmt.getAsObject();
        this.selectAlbumByIDStmt.reset();

        // if there are no rows returned, row.Artist is falsey
        if (!row.Artist) {
            return null;
        } else {
            return row;
        }
    }

    async deleteAlbumByID(albumID) {
        await this.initPromise;

        this.deleteAlbumByIDStmt.run([albumID]);
    }

    async selectAllAlbums() {
        await this.initPromise;

        let rows = [];
        while (this.selectAllAlbumsStmt.step()) {
            rows.push(this.selectAllAlbumsStmt.getAsObject());
        }

        this.selectAllAlbumsStmt.reset();

        return rows;
    }

    async removeTracks(albumID) {
        this.removeTracksStmt.run([albumID]);
    }

    async addTracks(albumID, tracks) {
        let albumInfo = await this.selectAlbumByID(albumID);
        if (!albumInfo) {
            return;
        }

        tracks.forEach(track => {
            const params = [
                albumID,
                track["num"],
                track["artist"] ? track["artist"] : albumInfo["Artist"],
                track["title"] ? track["title"] : `Track ${track["num"]}`,
                track["length"] ? track["length"] : 180
            ];

            this.addTracksStmt.run(params);
        });
    }

    async getTracks(albumID) {
        await this.initPromise;

        this.getTracksStmt.bind([albumID]);

        let rows = [];
        while (this.getTracksStmt.step()) {
            rows.push(this.getTracksStmt.get());
        }

        this.selectAllAlbumsStmt.reset();

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
        this.setUserStmt.run([name, profilePicture]);
    }

    async removeUser() {
        await this.initPromise;

        this.db.run(`DELETE FROM User`);
    }

    async #write() {
        await this.initPromise;

        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbName, buffer);
    }
    
    async createTables() {
        await this.initPromise;
        
        this.db.run(`
            CREATE TABLE Albums (
                ID      INTEGER PRIMARY KEY,
                Artist  TEXT,
                Title   TEXT,
                Cover   BLOB
            );
            CREATE TABLE Tracks (
                TrackNum    INTEGER,
                Artist      TEXT,
                Title       TEXT,
                Length      INTEGER,
                AlbumID     INTEGER,
                FOREIGN KEY(AlbumID)
                REFERENCES Albums(ID)
            );
            CREATE TABLE User (
                Username        TEXT,
                ProfilePicture  BLOB
            );
        `);
    }
        
    async test() {
        await this.initPromise;
    }
}

module.exports = Database;
