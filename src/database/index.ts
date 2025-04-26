import SQLite from 'react-native-sqlite-storage';
import { CREATE_TABLE_LOCATIONS, CREATE_TABLE_NOTES } from './schema';

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
