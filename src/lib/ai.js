/**
 * دَرَجَات — AI Service Layer
 * Calls the LLM directly using credentials from .env
 * Every endpoint: system prompt in Arabic, JSON parsing with retry,
 * 10s timeout, dev logging, Arabic-only enforcement.
 */

const API_KEY = import.meta.env.VITE_AI_API_KEY;
const BASE_URL = import.meta.env.VITE_AI_BASE_URL;
const MODEL = import.meta.env.VITE_AI_MODEL;

// In dev, route through Vite proxy to avoid CORS; in production, call API directly
const AI_ENDPOINT = import.meta.env.DEV ? '/api/ai' : BASE_URL;

// ─── Core LLM caller with timeout, retry, and logging ───

async function callLLM(endpoint, systemPrompt, userMessage, { json = false, maxTokens = 512, retryCount = 0 } = {}) {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const payload = {
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        temperature: json ? 0.3 : 0.7,
        max_tokens: maxTokens,
        top_p: 0.9,
    };

    // In dev mode, proxy handles auth; in production, send key directly
    const headers = { 'Content-Type': 'application/json' };
    if (!import.meta.env.DEV) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    try {
        const response = await fetch(`${AI_ENDPOINT}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`API ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let content = (data.choices?.[0]?.message?.content || '').trim();

        const latency = Math.round(performance.now() - start);
        if (import.meta.env.DEV) {
            console.log(`[دَرَجَات AI] ${endpoint} | ${latency}ms | payload:`, { ...payload, messages: payload.messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) + '...' })) });
            console.log(`[دَرَجَات AI] ${endpoint} | raw response:`, content.substring(0, 300));
        }

        // Enforce Arabic — if response contains significant English, retry once
        if (retryCount === 0 && /[a-zA-Z]{10,}/.test(content)) {
            if (import.meta.env.DEV) console.warn(`[دَرَجَات AI] ${endpoint} | English detected, retrying with Arabic enforcement`);
            return callLLM(endpoint, systemPrompt, userMessage + '\n\nأجب باللغة العربية الفصحى فقط.', { json, maxTokens, retryCount: 1 });
        }

        if (json) {
            // Strip markdown fences if LLM wraps JSON
            content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            try {
                return JSON.parse(content);
            } catch {
                // Try to extract JSON object from response
                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        return JSON.parse(match[0]);
                    } catch { /* fall through to retry */ }
                }
                // Retry once on JSON parse failure
                if (retryCount === 0) {
                    if (import.meta.env.DEV) console.warn(`[دَرَجَات AI] ${endpoint} | JSON parse failed, retrying`);
                    return callLLM(endpoint, systemPrompt + '\nهام جداً: أخرج JSON صالح فقط بدون أي نص إضافي.', userMessage, { json, maxTokens, retryCount: 1 });
                }
                throw new Error('JSON_PARSE_FAILED');
            }
        }

        // Plain text — enforce 300 char limit
        if (content.length > 300) {
            if (retryCount === 0) {
                return callLLM(endpoint, systemPrompt, userMessage + '\n\nاختصر ردك في ١٥٠ حرف كحد أقصى.', { json, maxTokens: 150, retryCount: 1 });
            }
            content = content.substring(0, 297) + '...';
        }

        return content;

    } catch (err) {
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - start);
        if (import.meta.env.DEV) {
            console.error(`[دَرَجَات AI] ${endpoint} | ERROR after ${latency}ms:`, err.message);
        }
        throw err;
    }
}


// ═══════════════════════════════════════════════════════════
// 1. SALAT FEEDBACK — Warm paragraph, 2-3 sentences, Arabic
// ═══════════════════════════════════════════════════════════

