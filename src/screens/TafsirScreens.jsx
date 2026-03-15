import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useDispatch } from '../lib/store';
import { scoreTafsir } from '../lib/ai';
import { toArabicNumerals, calculateTafsirXP, getCurrentMultiplier, getLevelFromXP } from '../lib/xp';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   TAFSIR CHALLENGE — Daily verse explanation
   ═══════════════════════════════════════════ */
export function TafsirChallengeScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile, todayVerses, tafsirAnswers, tafsirLoading } = state;
    const [verses, setVerses] = useState([]);
    const [currentVerse, setCurrentVerse] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVerses();
    }, []);

    const fetchVerses = async () => {
        try {
            const { data } = await supabase
                .from('noor_tafsir_verses')
                .select('*')
                .order('week_number', { ascending: true })
                .limit(5);

            if (data && data.length > 0) {
                setVerses(data);
                dispatch({ type: 'SET_TODAY_VERSES', payload: data });
            }
        } catch (err) {
            console.error('Error fetching verses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAll = async () => {
        // Check all answers are filled
        const allFilled = verses.every((_, i) => tafsirAnswers[i] && tafsirAnswers[i].trim().length >= 10);
        if (!allFilled) {
            alert('يرجى كتابة تفسيرك لجميع الآيات (10 أحرف على الأقل)');
            return;
        }

        dispatch({ type: 'SET_TAFSIR_LOADING', payload: true });

        try {
            const results = [];

            for (let i = 0; i < verses.length; i++) {
                const result = await scoreTafsir({
                    verseAr: verses[i].verse_ar,
                    userExplanation: tafsirAnswers[i],
                    userName: profile.displayNameAr,
                    streakDays: profile.tafsirStreak,
                });
                results.push(result);
            }

            dispatch({ type: 'SET_TAFSIR_RESULTS', payload: results });

            // Calculate XP
            const multiplier = getCurrentMultiplier();
            const baseXP = calculateTafsirXP(profile.tafsirStreak);
            const finalXP = Math.round(baseXP * multiplier.multiplier);

            dispatch({ type: 'UPDATE_XP', payload: finalXP });
            dispatch({ type: 'UPDATE_PROFILE_STATS', payload: { tafsirStreak: profile.tafsirStreak + 1 } });
            dispatch({ type: 'SHOW_XP_POPUP', payload: finalXP });
            setTimeout(() => dispatch({ type: 'HIDE_XP_POPUP' }), 2000);

            // Save to DB
            if (profile.id) {
                await supabase.from('noor_daily_challenges').insert({
                    user_id: profile.id,
                    verses: verses.map(v => ({ verse_ar: v.verse_ar, surah: v.surah_name })),
                    answers: Object.values(tafsirAnswers),
                    scores: results.map(r => r.score),
                    ai_feedback: results.map(r => ({ correction: r.correction_ar, encouragement: r.encouragement_ar })),
                    completed: true,
                });

                await supabase.from('noor_users').update({
                    total_xp: profile.totalXP + finalXP,
                    current_level: getLevelFromXP(profile.totalXP + finalXP).name,
                    tafsir_streak: profile.tafsirStreak + 1,
                }).eq('id', profile.id);
            }

            dispatch({ type: 'SET_SCREEN', payload: 'tafsir-results' });
        } catch (err) {
            console.error('Tafsir scoring error:', err);
            // ai.js returns a structured fallback with null scores on failure
            const errorResults = verses.map(() => ({
                score: null,
                correction_ar: 'تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.',
                encouragement_ar: null,
            }));
            dispatch({ type: 'SET_TAFSIR_RESULTS', payload: errorResults });
            dispatch({ type: 'SET_SCREEN', payload: 'tafsir-results' });
        } finally {
            dispatch({ type: 'SET_TAFSIR_LOADING', payload: false });
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner" style={{ height: '100%' }}>
                <div className="spinner" />
                <div className="loading-text">جاري تحميل الآيات...</div>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => {
                    dispatch({ type: 'RESET_TAFSIR' });
                    dispatch({ type: 'SET_SCREEN', payload: 'home' });
                }}>→</button>
                <span className="page-title">📖 التحدي اليومي</span>
                <div className="streak-flame" style={{ fontSize: 13 }}>
                    <span className="flame-icon" style={{ fontSize: 16 }}>🔥</span>
                    {toArabicNumerals(profile.tafsirStreak)}
                </div>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                {/* Progress */}
                <div style={{ padding: '16px 16px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12, color: 'var(--noor-text-secondary)' }}>
                            الآية {toArabicNumerals(currentVerse + 1)} من {toArabicNumerals(verses.length)}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${((currentVerse + 1) / verses.length) * 100}%` }} />
                    </div>
                </div>

                {/* Verse Navigation Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
                    {verses.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentVerse(i)}
                            style={{
                                width: currentVerse === i ? 24 : 10,
                                height: 10,
                                borderRadius: 5,
                                border: 'none',
                                background: currentVerse === i ? 'var(--noor-primary)' :
                                    tafsirAnswers[i] ? 'var(--noor-success)' : 'var(--noor-surface)',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                        />
                    ))}
                </div>

                {/* Current Verse */}
                <AnimatePresence mode="wait">
                    {verses[currentVerse] && (
                        <motion.div
                            key={currentVerse}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            style={{ padding: '0 16px' }}
                        >
                            <div className="tafsir-verse-card">
                                <div className="verse-text">
                                    ﴿ {verses[currentVerse].verse_ar} ﴾
                                </div>
                                <div className="verse-reference">
                                    سورة {verses[currentVerse].surah_name} — الآية {verses[currentVerse].verse_number}
                                </div>

                                <textarea
                                    className="input-field"
                                    placeholder="اكتب تفسيرك وفهمك لهذه الآية الكريمة..."
                                    value={tafsirAnswers[currentVerse] || ''}
                                    onChange={(e) => dispatch({
                                        type: 'SET_TAFSIR_ANSWER',
                                        payload: { index: currentVerse, answer: e.target.value },
                                    })}
                                    rows={4}
                                    style={{ minHeight: 100 }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--noor-text-tertiary)' }}>
                                    <span>{tafsirAnswers[currentVerse]?.length || 0} حرف</span>
                                    <span>الحد الأدنى: 10 أحرف</span>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                {currentVerse > 0 && (
                                    <button
                                        className="btn btn-ghost"
                                        style={{ flex: 1 }}
                                        onClick={() => setCurrentVerse(currentVerse - 1)}
                                    >
                                        → السابقة
                                    </button>
                                )}
                                {currentVerse < verses.length - 1 ? (
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                        onClick={() => setCurrentVerse(currentVerse + 1)}
                                    >
                                        التالية ←
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-gold btn-full"
                                        onClick={handleSubmitAll}
                                        disabled={tafsirLoading}
                                    >
                                        {tafsirLoading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                                                جاري التقييم...
                                            </span>
                                        ) : (
                                            '✨ إرسال جميع التفاسير'
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   TAFSIR RESULTS — Per-verse AI feedback
   ═══════════════════════════════════════════ */
export function TafsirResultsScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile, todayVerses, tafsirAnswers, tafsirResults } = state;

    if (!tafsirResults) return null;

    const avgScore = Math.round(tafsirResults.reduce((sum, r) => sum + (r.score || 0), 0) / tafsirResults.length);
    const xpEarned = calculateTafsirXP(profile.tafsirStreak);

    return (
        <>
            <div className="page-header">
                <span className="page-title" style={{ textAlign: 'center' }}>📖 نتائج التحدي اليومي</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                {/* Summary */}
                <motion.div
                    className="noor-card primary"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center' }}
                >
                    <div className="islamic-pattern" />
                    <div style={{ fontSize: 48, marginBottom: 8, position: 'relative', zIndex: 1 }}>📖</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, position: 'relative', zIndex: 1 }}>
                        %{toArabicNumerals(avgScore)}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, position: 'relative', zIndex: 1 }}>المعدل العام</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--noor-gold-light)', marginTop: 8, position: 'relative', zIndex: 1 }}>
                        +{toArabicNumerals(xpEarned)} XP ✨
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, position: 'relative', zIndex: 1 }}>
                        🔥 سلسلة {toArabicNumerals(profile.tafsirStreak)} يوم
                    </div>
                </motion.div>

                {/* Per-verse results */}
                <div className="section-title">تفصيل النتائج</div>
                {todayVerses.map((verse, i) => (
                    <motion.div
                        key={i}
                        className="noor-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        style={{ borderRight: `3px solid ${(tafsirResults[i]?.score || 0) >= 60 ? 'var(--noor-success)' : 'var(--noor-warning)'}` }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--noor-primary)' }}>
                                ﴿ {verse.verse_ar} ﴾
                            </span>
                            <span className="badge badge-primary">
                                %{toArabicNumerals(tafsirResults[i]?.score || 0)}
                            </span>
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--noor-gold)', marginBottom: 8 }}>
                            سورة {verse.surah_name}
                        </div>

                        {/* User's answer */}
                        <div style={{ fontSize: 12, color: 'var(--noor-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                            <strong>إجابتك:</strong> {tafsirAnswers[i]}
                        </div>

                        {/* AI Correction */}
                        {tafsirResults[i]?.correction_ar && (
                            <div className="correction-text" style={{ marginBottom: 8 }}>
                                💡 {tafsirResults[i].correction_ar}
                            </div>
                        )}

                        {/* Encouragement */}
                        {tafsirResults[i]?.encouragement_ar && (
                            <div style={{ fontSize: 12, color: 'var(--noor-success)', fontWeight: 600, lineHeight: 1.6 }}>
                                🌟 {tafsirResults[i].encouragement_ar}
                            </div>
                        )}
                    </motion.div>
                ))}

                {/* Actions */}
                <div style={{ padding: '16px' }}>
                    <button
                        className="btn btn-primary btn-full"
                        onClick={() => {
                            dispatch({ type: 'RESET_TAFSIR' });
                            dispatch({ type: 'SET_SCREEN', payload: 'home' });
                        }}
                    >
                        🏠 العودة للرئيسية
                    </button>
                </div>
            </div>
        </>
    );
}
