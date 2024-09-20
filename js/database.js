const dbName = 'db/albums.sqlite';
let db;

const fs = require('fs');
const initSqlJs = require('sql.js');
const filebuffer = fs.readFileSync(dbName);

function init() {
    initSqlJs().then((SQL) => {
        db = new SQL.Database(filebuffer);

        // return true;
        return false;
    }).then((create) => {
        if (!create)
            return;

        createdb();
    }).catch((err) => {
        console.log(err);
    });
}

function quit() {
    console.log('Quitting...');
    writeDB();
    console.log('Successfully saved to database');
    db.close();
    console.log('Closed database');
}

function createdb() {
    var query = ``;
        // `CREATE TABLE Albums (
        //     ID      INTEGER PRIMARY KEY,
        //     Artist  TEXT,
        //     Title   TEXT,
        //     Cover   BLOB
        // );
        // CREATE TABLE Tracks (
        //     Artist      TEXT,
        //     Title       TEXT,
        //     Length      INTEGER,
        //     AlbumID     INTEGER,
        //     FOREIGN KEY(AlbumID)
        //     REFERENCES Albums(ID)
        // );`;
    console.log(db.exec(query));
}

function writeDB() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbName, buffer);
}

exports.init = init;
exports.quit = quit;