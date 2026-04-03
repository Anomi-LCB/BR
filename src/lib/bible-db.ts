import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BibleDB extends DBSchema {
    verses: {
        key: string; // e.g., "KRV_Genesis_1"
        value: {
            id: string;
            version: string;
            book: string;
            chapter: number;
            verses: string[];
            updatedAt: number;
        };
        indexes: { 'by-version': string };
    };
    meta: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'bible-app-db';
const DB_VERSION = 1;

class BibleDatabase {
    private _dbPromise: Promise<IDBPDatabase<BibleDB>> | null = null;

    private get dbPromise(): Promise<IDBPDatabase<BibleDB>> {
        if (typeof window === 'undefined') {
            // Return a never-resolving promise or reject during SSR, 
            // but since we await it, rejection might crash if unhandled.
            // Better: return a dummy promise or check window in methods.
            return new Promise(() => { });
        }

        if (!this._dbPromise) {
            this._dbPromise = openDB<BibleDB>(DB_NAME, DB_VERSION, {
                upgrade(db: IDBPDatabase<BibleDB>) {
                    if (!db.objectStoreNames.contains('verses')) {
                        const store = db.createObjectStore('verses', { keyPath: 'id' });
                        store.createIndex('by-version', 'version');
                    }
                    if (!db.objectStoreNames.contains('meta')) {
                        db.createObjectStore('meta');
                    }
                },
            });
        }
        return this._dbPromise!;
    }

    async getChapter(version: string, book: string, chapter: number): Promise<string[] | null> {
        const db = await this.dbPromise;
        const id = `${version}_${book}_${chapter}`;
        const result = await db.get('verses', id);
        return result ? result.verses : null;
    }

    async saveChapter(version: string, book: string, chapter: number, verses: string[]) {
        const db = await this.dbPromise;
        const id = `${version}_${book}_${chapter}`;
        await db.put('verses', {
            id,
            version,
            book,
            chapter,
            verses,
            updatedAt: Date.now(),
        });
    }

    async hasVersion(version: string): Promise<boolean> {
        const db = await this.dbPromise;
        // Check if we have any verses for this version
        const count = await db.countFromIndex('verses', 'by-version', version);
        return count > 0;
    }
}

export const bibleDB = new BibleDatabase();

// Helper to construct ID
export const getChapterId = (version: string, book: string, chapter: number) => `${version}_${book}_${chapter}`;
