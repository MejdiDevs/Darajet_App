import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useDispatch } from '../lib/store';
import { evaluateRoadmap } from '../lib/ai';
import { toArabicNumerals, XP_VALUES, getLevelFromXP, getCurrentMultiplier } from '../lib/xp';
import { supabase } from '../lib/supabase';

// Store compiled Q&A in module scope so results screen can access them
let _lastCompiledQA = [];

// Fiqh questionnaire questions by level
const ROADMAP_LEVELS = [
    {
        name: 'المستوى الأول — الأساسيات',
        icon: '🌱',
        questions: [
            { q: 'ما هي أركان الإسلام الخمسة؟', type: 'text' },
            { q: 'ما هي أركان الإيمان الستة؟', type: 'text' },
            { q: 'ما هي شروط صحة الوضوء؟', type: 'text' },
            { q: 'ما هي مبطلات الصيام؟', type: 'text' },
            { q: 'ما هو حكم صلاة الفجر وكم ركعاتها؟', type: 'text' },
        ],
    },
    {
        name: 'المستوى الثاني — العبادات',
        icon: '📚',
        questions: [
            { q: 'ما هي شروط وجوب الزكاة؟', type: 'text' },
            { q: 'ما الفرق بين الركن والواجب والسنة في الصلاة؟', type: 'text' },
            { q: 'ما هي أنواع الحج الثلاثة مع شرح مختصر لكل نوع؟', type: 'text' },
            { q: 'ما هي شروط صحة الصلاة؟', type: 'text' },
            { q: 'ما هو نصاب الزكاة في الذهب والفضة؟', type: 'text' },
        ],
    },
    {
        name: 'المستوى الثالث — المعاملات',
        icon: '⚖️',
        questions: [
            { q: 'ما هي الضوابط الشرعية للبيع والشراء في الإسلام؟', type: 'text' },
            { q: 'ما حكم الربا في الإسلام وما هي أنواعه؟', type: 'text' },
            { q: 'ما هي آداب التعامل مع الجار في الإسلام؟', type: 'text' },
            { q: 'ما هي حقوق الزوجين كما بينها الإسلام؟', type: 'text' },
            { q: 'ما حكم الغش في التجارة والمعاملات؟', type: 'text' },
        ],
    },
    {
        name: 'المستوى الرابع — الفقه المتقدم',
        icon: '🎓',
        questions: [
            { q: 'ما هي شروط الاجتهاد في الفقه الإسلامي؟', type: 'text' },
            { q: 'ما هي المذاهب الفقهية الأربعة ومؤسسوها؟', type: 'text' },
            { q: 'ما هي أصول الفقه وما أهم مصادر التشريع؟', type: 'text' },
            { q: 'ما الفرق بين الفرض والواجب عند الحنفية وعند الجمهور؟', type: 'text' },
            { q: 'ما هي القاعدة الفقهية "لا ضرر ولا ضرار" وكيف تُطبق؟', type: 'text' },
        ],
    },
];

/* ═══════════════════════════════════════════
   ROADMAP ENTRY — Feature intro, start button
   ═══════════════════════════════════════════ */
