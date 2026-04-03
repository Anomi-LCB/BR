import hymnsData from './hymns.json';

export interface Hymn {
    id: number;
    title: string;
    lyrics: string;
}

export const hymnsList: Hymn[] = hymnsData as Hymn[];
