# Albums Database Schema
```
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
    FOREIGN KEY(AlbumID) ON DELETE CASCADE // try this
    REFERENCES Albums(ID)
);
CREATE TABLE User (
    Username        TEXT,
    ProfilePicture  BLOB
);
```