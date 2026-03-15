import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useDispatch } from '../lib/store';
import { judgeDuel } from '../lib/ai';
import { toArabicNumerals, XP_VALUES, getLevelFromXP, getCurrentMultiplier } from '../lib/xp';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════
   DUEL HOME — Type selector, stats, quick play
   ═══════════════════════════════════════════ */
export function DuelHomeScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile, selectedDuelType } = state;

    const duelTypes = [
        {
            id: 'fiqh',
            name: 'مبارزة الفقه',
            desc: 'أسئلة فقهية عن أحكام العبادات والمعاملات',
            icon: '⚖️',
            bg: '#E8F5E9',
        },
        {
            id: 'akhlaq',
            name: 'مبارزة الأخلاق',
            desc: 'مواقف أخلاقية وسلوكية من منظور إسلامي',
            icon: '💎',
            bg: '#E3F2FD',
        },
        {
            id: 'dawah',
            name: 'مبارزة الدعوة',
            desc: 'كيف تشرح الإسلام بوضوح ودقة واحترام',
            icon: '🌍',
            bg: '#FFF3E0',
        },
    ];

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}>
                    →
                </button>
                <span className="page-title">⚔️ ساحة المبارزة</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 80 }}>
                {/* Stats Row */}
                <div style={{ padding: '16px 16px 0' }}>
                    <div className="duel-stats-row">
                        <div className="duel-stat">
                            <div className="duel-stat-value" style={{ color: 'var(--noor-success)' }}>
                                {toArabicNumerals(profile.duelsWon)}
                            </div>
                            <div className="duel-stat-label">فوز</div>
                        </div>
                        <div className="duel-stat">
                            <div className="duel-stat-value" style={{ color: 'var(--noor-error)' }}>
                                {toArabicNumerals(profile.duelsLost)}
                            </div>
                            <div className="duel-stat-label">خسارة</div>
                        </div>
                        <div className="duel-stat">
                            <div className="duel-stat-value" style={{ color: 'var(--noor-gold)' }}>
                                {toArabicNumerals(profile.duelsDrawn)}
                            </div>
                            <div className="duel-stat-label">تعادل</div>
                        </div>
                    </div>
                </div>

                {/* Duel Type Selection */}
                <div className="section-title">اختر نوع المبارزة</div>
                <div style={{ padding: '0 16px' }}>
                    {duelTypes.map((type) => (
                        <motion.div
                            key={type.id}
                            className={`duel-type-card ${selectedDuelType === type.id ? 'selected' : ''}`}
                            onClick={() => dispatch({ type: 'SET_DUEL_TYPE', payload: type.id })}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="duel-type-icon" style={{ background: type.bg }}>
                                {type.icon}
                            </div>
                            <div className="duel-type-info">
                                <div className="duel-type-name">{type.name}</div>
                                <div className="duel-type-desc">{type.desc}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Start Button */}
                <div style={{ padding: '8px 16px' }}>
                    <motion.button
                        className="btn btn-primary btn-full btn-lg"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'duel-matchmaking' })}
                    >
                        ⚔️ ابدأ المبارزة
                    </motion.button>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   MATCHMAKING — Animated waiting screen
   ═══════════════════════════════════════════ */
export function DuelMatchmakingScreen() {
    const dispatch = useDispatch();
    const state = useAppState();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timer);
                    startDuel();
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const startDuel = async () => {
        // Fetch a random question from DB
        try {
            const { data: questions } = await supabase
                .from('noor_duel_questions')
                .select('*')
                .eq('duel_type', state.selectedDuelType);

            if (questions && questions.length > 0) {
                const randomQ = questions[Math.floor(Math.random() * questions.length)];
                dispatch({ type: 'SET_DUEL_QUESTION', payload: randomQ });
            } else {
                // Fallback question
                dispatch({
                    type: 'SET_DUEL_QUESTION',
                    payload: {
                        question_ar: 'ما هي أركان الإسلام الخمسة؟',
                        correct_answer_ar: 'الشهادتان، إقام الصلاة، إيتاء الزكاة، صوم رمضان، حج البيت لمن استطاع إليه سبيلاً',
                        duel_type: 'fiqh',
                    },
                });
            }
            dispatch({ type: 'SET_SCREEN', payload: 'duel-active' });
        } catch (err) {
            console.error(err);
            dispatch({ type: 'SET_SCREEN', payload: 'duel-home' });
        }
    };

    return (
        <div className="matchmaking-screen">
            <motion.div
                className="matchmaking-animation"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            <div className="matchmaking-text">جاري البحث عن خصم...</div>
            <div className="matchmaking-subtext">
                {countdown > 0
                    ? `سيتم إيجاد خصم خلال ${toArabicNumerals(countdown)} ثوانٍ`
                    : 'تم إيجاد خصم! 🎯'
                }
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: countdown <= 2 ? 1 : 0 }}
                style={{ marginTop: 24, fontSize: 14, color: 'var(--noor-text-secondary)' }}
            >
                خصمك: 🤖 المنافس الذكي
            </motion.div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ACTIVE DUEL — Question, timer, text input
   ═══════════════════════════════════════════ */
