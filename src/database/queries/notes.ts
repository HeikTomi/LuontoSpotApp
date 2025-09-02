import { getDatabase } from '../index';

export const addNote = async (item: any): Promise<number> => {
    const db = await getDatabase();
    return new Promise<number>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'INSERT INTO PhotoNotes (name, photoFileName, photoUrl, note, locationId) VALUES (?, ?, ?, ?, ?)',
                [item.name, item.photoFileName, item.photoUrl, item.note, item.locationId],
                (_, result) => resolve(result.insertId),
                (_, error) => reject(error)
            );
        });
    });
};

export const fetchNotes = async (): Promise<any[]> => {
    const db = await getDatabase();
    return new Promise<any[]>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM PhotoNotes',
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

export const updateNote = async (id: number, note: string, name: string): Promise<void> => {
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'UPDATE PhotoNotes SET note = ?, name = ? WHERE id = ?',
                [note, name, id],
                () => resolve(),
                (_, error) => reject(error)
            );
        });
    });
};

export const updatePhotoUrl = async (id: number, photoUrl: string): Promise<void> => {
    const db = await getDatabase();
    console.log('Updating note photoUrl:', id, 'photoUrl:', photoUrl);
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'UPDATE PhotoNotes SET photoUrl = ? WHERE id = ?',
                [photoUrl, id],
                () => resolve(),
                (_, error) => reject(error)
            );
        });
    });
};

export const deleteNote = async (id: number): Promise<void> => {
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'DELETE FROM PhotoNotes WHERE id = ?',
                [id],
                () => resolve(),
                (_, error) => reject(error)
            );
        });
    });
};
