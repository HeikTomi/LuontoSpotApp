import SQLite from 'react-native-sqlite-storage';
import { LuontoSpotSchema } from './schema';

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
            tx.executeSql(
                LuontoSpotSchema, // Käytetään schemaa taulun luomiseen
                [],
                () => resolve(),
                (_, error) => reject(error)
            );
        });
    });
};
