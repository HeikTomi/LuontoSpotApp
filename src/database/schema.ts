export const CREATE_TABLE_NOTES = `
    CREATE TABLE IF NOT EXISTS PhotoNotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        photoFileName TEXT,
        photoUrl TEXT,
        note TEXT
        lastUpdated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id) REFERENCES Locations (locationId)
    )
`;

export const CREATE_TABLE_LOCATIONS = `
CREATE TABLE IF NOT EXISTS Locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    locationId INTEGER DEFAULT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    tagType TEXT NOT NULL,
    ownership TEXT NOT NULL,
    lastUpdated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,    
    FOREIGN KEY (locationId) REFERENCES PhotoNotes (id)
);
`;
