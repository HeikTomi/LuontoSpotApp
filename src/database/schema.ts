export const CREATE_TABLE_NOTES = `
    CREATE TABLE IF NOT EXISTS PhotoNotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        photoFileName TEXT,
        photoUrl TEXT,
        note TEXT,
        locationId INTEGER,
        lastUpdated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (locationId) REFERENCES Locations(id)
    )
`;

export const CREATE_TABLE_LOCATIONS = `
CREATE TABLE IF NOT EXISTS Locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    noteId INTEGER DEFAULT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    tagType TEXT NOT NULL,
    ownership TEXT NOT NULL,
    lastUpdated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,    
    FOREIGN KEY (noteId) REFERENCES PhotoNotes(id)
);
`;

export const DELETE_TABLE_PHOTO_NOTES = `
    DROP TABLE IF EXISTS PhotoNotes
`;

export const DELETE_TABLE_LOCATIONS = `
    DROP TABLE IF EXISTS Locations
`;
