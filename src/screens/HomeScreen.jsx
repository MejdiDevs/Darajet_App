import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useDispatch } from '../lib/store';
import { getSalatFeedback } from '../lib/ai';
import { getCurrentPrayer, getNextPrayer, toArabicNumerals, getLevelFromXP, getLevelProgress, calculateSalatXP, getCurrentMultiplier } from '../lib/xp';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile, currentPrayer, salatResponse, salatLoading, todayPrayers } = state;
    const [prayerLogged, setPrayerLogged] = useState(false);

    const level = getLevelFromXP(profile.totalXP);
    const progress = getLevelProgress(profile.totalXP);
    const multiplier = getCurrentMultiplier();

    const handleSalatResponse = async (wasPrayed) => {
        dispatch({ type: 'SET_SALAT_LOADING', payload: true });
        dispatch({ type: 'LOG_PRAYER', payload: { prayer: currentPrayer, wasPrayed } });
        setPrayerLogged(true);

        try {
            // Get AI feedback
            const feedback = await getSalatFeedback({
                userName: profile.displayNameAr,
                prayerName: currentPrayer,
                wasPrayed,
                streakDays: profile.salatStreak,
                prayerHistory7d: Object.entries(todayPrayers).map(([p, v]) => ({ prayer: p, prayed: v })),
            });

            dispatch({ type: 'SET_SALAT_RESPONSE', payload: feedback.message_ar });

            // Award XP
            const xp = calculateSalatXP(wasPrayed, profile.salatStreak);
            const finalXP = Math.round(xp * multiplier.multiplier);
            dispatch({ type: 'UPDATE_XP', payload: finalXP });
            dispatch({ type: 'SHOW_XP_POPUP', payload: finalXP });
            setTimeout(() => dispatch({ type: 'HIDE_XP_POPUP' }), 2000);

            // Log to DB
            if (profile.id) {
                await supabase.from('noor_salat_logs').insert({
                    user_id: profile.id,
                    prayer_name: currentPrayer,
                    was_prayed: wasPrayed,
                    ai_response_ar: feedback.message_ar,
                    streak_at_time: profile.salatStreak,
                });

                // Update user XP in DB
                await supabase.from('noor_users').update({
                    total_xp: profile.totalXP + finalXP,
                    current_level: getLevelFromXP(profile.totalXP + finalXP).name,
                    salat_streak: wasPrayed ? profile.salatStreak + 1 : 0,
                }).eq('id', profile.id);

                if (wasPrayed) {
                    dispatch({ type: 'UPDATE_PROFILE_STATS', payload: { salatStreak: profile.salatStreak + 1 } });
                } else {
                    dispatch({ type: 'UPDATE_PROFILE_STATS', payload: { salatStreak: 0 } });
                }
            }
        } catch (err) {
            console.error('Salat feedback error:', err);
            // ai.js already returns a fallback object internally;
            // if we're here it means even the fallback threw (network down, etc.)
            dispatch({
                type: 'SET_SALAT_RESPONSE',
                payload: 'تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.',
            });
        } finally {
            dispatch({ type: 'SET_SALAT_LOADING', payload: false });
        }
    };

    const moveToNextPrayer = () => {
        const next = getNextPrayer(currentPrayer);
        dispatch({ type: 'SET_CURRENT_PRAYER', payload: next });
        dispatch({ type: 'SET_SALAT_RESPONSE', payload: null });
        setPrayerLogged(false);
    };

    return (
        <div className="screen-content">
            {/* Greeting */}
            <div className="home-greeting">
                <motion.h1
                    className="greeting-text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    السلام عليكم، {profile.displayNameAr} 👋
                </motion.h1>
                <p className="greeting-subtitle">
                    {multiplier.multiplier > 1 ? `🌟 ${multiplier.label}` : 'هيا نتعلم ونرتقي معاً'}
                </p>
            </div>

            {/* Salat Widget */}
            <motion.div
                className="salat-widget"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="islamic-pattern" />
                <div className="salat-header">
                    <div className="salat-prayer-name">🕌 {currentPrayer}</div>
                    <div className="streak-flame">
                        <span className="flame-icon">🔥</span>
                        <span>{toArabicNumerals(profile.salatStreak)}</span>
                    </div>
                </div>

                {!prayerLogged ? (
                    <>
                        <div className="salat-question">
                            هل صليت {currentPrayer} اليوم؟
                        </div>
                        <div className="salat-buttons">
                            <button
                                className="salat-btn yes"
                                onClick={() => handleSalatResponse(true)}
                                disabled={salatLoading}
                            >
                                {salatLoading ? '...' : 'نعم ✓'}
                            </button>
                            <button
                                className="salat-btn no"
                                onClick={() => handleSalatResponse(false)}
                                disabled={salatLoading}
                            >
                                {salatLoading ? '...' : 'لا ✗'}
                            </button>
                        </div>
                    </>
                ) : (
                    <AnimatePresence>
                        {salatResponse && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="salat-response"
                            >
                                {salatResponse}
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        className="salat-btn yes"
                                        style={{ fontSize: 13, padding: '8px 16px' }}
                                        onClick={moveToNextPrayer}
                                    >
                                        الصلاة التالية ←
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {salatLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: 16 }}
                            >
                                <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>رفيقك الروحي يفكر...</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>

            {/* Daily Tafsir Card */}
            <motion.div
                className="noor-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'tafsir' })}
                style={{ cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>📖</span>
                        <div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>
                                التحدي اليومي
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--noor-text-secondary)' }}>
                                5 آيات في انتظارك
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="streak-flame" style={{ fontSize: 13 }}>
                            <span className="flame-icon" style={{ fontSize: 16 }}>🔥</span>
                            {toArabicNumerals(profile.tafsirStreak)}
                        </div>
                        <span style={{ color: 'var(--noor-primary)', fontWeight: 700 }}>←</span>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="section-title">
                <span className="icon">⚡</span>
                إجراءات سريعة
            </div>
            <div className="quick-actions">
                <motion.button
                    className="quick-action-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'duel-home' })}
                >
                    <div className="quick-action-icon">⚔️</div>
                    <div className="quick-action-title">ساحة المبارزة</div>
                    <div className="quick-action-subtitle">
                        {toArabicNumerals(profile.duelsWon)} فوز
                    </div>
                </motion.button>

                <motion.button
                    className="quick-action-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'roadmap-entry' })}
                >
                    <div className="quick-action-icon">🗺️</div>
                    <div className="quick-action-title">خارطتي الفقهية</div>
                    <div className="quick-action-subtitle">مسار التعلم</div>
                </motion.button>

                <motion.button
                    className="quick-action-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'achievements' })}
                >
                    <div className="quick-action-icon">🏆</div>
                    <div className="quick-action-title">الإنجازات</div>
                    <div className="quick-action-subtitle">الأوسمة</div>
                </motion.button>

                <motion.button
                    className="quick-action-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'salat-history' })}
                >
                    <div className="quick-action-icon">📅</div>
                    <div className="quick-action-title">سجل الصلاة</div>
                    <div className="quick-action-subtitle">التاريخ</div>
                </motion.button>
            </div>

            {/* Leaderboard Peek */}
            <div className="section-title">
                <span className="icon">👑</span>
                المتصدرون
                <span
                    style={{ marginRight: 'auto', fontSize: 12, color: 'var(--noor-primary)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'leaderboard' })}
                >
                    عرض الكل ←
                </span>
            </div>
            <div className="noor-card">
                <LeaderboardPeek profileId={profile.id} />
            </div>

            <div style={{ height: 16 }} />
        </div>
    );
}

function LeaderboardPeek({ profileId }) {
    const [top3, setTop3] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data } = await supabase
                .from('noor_users')
                .select('id, display_name_ar, total_xp, current_level')
                .order('total_xp', { ascending: false })
                .limit(3);

            if (data) setTop3(data);
        };
        fetchLeaderboard();
    }, []);

    const rankClasses = ['gold', 'silver', 'bronze'];

    return (
        <div>
            {top3.map((user, i) => (
                <div key={user.id} className={`leaderboard-item ${user.id === profileId ? 'current-user' : ''}`} style={user.id === profileId ? { background: 'rgba(13,122,111,0.05)', borderRadius: 8 } : {}}>
                    <div className={`leaderboard-rank ${rankClasses[i]}`}>
                        {toArabicNumerals(i + 1)}
                    </div>
                    <span className="leaderboard-name">{user.display_name_ar}</span>
                    <span className="leaderboard-xp">{toArabicNumerals(user.total_xp)} XP</span>
                </div>
            ))}
            {top3.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--noor-text-tertiary)', fontSize: 13, padding: 16 }}>
                    كن أول المتصدرين! 🌟
                </div>
            )}
        </div>
    );
}