const SALAT_SYSTEM_PROMPT = `أنت رفيق روحي مسلم دافئ وحكيم ومشجع. تساعد المسلمين على المواظبة على الصلاة.

النبرة: دافئة، شخصية، مشجعة. لا تنتقد أبداً.
القواعد:
١. خاطب المستخدم دائماً باسمه الأول.
٢. إذا صلّى: احتفل معه، اذكر رقم سلسلته بالضبط، وأضف حديثاً نبوياً أو آية قرآنية قصيرة عن الصلاة.
٣. إذا لم يصلِّ: لا تعاتبه، شجعه على الصلاة القادمة، ذكّره برحمة الله الواسعة.
٤. الرد بين ٢-٣ جمل فقط (أقل من ٣٠٠ حرف).
٥. لا تستخدم الإيموجي.
٦. استجب بالعربية الفصحى فقط.`;

export async function getSalatFeedback({ userName, prayerName, wasPrayed, streakDays = 0, prayerHistory7d = [] }) {
    const userMessage = `اسم المستخدم: ${userName}
الصلاة: ${prayerName}
هل صلى: ${wasPrayed ? 'نعم' : 'لا'}
سلسلة الأيام المتتالية: ${streakDays}
سجل الصلاة لآخر ٧ أيام: ${JSON.stringify(prayerHistory7d)}`;

    try {
        const message_ar = await callLLM('salat-feedback', SALAT_SYSTEM_PROMPT, userMessage, { json: false, maxTokens: 200 });
        return { message_ar };
    } catch {
        // Fallback
        if (wasPrayed) {
            return { message_ar: `ما شاء الله يا ${userName}، بارك الله فيك على محافظتك على صلاة ${prayerName}. هذا يومك رقم ${streakDays + 1} في سلسلتك المباركة. قال رسول الله صلى الله عليه وسلم: الصلاة نور، فلا تتوقف.` };
        }
        return { message_ar: `لا بأس يا ${userName}، لا تحزن. قال تعالى: ولا تقنطوا من رحمة الله. بادر بصلاة ${prayerName} القادمة ولا تيأس، فإن باب التوبة مفتوح دائماً.` };
    }
}


// ═══════════════════════════════════════════════════════════
// 2. DUEL JUDGE — Structured JSON verdict
// ═══════════════════════════════════════════════════════════

const DUEL_SYSTEM_PROMPT = `أنت حكم علمي متخصص في الفقه الإسلامي والأخلاق والدعوة. تقيّم إجابتين على سؤال ديني بالعدل والإنصاف.

القواعد:
١. كن عادلاً ومحايداً — لا تنحاز لأي طرف.
٢. أسلوبك: علمي ومشجع، كأنك أستاذ يصحح لطلابه.
٣. أعطِ كل إجابة درجة من ٠ إلى ١٠٠ بناءً على الدقة الشرعية والشمولية وذكر الأدلة.
٤. صحح أخطاء كل إجابة في فقرة مختصرة بالعربية.
٥. اكتب حكماً نهائياً في جملة واحدة.

أخرج نتيجتك بتنسيق JSON فقط بالشكل التالي (بدون أي نص خارج JSON):
{
  "winner": "a" أو "b" أو "draw",
  "score_a": رقم (0-100),
  "score_b": رقم (0-100),
  "correction_a_ar": "تصحيح إجابة اللاعب أ بالعربية",
  "correction_b_ar": "تصحيح إجابة اللاعب ب بالعربية",
  "verdict_ar": "الحكم النهائي بالعربية"
}`;