export function RoadmapEntryScreen() {
    const dispatch = useDispatch();

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}>→</button>
                <span className="page-title">🗺️ خارطة طريق الفقه</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ fontSize: 80, marginBottom: 16 }}
                    >
                        🗺️
                    </motion.div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
                        اكتشف مستواك الفقهي
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--noor-text-secondary)', lineHeight: 1.8, maxWidth: 300, margin: '0 auto 24px' }}>
                        أجب على أسئلة متدرجة من الأساسيات إلى الفقه المتقدم.
                        سيقيّم الذكاء الاصطناعي إجاباتك ويصمم لك خارطة تعلم مخصصة.
                    </p>

                    {/* Level overview */}
                    {ROADMAP_LEVELS.map((level, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                background: 'var(--noor-surface)',
                                borderRadius: 12,
                                marginBottom: 8,
                                textAlign: 'right',
                            }}
                        >
                            <span style={{ fontSize: 24 }}>{level.icon}</span>
                            <div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>
                                    {level.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>
                                    {toArabicNumerals(level.questions.length)} أسئلة
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <div style={{ marginTop: 24 }}>
                        <button
                            className="btn btn-primary btn-full btn-lg"
                            onClick={() => {
                                dispatch({ type: 'RESET_ROADMAP' });
                                dispatch({ type: 'SET_SCREEN', payload: 'roadmap-quiz' });
                            }}
                        >
                            🚀 ابدأ الاختبار التشخيصي
                        </button>
                    </div>

                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--noor-text-tertiary)' }}>
                        ⏱️ يستغرق حوالي 15-20 دقيقة • 🏆 +{toArabicNumerals(XP_VALUES.ROADMAP_COMPLETION)} XP
                    </div>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   ROADMAP QUIZ — One question at a time
   ═══════════════════════════════════════════ */
export function RoadmapQuizScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { roadmapCurrentLevel, roadmapCurrentQuestion, roadmapAnswers } = state;

    const currentLevel = ROADMAP_LEVELS[roadmapCurrentLevel];
    const currentQ = currentLevel?.questions[roadmapCurrentQuestion];
    const totalQuestions = ROADMAP_LEVELS.reduce((sum, l) => sum + l.questions.length, 0);
    const answeredCount = Object.keys(roadmapAnswers).length;
    const answerKey = `${roadmapCurrentLevel}-${roadmapCurrentQuestion}`;

    const handleNext = () => {
        if (roadmapCurrentQuestion < currentLevel.questions.length - 1) {
            dispatch({ type: 'SET_ROADMAP_QUESTION', payload: roadmapCurrentQuestion + 1 });
        } else if (roadmapCurrentLevel < ROADMAP_LEVELS.length - 1) {
            dispatch({ type: 'SET_ROADMAP_LEVEL', payload: roadmapCurrentLevel + 1 });
            dispatch({ type: 'SET_ROADMAP_QUESTION', payload: 0 });
        } else {
            // All done — submit
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (roadmapCurrentQuestion > 0) {
            dispatch({ type: 'SET_ROADMAP_QUESTION', payload: roadmapCurrentQuestion - 1 });
        } else if (roadmapCurrentLevel > 0) {
            const prevLevel = ROADMAP_LEVELS[roadmapCurrentLevel - 1];
            dispatch({ type: 'SET_ROADMAP_LEVEL', payload: roadmapCurrentLevel - 1 });
            dispatch({ type: 'SET_ROADMAP_QUESTION', payload: prevLevel.questions.length - 1 });
        }
    };

    const handleSubmit = async () => {
        dispatch({ type: 'SET_SCREEN', payload: 'roadmap-processing' });
        dispatch({ type: 'SET_ROADMAP_LOADING', payload: true });

        try {
            // Compile all Q&A
            const allQA = [];
            ROADMAP_LEVELS.forEach((level, li) => {
                level.questions.forEach((q, qi) => {
                    allQA.push({
                        level: level.name,
                        question: q.q,
                        answer: roadmapAnswers[`${li}-${qi}`] || 'لا أعرف',
                    });
                });
            });
            _lastCompiledQA = allQA;

            const result = await evaluateRoadmap({
                questions: allQA.map(qa => qa.question),
                answers: allQA.map(qa => qa.answer),
                userLevel: state.profile.currentLevel,
            });

            dispatch({ type: 'SET_ROADMAP_RESULTS', payload: { ...result, compiledQA: allQA } });

            // Award XP
            const multiplier = getCurrentMultiplier();
            const xp = Math.round(XP_VALUES.ROADMAP_COMPLETION * multiplier.multiplier);
            dispatch({ type: 'UPDATE_XP', payload: xp });

            // Save to DB — persist the full roadmap JSON against user profile
            if (state.profile.id) {
                await supabase.from('noor_users').update({
                    total_xp: state.profile.totalXP + xp,
                    current_level: getLevelFromXP(state.profile.totalXP + xp).name,
                }).eq('id', state.profile.id);

                // Save full roadmap results for session persistence
                await supabase.from('noor_daily_challenges').insert({
                    user_id: state.profile.id,
                    verses: allQA.map(qa => ({ question: qa.question, answer: qa.answer, level: qa.level })),
                    answers: allQA.map(qa => qa.answer),
                    scores: result.per_question_scores,
                    ai_feedback: {
                        type: 'roadmap',
                        overall_score: result.overall_score,
                        per_question_corrections: result.per_question_corrections,
                        strengths: result.strengths,
                        gaps: result.gaps,
                        weekly_plan: result.weekly_plan,
                    },
                    completed: true,
                });
            }

            dispatch({ type: 'SET_SCREEN', payload: 'roadmap-results' });
        } catch (err) {
            console.error('Roadmap evaluation error:', err);
            // ai.js returns a structured fallback with nulls on failure
            dispatch({
                type: 'SET_ROADMAP_RESULTS',
                payload: {
                    overall_score: 5,
                    strengths: ['الرغبة في التعلم والمشاركة'],
                    gaps: ['عدم وضوح المفاهيم الفقهية الأساسية', 'الإجابات لا تتعلق بالأسئلة المطروحة', 'الحاجة الماسة لدراسة الأساسيات'],
                    per_question_scores: roadmapQuestions.map(() => 5),
                    per_question_corrections: roadmapQuestions.map(() => 'الإجابة غير واضحة أو لا علاقة لها بالسؤال المطروح.'),
                    weekly_plan: [
                        { week: 'الأسبوع 1', focus_topic: 'الأساسيات والمبادئ', resources_description: 'البدء بكتيبات الفقه الميسرة جداً والتركيز على مفاهيم الطهارة والصلاة', goal: 'فهم أركان الإسلام الأساسية' },
                        { week: 'الأسبوع 2', focus_topic: 'التعلم المستمر', resources_description: 'تخصيص وقت يومي لقراءة الفتاوى المبسطة', goal: 'التعود على المصطلحات الفقهية' },
                        { week: 'الأسبوع 3', focus_topic: 'الآداب والأخلاق', resources_description: 'قراءة أحاديث الأربعين النووية', goal: 'بناء أساس متين في السلوك' },
                        { week: 'الأسبوع 4', focus_topic: 'المراجعة الشاملة', resources_description: 'إعادة تقييم المفاهيم الأساسية', goal: 'التأكد من استيعاب الأساسيات' }
                    ],
                    compiledQA: roadmapQuestions.map((q, i) => ({
                        question: q,
                        answer: roadmapAnswers[i] || 'لم يجب'
                    })),
                },
            });
            dispatch({ type: 'SET_SCREEN', payload: 'roadmap-results' });
        } finally {
            dispatch({ type: 'SET_ROADMAP_LOADING', payload: false });
        }
    };

    const isLastQuestion = roadmapCurrentLevel === ROADMAP_LEVELS.length - 1 &&
        roadmapCurrentQuestion === currentLevel.questions.length - 1;

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'roadmap-entry' })}>→</button>
                <span className="page-title">{currentLevel?.icon} {currentLevel?.name}</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                {/* Progress */}
                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--noor-text-secondary)' }}>
                            السؤال {toArabicNumerals(answeredCount + 1)} من {toArabicNumerals(totalQuestions)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--noor-primary)', fontWeight: 600 }}>
                            %{toArabicNumerals(Math.round((answeredCount / totalQuestions) * 100))}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
                    </div>
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={answerKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{ padding: '0 16px' }}
                    >
                        <div className="duel-question-box" style={{ marginBottom: 16 }}>
                            <div className="duel-question-text" style={{ fontSize: 15 }}>
                                {currentQ?.q}
                            </div>
                        </div>

                        <textarea
                            className="input-field"
                            placeholder="اكتب إجابتك هنا..."
                            value={roadmapAnswers[answerKey] || ''}
                            onChange={(e) => dispatch({
                                type: 'SET_ROADMAP_ANSWER',
                                payload: { key: answerKey, answer: e.target.value },
                            })}
                            rows={5}
                            style={{ minHeight: 120, marginBottom: 16 }}
                        />

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            {(roadmapCurrentQuestion > 0 || roadmapCurrentLevel > 0) && (
                                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handlePrev}>
                                    → السابق
                                </button>
                            )}
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleNext}
                                disabled={!(roadmapAnswers[answerKey] || '').trim()}
                            >
                                {isLastQuestion ? '✨ إرسال الإجابات' : 'التالي ←'}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   ROADMAP PROCESSING — Loading animation
   ═══════════════════════════════════════════ */
