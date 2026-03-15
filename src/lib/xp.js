/**
 * دَرَجَات — XP & Progression System
 * Central logic for experience points, levels, badges, and multipliers
 */

// ─── Level Tiers ───
export const LEVELS = [
    { name: 'مبتدئ', nameEn: 'Beginner', minXP: 0, maxXP: 999, badge: '🌙', color: '#6B7280' },
    { name: 'طالب علم', nameEn: 'Seeker', minXP: 1000, maxXP: 4999, badge: '📖', color: '#0D7A6F' },
    { name: 'متعلم', nameEn: 'Learner', minXP: 5000, maxXP: 14999, badge: '🏮', color: '#C5973A' },
    { name: 'فقيه', nameEn: 'Jurist', minXP: 15000, maxXP: 39999, badge: '🕌', color: '#7C3AED' },
    { name: 'عالم', nameEn: 'Scholar', minXP: 40000, maxXP: 99999, badge: '🕋', color: '#DC2626' },
    { name: 'إمام', nameEn: 'Imam', minXP: 100000, maxXP: Infinity, badge: '⭐', color: '#F59E0B' },
];

// ─── XP Values ───
export const XP_VALUES = {
    DUEL_WIN: 150,
    DUEL_LOSS: 60,
    DUEL_DRAW: 90,
    ROADMAP_COMPLETION: 500,
    ROADMAP_SECTION: 50,
    TAFSIR_BASE: 80,
    TAFSIR_STREAK_BONUS: 10,
    SALAT_YES: 30,
    SALAT_NO: 10,
    SALAT_STREAK_BONUS: 5,
};

// ─── Badge Definitions ───
export const BADGE_TYPES = {
    // Level badges
    LEVEL_BEGINNER: { icon: '🌙', name: 'هلال المبتدئ', type: 'mastery' },
    LEVEL_SEEKER: { icon: '📖', name: 'كتاب طالب العلم', type: 'mastery' },
    LEVEL_LEARNER: { icon: '🏮', name: 'مصباح المتعلم', type: 'mastery' },
    LEVEL_JURIST: { icon: '🕌', name: 'منارة الفقيه', type: 'mastery' },
    LEVEL_SCHOLAR: { icon: '🕋', name: 'قبة العالم', type: 'mastery' },
    LEVEL_IMAM: { icon: '⭐', name: 'نجمة الإمام', type: 'mastery' },

    // Streak badges
    SALAT_STREAK_3: { icon: '🔥', name: 'سلسلة 3 أيام', type: 'worship' },
    SALAT_STREAK_7: { icon: '🔥', name: 'سلسلة 7 أيام', type: 'worship' },
    SALAT_STREAK_30: { icon: '🔥', name: 'سلسلة 30 يوم', type: 'worship' },
    SALAT_STREAK_100: { icon: '🔥', name: 'سلسلة 100 يوم', type: 'worship' },

    // Duel badges
    DUEL_10: { icon: '⚔️', name: 'مبارز 10', type: 'duel' },
    DUEL_50: { icon: '⚔️', name: 'بطل 50', type: 'duel' },
    DUEL_100: { icon: '⚔️', name: 'أسطورة 100', type: 'duel' },

    // Quran badges
    TAFSIR_7: { icon: '📖', name: 'قارئ 7 أيام', type: 'quran' },
    TAFSIR_30: { icon: '📖', name: 'قارئ 30 يوم', type: 'quran' },
    TAFSIR_100: { icon: '📖', name: 'قارئ 100 يوم', type: 'quran' },

    // Special
    FRIDAY_MASTER: { icon: '🌟', name: 'سيد الجمعة', type: 'special' },
    RAMADAN: { icon: '🌙', name: 'رمضان كريم', type: 'special' },
};

/**
 * Get current level from XP total
 */
export function getLevelFromXP(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) return LEVELS[i];
    }
    return LEVELS[0];
}

/**
 * Get XP progress within current level (0-100%)
 */
export function getLevelProgress(xp) {
    const level = getLevelFromXP(xp);
    const levelIndex = LEVELS.indexOf(level);

    if (levelIndex === LEVELS.length - 1) return 100; // Max level

    const nextLevel = LEVELS[levelIndex + 1];
    const xpInLevel = xp - level.minXP;
    const xpNeeded = nextLevel.minXP - level.minXP;

    return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
}

/**
 * Get XP needed for next level
 */
export function getXPToNextLevel(xp) {
    const level = getLevelFromXP(xp);
    const levelIndex = LEVELS.indexOf(level);

    if (levelIndex === LEVELS.length - 1) return 0;

    return LEVELS[levelIndex + 1].minXP - xp;
}

/**
 * Approximate Hijri month from Gregorian date.
 * Uses the Kuwaiti algorithm for a reasonable approximation.
 * Returns month number 1-12 (9 = Ramadan).
 */
function getApproxHijriMonth(date = new Date()) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    // Julian Day Number
    const jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
        Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
        Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
        d - 32075;

    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const remaining = l - 10631 * n + 354;
    const j = (Math.floor((10985 - remaining) / 5316)) * (Math.floor((50 * remaining) / 17719)) +
        (Math.floor(remaining / 5670)) * (Math.floor((43 * remaining) / 15238));
    const remL = remaining - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
        (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const hijriMonth = Math.floor((24 * remL) / 709);

    return hijriMonth;
}

/**
 * Get current multiplier based on day/season.
 * Friday = ×2, Ramadan = ×3, both = ×6.
 * Uses the user's local timezone.
 */
export function getCurrentMultiplier() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 5 = Friday

    const isFriday = dayOfWeek === 5;
    const isRamadan = getApproxHijriMonth(now) === 9;

    let multiplier = 1;
    let label = '';

    if (isFriday && isRamadan) {
        multiplier = 6;
        label = 'الجمعة + رمضان ×2';
    } else if (isRamadan) {
        multiplier = 3;
        label = 'رمضان كريم ×3';
    } else if (isFriday) {
        multiplier = 2;
        label = 'يوم الجمعة ×2';
    }

    return { multiplier, label };
}

/**
 * Calculate tafsir XP with streak bonus
 */
export function calculateTafsirXP(streakDays) {
    return XP_VALUES.TAFSIR_BASE + (XP_VALUES.TAFSIR_STREAK_BONUS * streakDays);
}

/**
 * Calculate salat XP per prayer
 */
export function calculateSalatXP(wasPrayed, streakDays) {
    if (wasPrayed) {
        return XP_VALUES.SALAT_YES + (XP_VALUES.SALAT_STREAK_BONUS * streakDays);
    }
    return XP_VALUES.SALAT_NO;
}

/**
 * Convert Western numbers to Eastern Arabic numerals
 */
export function toArabicNumerals(num) {
    return String(num);
}

/**
 * Prayer names in Arabic
 */
export const PRAYER_NAMES = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

/**
 * Get current prayer based on approximate time
 */
export function getCurrentPrayer() {
    const hour = new Date().getHours();

    if (hour >= 4 && hour < 12) return 'الفجر';
    if (hour >= 12 && hour < 15) return 'الظهر';
    if (hour >= 15 && hour < 17) return 'العصر';
    if (hour >= 17 && hour < 19) return 'المغرب';
    return 'العشاء';
}

/**
 * Get next prayer after current
 */
export function getNextPrayer(currentPrayer) {
    const idx = PRAYER_NAMES.indexOf(currentPrayer);
    return PRAYER_NAMES[(idx + 1) % PRAYER_NAMES.length];
}
