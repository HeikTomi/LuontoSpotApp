import { getDatabase } from '../index';

export const insertLocation = async ({
    noteId = null, // Oletusarvo NULL
    latitude,
    longitude,
    tagType,
    ownership,
}: {
    noteId?: number | null; // Salli NULL-arvo
    latitude: number;
    longitude: number;
    tagType: string;
    ownership: string;
}) => {
    const db = await getDatabase();
    return new Promise<number>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                `INSERT INTO Locations (noteId, latitude, longitude, tagType, ownership) 
                 VALUES (?, ?, ?, ?, ?);`,
                [noteId, latitude, longitude, tagType, ownership],
                (_, result) => resolve(result.insertId), // Palauta tallennetun rivin ID
                (_, error) => reject(error) // Käsittele virhe
            );
        });
    });
};

export const updateLocation = async (id: number, noteId: number) => {
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                `UPDATE Locations SET noteId = ? WHERE id = ?;`,
                [noteId, id],
                () => resolve(),
                (_, error) => reject(error)
            );
        });
    });
};

export const fetchLocations = async (): Promise<any[]> => {
    const db = await getDatabase();
    return new Promise<any[]>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM Locations',
                [],
                (_, { rows }: { rows: any }) => {
                    const items = [];
                    for (let i = 0; i < rows.length; i++) {
                        items.push(rows.item(i));
                    }
                    resolve(items);
                },
                (_, error) => reject(error)
            );
        });
    });
};

export const deleteLocation = async (id: number): Promise<void> => {
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'DELETE FROM Locations WHERE id = ?',
                [id],
                () => resolve(),
                (_, error) => reject(error)
            );
        });
    });
};

export const fetchLocationsInTile = async ({
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude,
}: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
}): Promise<any[]> => {
    const db = await getDatabase();
    return new Promise<any[]>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                `SELECT * FROM Locations 
                 WHERE latitude BETWEEN ? AND ? 
                 AND longitude BETWEEN ? AND ?;`,
                [minLatitude, maxLatitude, minLongitude, maxLongitude],
                (_, { rows }) => resolve(rows.raw()), // Palauta kaikki rivit
                (_, error) => reject(error)
            );
        });
    });
};
