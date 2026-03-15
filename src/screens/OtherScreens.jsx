import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppState, useDispatch } from '../lib/store';
import { toArabicNumerals, getLevelFromXP, LEVELS, BADGE_TYPES } from '../lib/xp';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   LEADERBOARD — Weekly + All-time
   ═══════════════════════════════════════════ */
export function LeaderboardScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const [tab, setTab] = useState('all');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [tab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('noor_users')
                .select('id, display_name_ar, total_xp, current_level, duels_won')
                .order('total_xp', { ascending: false })
                .limit(20);

            if (data) setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (i) => {
        if (i === 0) return '🥇';
        if (i === 1) return '🥈';
        if (i === 2) return '🥉';
        return toArabicNumerals(i + 1);
    };

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}>→</button>
                <span className="page-title">👑 لوحة المتصدرين</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 80 }}>
                {/* Tabs */}
                <div className="leaderboard-tabs" style={{ paddingTop: 16 }}>
                    <button
                        className={`leaderboard-tab ${tab === 'all' ? 'active' : ''}`}
                        onClick={() => setTab('all')}
                    >
                        الإجمالي
                    </button>
                    <button
                        className={`leaderboard-tab ${tab === 'weekly' ? 'active' : ''}`}
                        onClick={() => setTab('weekly')}
                    >
                        هذا الأسبوع
                    </button>
                </div>

                {/* Top 3 Podium */}
                {users.length >= 3 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: '16px', marginBottom: 16 }}>
                        {/* 2nd place */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, margin: '0 auto 4px' }}>
                                {users[1].display_name_ar.charAt(0)}
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                                {users[1].display_name_ar}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--noor-gold)' }}>{toArabicNumerals(users[1].total_xp)} XP</div>
                            <div style={{ width: 60, height: 50, background: 'linear-gradient(to top, #E0E0E0, #C0C0C0)', borderRadius: '8px 8px 0 0', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥈</div>
                        </motion.div>

                        {/* 1st place */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, margin: '0 auto 4px', boxShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
                                {users[0].display_name_ar.charAt(0)}
                            </div>
                            <div style={{ fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                                {users[0].display_name_ar}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--noor-gold)', fontWeight: 700 }}>{toArabicNumerals(users[0].total_xp)} XP</div>
                            <div style={{ width: 70, height: 70, background: 'linear-gradient(to top, #FFD700, #FFA500)', borderRadius: '8px 8px 0 0', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🥇</div>
                        </motion.div>

                        {/* 3rd place */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #CD7F32, #A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, margin: '0 auto 4px' }}>
                                {users[2].display_name_ar.charAt(0)}
                            </div>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                                {users[2].display_name_ar}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--noor-gold)' }}>{toArabicNumerals(users[2].total_xp)} XP</div>
                            <div style={{ width: 55, height: 35, background: 'linear-gradient(to top, #CD7F32, #A0522D)', borderRadius: '8px 8px 0 0', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🥉</div>
                        </motion.div>
                    </div>
                )}

                {/* Full list */}
                {users.map((user, i) => (
                    <motion.div
                        key={user.id}
                        className={`leaderboard-full-item ${user.id === state.profile.id ? 'current-user' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                    >
                        <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14 }}>
                            {getRankIcon(i)}
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${getLevelFromXP(user.total_xp).color}, ${getLevelFromXP(user.total_xp).color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>
                            {user.display_name_ar.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>
                                {user.display_name_ar}
                                {user.id === state.profile.id && <span style={{ fontSize: 10, color: 'var(--noor-primary)', marginRight: 4 }}>(أنت)</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>
                                {getLevelFromXP(user.total_xp).badge} {user.current_level}
                            </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--noor-gold)' }}>
                            {toArabicNumerals(user.total_xp)} XP
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="loading-spinner"><div className="spinner" /></div>
                )}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   ACHIEVEMENTS — Badge grid
   ═══════════════════════════════════════════ */
export function AchievementsScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile } = state;
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            if (profile.id) {
                const { data } = await supabase
                    .from('noor_badges')
                    .select('*')
                    .eq('user_id', profile.id);
                if (data) setEarnedBadges(data.map(b => b.badge_type));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const allBadges = Object.entries(BADGE_TYPES).map(([key, value]) => ({
        key,
        ...value,
        earned: earnedBadges.includes(key),
    }));

    const categories = {
        mastery: { name: '🏆 مستوى الإتقان', badges: allBadges.filter(b => b.type === 'mastery') },
        worship: { name: '🔥 سلسلة العبادة', badges: allBadges.filter(b => b.type === 'worship') },
        duel: { name: '⚔️ بطل المبارزة', badges: allBadges.filter(b => b.type === 'duel') },
        quran: { name: '📖 قارئ القرآن', badges: allBadges.filter(b => b.type === 'quran') },
        special: { name: '🌟 أوسمة خاصة', badges: allBadges.filter(b => b.type === 'special') },
    };

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}>→</button>
                <span className="page-title">🏆 الإنجازات</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 80 }}>
                {/* Summary */}
                <div className="noor-card" style={{ margin: '16px 16px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: 'var(--noor-gold)' }}>
                        {toArabicNumerals(earnedBadges.length)} / {toArabicNumerals(allBadges.length)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--noor-text-secondary)' }}>أوسمة مكتسبة</div>
                </div>

                {Object.entries(categories).map(([catKey, category]) => (
                    <div key={catKey}>
                        <div className="section-title">{category.name}</div>
                        <div className="badge-grid">
                            {category.badges.map((badge) => (
                                <motion.div
                                    key={badge.key}
                                    className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}
                                    whileHover={{ scale: badge.earned ? 1.05 : 1 }}
                                >
                                    <div className="badge-card-icon">{badge.icon}</div>
                                    <div className="badge-card-name">{badge.name}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   PROFILE — User stats, level, XP chart
   ═══════════════════════════════════════════ */
export function ProfileScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile } = state;

    const level = getLevelFromXP(profile.totalXP);
    const levelIndex = LEVELS.indexOf(level);
    const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null;
    const xpInLevel = profile.totalXP - level.minXP;
    const xpNeeded = nextLevel ? nextLevel.minXP - level.minXP : 1;
    const progress = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    return (
        <>
            <div className="screen-content" style={{ paddingBottom: 80 }}>
                {/* Profile Header */}
                <motion.div
                    className="profile-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 16 }}
                >
                    <div className="islamic-pattern" />
                    <div className="profile-avatar">{profile.displayNameAr.charAt(0)}</div>
                    <div className="profile-name">{profile.displayNameAr}</div>
                    <div className="profile-level">
                        {level.badge} {level.name}
                    </div>

                    <div className="profile-stats">
                        <div className="profile-stat">
                            <div className="profile-stat-value">{toArabicNumerals(profile.totalXP)}</div>
                            <div className="profile-stat-label">XP</div>
                        </div>
                        <div className="profile-stat">
                            <div className="profile-stat-value">{toArabicNumerals(profile.duelsWon)}</div>
                            <div className="profile-stat-label">فوز</div>
                        </div>
                        <div className="profile-stat">
                            <div className="profile-stat-value">🔥{toArabicNumerals(profile.salatStreak)}</div>
                            <div className="profile-stat-label">سلسلة</div>
                        </div>
                    </div>
                </motion.div>

                {/* Level Progress */}
                <div className="noor-card" style={{ margin: '0 16px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13 }}>
                            {level.badge} {level.name}
                        </span>
                        {nextLevel && (
                            <span style={{ fontSize: 12, color: 'var(--noor-text-secondary)' }}>
                                {nextLevel.badge} {nextLevel.name}
                            </span>
                        )}
                    </div>
                    <div className="progress-bar" style={{ height: 10 }}>
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)', marginTop: 4, textAlign: 'center' }}>
                        {nextLevel
                            ? `${toArabicNumerals(nextLevel.minXP - profile.totalXP)} XP متبقية للمستوى التالي`
                            : '🏆 أعلى مستوى!'}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="section-title">📊 الإحصائيات</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
                    <div className="noor-card" style={{ margin: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>⚔️</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: 'var(--noor-primary)' }}>
                            {toArabicNumerals(profile.duelsWon + profile.duelsLost + profile.duelsDrawn)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>مبارزات</div>
                    </div>
                    <div className="noor-card" style={{ margin: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>📖</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: 'var(--noor-primary)' }}>
                            {toArabicNumerals(profile.tafsirStreak)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>سلسلة التفسير</div>
                    </div>
                    <div className="noor-card" style={{ margin: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>🕌</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: 'var(--noor-primary)' }}>
                            {toArabicNumerals(profile.salatStreak)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>سلسلة الصلاة</div>
                    </div>
                    <div className="noor-card" style={{ margin: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>🏆</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: 'var(--noor-gold)' }}>
                            {toArabicNumerals(Math.round((profile.duelsWon / Math.max(1, profile.duelsWon + profile.duelsLost)) * 100))}%
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>نسبة الفوز</div>
                    </div>
                </div>

                {/* Level Tiers */}
                <div className="section-title">🎖️ المستويات</div>
                <div style={{ padding: '0 16px' }}>
                    {LEVELS.map((lvl, i) => {
                        const reached = profile.totalXP >= lvl.minXP;
                        return (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 12px',
                                    background: reached ? 'rgba(13,122,111,0.05)' : 'var(--noor-surface)',
                                    borderRadius: 10,
                                    marginBottom: 6,
                                    opacity: reached ? 1 : 0.5,
                                    border: lvl.name === profile.currentLevel ? '2px solid var(--noor-primary)' : '2px solid transparent',
                                }}
                            >
                                <span style={{ fontSize: 20 }}>{lvl.badge}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>{lvl.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--noor-text-secondary)' }}>
                                        {toArabicNumerals(lvl.minXP)} — {lvl.maxXP === Infinity ? '∞' : toArabicNumerals(lvl.maxXP)} XP
                                    </div>
                                </div>
                                {reached && <span style={{ color: 'var(--noor-success)' }}>✓</span>}
                            </div>
                        );
                    })}
                </div>

                <div style={{ height: 16 }} />
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   SALAT HISTORY — Calendar view
   ═══════════════════════════════════════════ */
export function SalatHistoryScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            if (state.profile.id) {
                const { data } = await supabase
                    .from('noor_salat_logs')
                    .select('*')
                    .eq('user_id', state.profile.id)
                    .order('logged_at', { ascending: false })
                    .limit(35);

                if (data) setLogs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const prayerEmoji = {
        'الفجر': '🌅',
        'الظهر': '☀️',
        'العصر': '🌤️',
        'المغرب': '🌅',
        'العشاء': '🌙',
    };

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}>→</button>
                <span className="page-title">📅 سجل الصلاة</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 80 }}>
                {/* Streak Summary */}
                <div className="noor-card primary" style={{ margin: '16px 16px 16px', textAlign: 'center' }}>
                    <div className="islamic-pattern" />
                    <div style={{ fontSize: 40, marginBottom: 8, position: 'relative', zIndex: 1 }}>🔥</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, position: 'relative', zIndex: 1 }}>
                        {toArabicNumerals(state.profile.salatStreak)} يوم
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, position: 'relative', zIndex: 1 }}>سلسلتك الحالية</div>
                </div>

                {/* Prayer Logs */}
                {loading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--noor-text-tertiary)' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🕌</div>
                        <div style={{ fontSize: 14 }}>لا توجد صلوات مسجلة بعد</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>ابدأ بتسجيل صلاتك من الشاشة الرئيسية</div>
                    </div>
                ) : (
                    <div style={{ padding: '0 16px' }}>
                        {logs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.03 * i }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    background: 'var(--noor-card)',
                                    borderRadius: 10,
                                    marginBottom: 6,
                                    boxShadow: 'var(--shadow-sm)',
                                    borderRight: `3px solid ${log.was_prayed ? 'var(--noor-success)' : 'var(--noor-error)'}`,
                                }}
                            >
                                <span style={{ fontSize: 20 }}>{prayerEmoji[log.prayer_name] || '🕌'}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>
                                        {log.prayer_name}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--noor-text-secondary)' }}>
                                        {new Date(log.logged_at).toLocaleDateString('ar-SA', {
                                            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <span style={{ fontSize: 16 }}>{log.was_prayed ? '✅' : '❌'}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
