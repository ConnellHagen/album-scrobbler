const fs = require('fs');
const initSqlJs = require('sql.js');
const sharp = require('sharp');

const dbName = './db/albums.sqlite';

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
        this.selectAlbumStmt = this.db.prepare(`
            SELECT *
            FROM Albums
            WHERE Artist = ? AND Title = ? 
        `);
        this.selectAllAlbumsStmt = this.db.prepare(`
            SELECT *
            FROM Albums
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

    async insertAlbum(artist, title, cover) {
        await this.initPromise;

        this.insertAlbumStmt.bind([artist, title, cover]);
        this.insertAlbumStmt.run();
        this.insertAlbumStmt.reset();
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

    async selectAllAlbums() {
        await this.initPromise;

        let rows = [];
        while (this.selectAllAlbumsStmt.step()) {
            rows.push(this.selectAllAlbumsStmt.get());
        }

        this.selectAllAlbumsStmt.reset();

        return rows;
    }

    async getUser() {
        await this.initPromise;

        let rows = await this.db.exec(`SELECT * FROM User`);
        return rows[0];
    }

    async setUser(name, profilePicture) {
        await this.initPromise;

        this.db.run(`DELETE FROM User`);
        this.setUserStmt.bind([name, profilePicture]);
        this.setUserStmt.run();
        this.setUserStmt.reset();
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
        
    }
}

module.exports = Database;