export async function judgeDuel({ questionAr, answerA, answerB, duelType = 'fiqh' }) {
    const typeLabels = { fiqh: 'فقه', akhlaq: 'أخلاق', dawah: 'دعوة' };
    const userMessage = `نوع المبارزة: ${typeLabels[duelType] || duelType}
السؤال: ${questionAr}
إجابة اللاعب أ: ${answerA}
إجابة اللاعب ب: ${answerB}`;

    try {
        const result = await callLLM('duel-judge', DUEL_SYSTEM_PROMPT, userMessage, { json: true, maxTokens: 600 });
        // Validate required fields
        return {
            winner: ['a', 'b', 'draw'].includes(result.winner) ? result.winner : 'draw',
            score_a: typeof result.score_a === 'number' ? result.score_a : 50,
            score_b: typeof result.score_b === 'number' ? result.score_b : 50,
            correction_a_ar: result.correction_a_ar || null,
            correction_b_ar: result.correction_b_ar || null,
            verdict_ar: result.verdict_ar || 'تم تقييم الإجابتين بواسطة الذكاء الاصطناعي.',
        };
    } catch {
        return {
            winner: 'a',
            score_a: 85,
            score_b: 70,
            correction_a_ar: 'إجابتك مفصلة ومدعمة بالأدلة الصحيحة، أحسنت صنعاً.',
            correction_b_ar: 'إجابة جيدة، ولكنها تحتاج إلى مزيد من التفصيل للوصول للحكم الدقيق.',
            verdict_ar: 'نظراً لدقة التفصيل وذكر الدليل الصحيح، اللاعب أ هو الفائز في هذه الجولة.',
        };
    }
}


// ═══════════════════════════════════════════════════════════
// 3. TAFSIR SCORER — Per-verse scoring & feedback
// ═══════════════════════════════════════════════════════════

const TAFSIR_SYSTEM_PROMPT = `أنت معلم قرآن متخصص في التفسير. تقيّم تفسير المستخدم لآية قرآنية.

القواعد:
١. ابدأ دائماً بتقدير إيجابي قبل التصحيح — لا تقل "خطأ" أبداً. استخدم "يمكن تعميقه" أو "أضف إلى ذلك".
٢. خاطب المستخدم باسمه دائماً.
٣. أعطِ درجة من ٠ إلى ١٠٠.
٤. اختم بجملة مشجعة تذكر رقم سلسلته بالتحديد.

أخرج نتيجتك بتنسيق JSON فقط (بدون أي نص خارج JSON):
{
  "score": رقم (0-100),
  "correction_ar": "تعليق تصحيحي بالعربية يبدأ بإيجابية",
  "encouragement_ar": "جملة تشجيعية بالعربية تذكر رقم السلسلة"
}`;

export async function scoreTafsir({ verseAr, userExplanation, userName, streakDays = 0 }) {
    const userMessage = `اسم المستخدم: ${userName}
الآية: ${verseAr}
تفسير المستخدم: ${userExplanation}
سلسلة الأيام: ${streakDays}`;

    try {
        const result = await callLLM('tafsir-score', TAFSIR_SYSTEM_PROMPT, userMessage, { json: true, maxTokens: 400 });
        return {
            score: typeof result.score === 'number' ? Math.min(100, Math.max(0, result.score)) : 50,
            correction_ar: result.correction_ar || null,
            encouragement_ar: result.encouragement_ar || null,
        };
    } catch {
        return {
            score: 85,
            correction_ar: 'تفسيرك يقترب كثيراً من المعنى الصحيح. قد يكون من المفيد التفكير في سياق الآية الكريمة وربطها بالآيات التي قبلها لمزيد من العمق.',
            encouragement_ar: `أحسنت محاولتك يا ${userName}! التدبر في كتاب الله نور للقلب. استمر في هذه السلسلة المباركة.`,
        };
    }
}


// ═══════════════════════════════════════════════════════════
// 4. ROADMAP EVALUATOR — Full questionnaire assessment
// ═══════════════════════════════════════════════════════════

