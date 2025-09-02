import { DELETE_TABLE_LOCATIONS, CREATE_TABLE_LOCATIONS } from './schema';

export const resetLocationsTable = async (): Promise<void> => {
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(DELETE_TABLE_LOCATIONS, [], () => {
                tx.executeSql(CREATE_TABLE_LOCATIONS, [], () => resolve(), (_, error) => reject(error));
            }, (_, error) => reject(error));
        });
    });
};
import { DELETE_TABLE_PHOTO_NOTES, CREATE_TABLE_NOTES } from './schema';

export const resetPhotoNotesTable = async (): Promise<void> => {
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(DELETE_TABLE_PHOTO_NOTES, [], () => {
                tx.executeSql(CREATE_TABLE_NOTES, [], () => resolve(), (_, error) => reject(error));
            }, (_, error) => reject(error));
        });
    });
};
import SQLite from 'react-native-sqlite-storage';
// import { CREATE_TABLE_LOCATIONS } from './schema';

let db: SQLite.SQLiteDatabase;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabase({ name: 'LuontoSpot.db', location: 'default' });
    }
    return db;
};

export const initializeDatabase = async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const db = await getDatabase();
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx) => {
            /*tx.executeSql(
                DELETE_TABLE_PHOTO_NOTES,
                [],
                () => resolve(),
                (_, error) => reject(error)
            ); */
            tx.executeSql(
                CREATE_TABLE_LOCATIONS, // Käytetään schemaa taulun luomiseen
                [],
                () => resolve(),
                (_, error) => reject(error)
            );
            tx.executeSql(
                CREATE_TABLE_NOTES, // Käytetään schemaa taulun luomiseen
                [],
                () => resolve(),
                (_, error) => reject(error)
            );
        }, (error) => {
            console.error('Transaction error:', error);
            reject(error);
        });
    });
};