export function DuelActiveScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile, duelQuestion, duelAnswer, duelTimer, duelLoading } = state;
    const timerRef = useRef(null);

    const maxTime = state.selectedDuelType === 'fiqh' ? 60 : 90;

    useEffect(() => {
        dispatch({ type: 'SET_DUEL_TIMER', payload: maxTime });

        timerRef.current = setInterval(() => {
            dispatch({ type: 'SET_DUEL_TIMER', payload: Math.max(0, state.duelTimer - 1) });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, []);

    // Watch for timer expiry using a separate effect
    useEffect(() => {
        if (duelTimer <= 0 && !duelLoading) {
            handleSubmit();
        }
    }, [duelTimer]);

    const handleSubmit = async () => {
        if (duelLoading) return;
        clearInterval(timerRef.current);
        dispatch({ type: 'SET_DUEL_LOADING', payload: true });

        try {
            // AI opponent uses the correct answer from DB as its response
            const aiAnswer = duelQuestion.correct_answer_ar || 'الشهادتان وإقام الصلاة وإيتاء الزكاة وصوم رمضان وحج البيت';

            // Call AI judge
            const result = await judgeDuel({
                questionAr: duelQuestion.question_ar,
                answerA: duelAnswer || 'لا أعرف',
                answerB: aiAnswer,
                duelType: state.selectedDuelType,
            });

            dispatch({ type: 'SET_DUEL_RESULTS', payload: { ...result, aiAnswer } });

            // Calculate XP
            let xpType;
            if (result.winner === 'a') {
                xpType = XP_VALUES.DUEL_WIN;
                dispatch({ type: 'UPDATE_PROFILE_STATS', payload: { duelsWon: profile.duelsWon + 1 } });
            } else if (result.winner === 'b') {
                xpType = XP_VALUES.DUEL_LOSS;
                dispatch({ type: 'UPDATE_PROFILE_STATS', payload: { duelsLost: profile.duelsLost + 1 } });
            } else {
                xpType = XP_VALUES.DUEL_DRAW;
                dispatch({ type: 'UPDATE_PROFILE_STATS', payload: { duelsDrawn: profile.duelsDrawn + 1 } });
            }

            const multiplier = getCurrentMultiplier();
            const finalXP = Math.round(xpType * multiplier.multiplier);
            dispatch({ type: 'UPDATE_XP', payload: finalXP });

            // Save to DB
            if (profile.id) {
                await supabase.from('noor_duels').insert({
                    challenger_id: profile.id,
                    duel_type: state.selectedDuelType,
                    status: 'completed',
                    question_ar: duelQuestion.question_ar,
                    answer_challenger: duelAnswer,
                    answer_opponent: aiAnswer,
                    winner_id: result.winner === 'a' ? profile.id : null,
                    ai_verdict_ar: result.verdict_ar,
                    score_challenger: result.score_a,
                    score_opponent: result.score_b,
                    correction_challenger_ar: result.correction_a_ar,
                    correction_opponent_ar: result.correction_b_ar,
                    completed_at: new Date().toISOString(),
                });

                await supabase.from('noor_users').update({
                    total_xp: profile.totalXP + finalXP,
                    current_level: getLevelFromXP(profile.totalXP + finalXP).name,
                    duels_won: result.winner === 'a' ? profile.duelsWon + 1 : profile.duelsWon,
                    duels_lost: result.winner === 'b' ? profile.duelsLost + 1 : profile.duelsLost,
                    duels_drawn: result.winner === 'draw' ? profile.duelsDrawn + 1 : profile.duelsDrawn,
                }).eq('id', profile.id);
            }

            dispatch({ type: 'SET_SCREEN', payload: 'duel-results' });
        } catch (err) {
            console.error('Duel judge error:', err);
            // ai.js returns a structured fallback object with null scores on failure
            dispatch({
                type: 'SET_DUEL_RESULTS',
                payload: {
                    winner: null,
                    score_a: null,
                    score_b: null,
                    verdict_ar: 'تعذر الاتصال بالحكم الذكي. يرجى المحاولة لاحقاً.',
                    correction_a_ar: null,
                    correction_b_ar: null,
                    aiAnswer: duelQuestion.correct_answer_ar || '',
                },
            });
            dispatch({ type: 'SET_SCREEN', payload: 'duel-results' });
        } finally {
            dispatch({ type: 'SET_DUEL_LOADING', payload: false });
        }
    };

    const timerClass = duelTimer <= 10 ? 'danger' : duelTimer <= 20 ? 'warning' : '';

    return (
        <div className="duel-active">
            {/* Players */}
            <div className="duel-players" style={{ paddingTop: 36 }}>
                <div className="duel-player">
                    <div className="duel-player-avatar">
                        {profile.displayNameAr.charAt(0)}
                    </div>
                    <div className="duel-player-name">{profile.displayNameAr}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div className={`timer-circle ${timerClass}`}>
                        {toArabicNumerals(duelTimer)}
                    </div>
                    <div className="duel-vs">ضد</div>
                </div>

                <div className="duel-player">
                    <div className="duel-player-avatar opponent">🤖</div>
                    <div className="duel-player-name">المنافس الذكي</div>
                </div>
            </div>

            {/* Question */}
            <motion.div
                className="duel-question-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="duel-question-text">
                    {duelQuestion?.question_ar}
                </div>
            </motion.div>

            {/* Answer Area */}
            <div className="duel-answer-area">
                <textarea
                    className="input-field"
                    style={{ flex: 1, minHeight: 120 }}
                    placeholder="اكتب إجابتك هنا..."
                    value={duelAnswer}
                    onChange={(e) => dispatch({ type: 'SET_DUEL_ANSWER', payload: e.target.value })}
                    disabled={duelLoading}
                />

                <motion.button
                    className="btn btn-primary btn-full btn-lg"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={duelLoading || !duelAnswer.trim()}
                >
                    {duelLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                            الحكم يراجع...
                        </span>
                    ) : (
                        'إرسال الإجابة ✓'
                    )}
                </motion.button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   DUEL RESULTS — Side-by-side, AI verdict, XP
   ═══════════════════════════════════════════ */
export function DuelResultsScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { profile, duelResults, duelAnswer, duelQuestion } = state;

    if (!duelResults) return null;

    const playerWon = duelResults.winner === 'a';
    const draw = duelResults.winner === 'draw';
    const xpEarned = playerWon ? XP_VALUES.DUEL_WIN : draw ? XP_VALUES.DUEL_DRAW : XP_VALUES.DUEL_LOSS;

    return (
        <>
            <div className="page-header">
                <span className="page-title" style={{ textAlign: 'center' }}>نتيجة المبارزة</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                {/* Result Header */}
                <motion.div
                    className="duel-result-header"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <div className="duel-result-icon">
                        {playerWon ? '🏆' : draw ? '🤝' : '💪'}
                    </div>
                    <div className="duel-result-title" style={{ color: playerWon ? 'var(--noor-success)' : draw ? 'var(--noor-gold)' : 'var(--noor-primary)' }}>
                        {playerWon ? 'فزت! ما شاء الله' : draw ? 'تعادل — أحسنتما' : 'لا بأس — ستفوز المرة القادمة'}
                    </div>
                    <motion.div
                        className="duel-result-xp"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        +{toArabicNumerals(xpEarned)} XP ✨
                    </motion.div>
                </motion.div>

                {/* AI Verdict */}
                <div className="noor-card" style={{ borderRight: '4px solid var(--noor-gold)', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--noor-gold)', marginBottom: 8 }}>
                        ⚖️ حكم الذكاء الاصطناعي
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--noor-text-secondary)' }}>
                        {duelResults.verdict_ar}
                    </div>
                </div>

                {/* Answers Comparison */}
                <div className="section-title">مقارنة الإجابات</div>

                <div className="answers-comparison" style={{ padding: '0 16px' }}>
                    {/* Player answer */}
                    <motion.div
                        className="answer-card"
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ borderRight: `3px solid ${playerWon ? 'var(--noor-success)' : 'var(--noor-error)'}` }}
                    >
                        <div className="answer-card-header">
                            <span className="answer-player-name">📝 إجابتك</span>
                            <span className="answer-score" style={{ color: duelResults.score_a >= 50 ? 'var(--noor-success)' : 'var(--noor-error)' }}>
                                %{toArabicNumerals(duelResults.score_a)}
                            </span>
                        </div>
                        <div className="answer-text">{duelAnswer || 'لم يتم الإجابة'}</div>
                        {duelResults.correction_a_ar && (
                            <div className="correction-text">
                                💡 {duelResults.correction_a_ar}
                            </div>
                        )}
                    </motion.div>

                    {/* AI opponent answer */}
                    <motion.div
                        className="answer-card"
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ borderRight: `3px solid ${!playerWon && !draw ? 'var(--noor-success)' : 'var(--noor-text-tertiary)'}` }}
                    >
                        <div className="answer-card-header">
                            <span className="answer-player-name">🤖 المنافس الذكي</span>
                            <span className="answer-score" style={{ color: duelResults.score_b >= 50 ? 'var(--noor-success)' : 'var(--noor-error)' }}>
                                %{toArabicNumerals(duelResults.score_b)}
                            </span>
                        </div>
                        <div className="answer-text">{duelResults.aiAnswer}</div>
                        {duelResults.correction_b_ar && (
                            <div className="correction-text">
                                💡 {duelResults.correction_b_ar}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Actions */}
                <div style={{ padding: '24px 16px', display: 'flex', gap: 12 }}>
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => {
                            dispatch({ type: 'RESET_DUEL' });
                            dispatch({ type: 'SET_SCREEN', payload: 'duel-matchmaking' });
                        }}
                    >
                        🔄 مبارزة أخرى
                    </button>
                    <button
                        className="btn btn-ghost"
                        style={{ flex: 1 }}
                        onClick={() => {
                            dispatch({ type: 'RESET_DUEL' });
                            dispatch({ type: 'SET_SCREEN', payload: 'home' });
                        }}
                    >
                        🏠 الرئيسية
                    </button>
                </div>
            </div>
        </>
    );
}
