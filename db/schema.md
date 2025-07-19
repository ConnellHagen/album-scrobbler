# Albums Database Schema
```
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
```
