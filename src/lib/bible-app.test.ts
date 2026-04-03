import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculateStreak } from './stats';
import { getOfficialCategory } from './bible-utils';

// Mock Bible Metadata for test context if needed
// Assuming BIBLE_BOOKS is imported in bible-utils, we heavily rely on it.
// We should check if real import works or we need to mock it. 
// For now, let's assume real import works as it is just constant data.

describe('Bible App Utility Tests', () => {

    describe('getOfficialCategory', () => {
        it('returns "분류 정보 없음" for empty input', () => {
            expect(getOfficialCategory([])).toBe('분류 정보 없음');
        });

        it('correctly identifies category for Genesis', () => {
            // Assuming Genesis is defined as '율법서' in bioble-metadata.ts
            // We need to be sure about the actual data. 
            // Based on common knowledge, let's try.
            // If this fails, I will check bible-metadata.ts
            const result = getOfficialCategory(['창세기 1장']);
            expect(result).toBe('율법서');
        });

        it('combines categories unique values', () => {
            const result = getOfficialCategory(['창세기 1장', '출애굽기 1장']);
            expect(result).toBe('율법서'); // Both are Law
        });

        it('combines different categories', () => {
            // Genesis (Law) / Psalms (Poetry - 시가서)
            const result = getOfficialCategory(['창세기 1장', '시편 1편']);
            // The order depends on Set iteration, usually insertion order.
            expect(result).toMatch(/율법서.*시가서/);
        });
    });

    describe('calculateStreak', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns 0 for empty history', () => {
            expect(calculateStreak([])).toBe(0);
        });

        it('returns 1 for reading today', () => {
            const today = new Date(2024, 0, 10); // Jan 10, 2024
            vi.setSystemTime(today);

            expect(calculateStreak(['2024-01-10'])).toBe(1);
        });

        it('returns 2 for reading today and yesterday', () => {
            const today = new Date(2024, 0, 10);
            vi.setSystemTime(today);

            expect(calculateStreak(['2024-01-10', '2024-01-09'])).toBe(2);
        });

        it('returns 1 if yesterday is missed (streak break)', () => {
            const today = new Date(2024, 0, 10);
            vi.setSystemTime(today);

            // Read today, but missed Jan 9. Read Jan 8.
            expect(calculateStreak(['2024-01-10', '2024-01-08'])).toBe(1);
        });

        it('calculates streak even if today is not read but yesterday was (grace period usually? No, stats.ts logic checks today/yesterday)', () => {
            const today = new Date(2024, 0, 10);
            vi.setSystemTime(today);

            // User read yesterday (Jan 9), but not yet today. 
            // stats.ts logic: 
            // if (latestDate < yesterday && latestDate.getTime() !== today.getTime()) return 0;
            // So if latest is yesterday, it should return based on that chain.

            const result = calculateStreak(['2024-01-09', '2024-01-08']);
            // latest is 9th. today is 10th. 
            // logic check: latest(9) < yesterday(9)? No, equal.
            // loop: i=0 (9th), streak=1. i=1 (8th), streak=2.
            expect(result).toBe(2);
        });
    });
});