export function RoadmapProcessingScreen() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 60 }}
            >
                🗺️
            </motion.div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: 'var(--noor-text-primary)' }}>
                جاري تحليل إجاباتك...
            </div>
            <div style={{ fontSize: 13, color: 'var(--noor-text-secondary)', textAlign: 'center', lineHeight: 1.6, maxWidth: 250 }}>
                الذكاء الاصطناعي يقيّم مستواك ويصمم خارطة تعلم مخصصة لك
            </div>
            <div className="spinner" />
        </div>
    );
}

/* ═══════════════════════════════════════════
   ROADMAP RESULTS — Scores, strengths, gaps
   ═══════════════════════════════════════════ */
export function RoadmapResultsScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { roadmapResults } = state;

    if (!roadmapResults) return null;

    // Get the compiled Q&A for rendering inline corrections
    const compiledQA = roadmapResults.compiledQA || _lastCompiledQA || [];
    const perScores = roadmapResults.per_question_scores || [];
    const perCorrections = roadmapResults.per_question_corrections || [];

    return (
        <>
            <div className="page-header">
                <span className="page-title" style={{ textAlign: 'center' }}>🗺️ نتائج التقييم</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                {/* Overall Score */}
                <motion.div
                    className="noor-card primary"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center' }}
                >
                    <div className="islamic-pattern" />
                    <div style={{ fontSize: 48, marginBottom: 8, position: 'relative', zIndex: 1 }}>🎯</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, position: 'relative', zIndex: 1 }}>
                        %{toArabicNumerals(roadmapResults.overall_score)}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, position: 'relative', zIndex: 1 }}>المستوى العام</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--noor-gold-light)', marginTop: 8, position: 'relative', zIndex: 1 }}>
                        +{toArabicNumerals(XP_VALUES.ROADMAP_COMPLETION)} XP 🏆
                    </div>
                </motion.div>

                {/* Per-Question Corrections — Inline next to each answer */}
                {compiledQA.length > 0 && (
                    <>
                        <div className="section-title">📝 تفصيل الإجابات والتصحيحات</div>
                        {compiledQA.map((qa, i) => (
                            <motion.div
                                key={i}
                                className="noor-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                style={{ borderRight: `3px solid ${(perScores[i] || 0) >= 60 ? 'var(--noor-success)' : 'var(--noor-warning)'}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--noor-primary)' }}>
                                        سؤال {toArabicNumerals(i + 1)}: {qa.question}
                                    </span>
                                    {perScores[i] != null && (
                                        <span className="badge badge-primary">
                                            %{toArabicNumerals(perScores[i])}
                                        </span>
                                    )}
                                </div>

                                <div style={{ fontSize: 12, color: 'var(--noor-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                                    <strong>إجابتك:</strong> {qa.answer}
                                </div>

                                {perCorrections[i] && (
                                    <div className="correction-text">
                                        💡 {perCorrections[i]}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </>
                )}

                {/* Strengths */}
                <div className="section-title">💪 نقاط القوة</div>
                {(roadmapResults.strengths || []).map((s, i) => (
                    <motion.div
                        key={i}
                        className="noor-card"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        style={{ borderRight: '3px solid var(--noor-success)', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <span style={{ fontSize: 20 }}>✅</span>
                        <span style={{ fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{s}</span>
                    </motion.div>
                ))}

                {/* Gaps */}
                <div className="section-title">📌 مجالات التحسين</div>
                {(roadmapResults.gaps || []).map((g, i) => (
                    <motion.div
                        key={i}
                        className="noor-card"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        style={{ borderRight: '3px solid var(--noor-warning)', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <span style={{ fontSize: 20 }}>📖</span>
                        <span style={{ fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{g}</span>
                    </motion.div>
                ))}

                {/* View Plan */}
                <div style={{ padding: '24px 16px', display: 'flex', gap: 12 }}>
                    <button
                        className="btn btn-gold btn-full btn-lg"
                        onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'roadmap-plan' })}
                    >
                        📋 عرض خارطة التعلم
                    </button>
                </div>

                <div style={{ padding: '0 16px' }}>
                    <button
                        className="btn btn-ghost btn-full"
                        onClick={() => {
                            dispatch({ type: 'RESET_ROADMAP' });
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

/* ═══════════════════════════════════════════
   ROADMAP PLAN — Weekly plan card list
   ═══════════════════════════════════════════ */
export function RoadmapPlanScreen() {
    const state = useAppState();
    const dispatch = useDispatch();
    const { roadmapResults } = state;

    if (!roadmapResults?.weekly_plan) return null;

    return (
        <>
            <div className="page-header">
                <button className="page-back-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'roadmap-results' })}>→</button>
                <span className="page-title">📋 خارطة التعلم الشخصية</span>
            </div>

            <div className="screen-content" style={{ paddingBottom: 100 }}>
                <div style={{ padding: '16px 16px 8px' }}>
                    <div style={{ fontSize: 14, color: 'var(--noor-text-secondary)', lineHeight: 1.6 }}>
                        خطة مصممة خصيصاً لك بناءً على نتائج تقييمك. اتبعها أسبوعاً بأسبوع لتطوير معرفتك الفقهية.
                    </div>
                </div>

                {roadmapResults.weekly_plan.map((week, i) => (
                    <motion.div
                        key={i}
                        className="roadmap-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 * i }}
                        style={{ margin: '0 16px 12px' }}
                    >
                        <div className="roadmap-week">
                            📅 الأسبوع {week.week || toArabicNumerals(i + 1)}
                        </div>
                        <div className="roadmap-topic">{week.focus_topic}</div>
                        <div className="roadmap-desc">{week.resources_description}</div>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--noor-success)' }}>
                            <span>🎯</span>
                            <span>{week.goal}</span>
                        </div>
                    </motion.div>
                ))}

                <div style={{ padding: '16px' }}>
                    <button
                        className="btn btn-primary btn-full"
                        onClick={() => {
                            dispatch({ type: 'RESET_ROADMAP' });
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