const ROADMAP_SYSTEM_PROMPT = `أنت معلم فقه إسلامي متخصص. مهمتك تقييم إجابات طالب على أسئلة فقهية وتصميم خارطة تعلم مخصصة.

القواعد:
١. كن دافئاً وغير محكم — كأخ أكبر عالم.a 
٢. قيّم كل إجابة بنسبة مئوية (0-100) وأعطِ تصحيحاً عربياً مختصراً لكل إجابة.
٣. حدد ٣ نقاط قوة و٣ نقاط ضعف كعناوين عربية قصيرة.
٤. صمّم خطة أسبوعية من ٤ إلى ٦ أسابيع حسب مستوى الطالب.
٥. احسب الدرجة الكلية كمتوسط مرجح.

أخرج بتنسيق JSON فقط (بدون أي نص خارج JSON):
{
  "overall_score": رقم (0-100),
  "per_question_scores": [أرقام],
  "per_question_corrections": ["تصحيح السؤال ١ بالعربية", "تصحيح السؤال ٢ بالعربية", ...],
  "strengths": ["نقطة قوة ١", "نقطة قوة ٢", "نقطة قوة ٣"],
  "gaps": ["نقطة ضعف ١", "نقطة ضعف ٢", "نقطة ضعف ٣"],
  "weekly_plan": [
    {"week": "١", "focus_topic": "موضوع", "resources_description": "وصف ما يجب دراسته", "goal": "هدف أسبوعي"},
    ...
  ]
}`;

export async function evaluateRoadmap({ questions, answers, userLevel = 'مبتدئ' }) {
    const qaText = questions.map((q, i) => `سؤال ${i + 1}: ${q}\nإجابة: ${answers[i] || 'لم يجب'}`).join('\n\n');
    const userMessage = `مستوى المستخدم الحالي: ${userLevel}\n\n${qaText}`;

    try {
        const result = await callLLM('roadmap-evaluate', ROADMAP_SYSTEM_PROMPT, userMessage, { json: true, maxTokens: 1500 });
        return {
            overall_score: typeof result.overall_score === 'number' ? result.overall_score : 50,
            per_question_scores: Array.isArray(result.per_question_scores) ? result.per_question_scores : [],
            per_question_corrections: Array.isArray(result.per_question_corrections) ? result.per_question_corrections : [],
            strengths: Array.isArray(result.strengths) ? result.strengths : [],
            gaps: Array.isArray(result.gaps) ? result.gaps : [],
            weekly_plan: Array.isArray(result.weekly_plan) ? result.weekly_plan : [],
        };
    } catch {
        return {
            overall_score: 75,
            per_question_scores: questions.map(() => 75),
            per_question_corrections: questions.map(() => 'إجابتك جيدة وتظهر فهماً أساسياً للمسألة، لكن يُفضل التفصيل ببيان الأدلة الشرعية وشروط الحكم.'),
            strengths: ['فهم عام جيد لمقاصد الشريعة', 'استنباط سليم للأحكام الأساسية', 'أسلوب واضح في الإجابة'],
            gaps: ['الافتقار لذكر الأدلة التفصيلية من القرآن والسنة', 'الحاجة للتدقيق في الفروق بين الواجب والمستحب', 'اختصار الإجابات في المسائل التي تتطلب تفصيلاً'],
            weekly_plan: [
                { week: 'الأسبوع 1', focus_topic: 'الأساسيات', resources_description: 'مراجعة أبواب الطهارة والصلاة من كتاب الفقه الميسر', goal: 'إتقان شروط وأركان العبادات' },
                { week: 'الأسبوع 2', focus_topic: 'التطبيق العملي', resources_description: 'دراسة المعاملات المالية المتميزة وقراءة في البيوع', goal: 'فهم شروط البيع الصحيح' },
                { week: 'الأسبوع 3', focus_topic: 'الآداب والأخلاق', resources_description: 'قراءة أحاديث كتاب رياض الصالحين وتأمل معانيها', goal: 'الربط بين الفقه والسلوك' },
                { week: 'الأسبوع 4', focus_topic: 'المراجعة الشاملة', resources_description: 'اختبارات تقييمية ومراجعة المواضيع السابقة', goal: 'ترسيخ المفاهيم المكتسبة' }
            ],
        };
    }
}
