export const LuontoSpotSchema = `
    CREATE TABLE IF NOT EXISTS PhotoNotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        quantity INTEGER,
        photoFileName TEXT,
        photoUrl TEXT,
        note TEXT
    )
`;