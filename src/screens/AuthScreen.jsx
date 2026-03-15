import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppState, useDispatch } from '../lib/store';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
    const dispatch = useDispatch();
    const [mode, setMode] = useState('login'); // login or register
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async () => {
        if (!email || !password) {
            setError('يرجى إدخال البريد وكلمة المرور');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (mode === 'register') {
                if (!name) {
                    setError('يرجى إدخال اسمك');
                    setLoading(false);
                    return;
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (authError) throw authError;

                // Create user profile
                const { data: profile, error: profileError } = await supabase
                    .from('noor_users')
                    .insert({
                        auth_id: authData.user?.id,
                        display_name_ar: name,
                    })
                    .select()
                    .single();

                if (profileError) throw profileError;

                dispatch({ type: 'SET_USER', payload: authData.user });
                dispatch({
                    type: 'SET_PROFILE',
                    payload: {
                        id: profile.id,
                        displayNameAr: profile.display_name_ar,
                        totalXP: profile.total_xp,
                        currentLevel: profile.current_level,
                        duelsWon: profile.duels_won,
                        duelsLost: profile.duels_lost,
                        duelsDrawn: profile.duels_drawn,
                        salatStreak: profile.salat_streak,
                        tafsirStreak: profile.tafsir_streak,
                    },
                });

                dispatch({ type: 'SET_SCREEN', payload: 'home' });
            } else {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;

                // Fetch user profile
                const { data: profile, error: profileError } = await supabase
                    .from('noor_users')
                    .select('*')
                    .eq('auth_id', authData.user?.id)
                    .single();

                if (profileError) throw profileError;

                dispatch({ type: 'SET_USER', payload: authData.user });
                dispatch({
                    type: 'SET_PROFILE',
                    payload: {
                        id: profile.id,
                        displayNameAr: profile.display_name_ar,
                        totalXP: profile.total_xp,
                        currentLevel: profile.current_level,
                        duelsWon: profile.duels_won,
                        duelsLost: profile.duels_lost,
                        duelsDrawn: profile.duels_drawn,
                        salatStreak: profile.salat_streak,
                        tafsirStreak: profile.tafsir_streak,
                    },
                });

                dispatch({ type: 'SET_SCREEN', payload: 'home' });
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestMode = async () => {
        // Create guest profile in DB
        setLoading(true);
        try {
            const guestNames = [
                'أحمد', 'فاطمة', 'يوسف', 'مريم', 'عمر',
                'خديجة', 'علي', 'عائشة', 'حسن', 'زينب',
                'إبراهيم', 'نورة', 'محمد', 'سارة', 'خالد',
                'هاجر', 'عبدالله', 'ليلى', 'بلال', 'آمنة',
            ];
            const guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
            const { data: profile, error: profileError } = await supabase
                .from('noor_users')
                .insert({
                    display_name_ar: guestName,
                })
                .select()
                .single();

            if (profileError) throw profileError;

            dispatch({
                type: 'SET_PROFILE',
                payload: {
                    id: profile.id,
                    displayNameAr: profile.display_name_ar,
                    totalXP: 0,
                    currentLevel: 'مبتدئ',
                    duelsWon: 0,
                    duelsLost: 0,
                    duelsDrawn: 0,
                    salatStreak: 0,
                    tafsirStreak: 0,
                },
            });

            dispatch({ type: 'SET_SCREEN', payload: 'home' });
        } catch (err) {
            console.error(err);
            setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="auth-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="auth-header">
                <div className="auth-logo">دَرَجَات</div>
                <div className="auth-title">
                    {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </div>
            </div>

            <div className="auth-form">
                {mode === 'register' && (
                    <div className="input-group">
                        <label className="input-label">الاسم بالعربية</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="مثال: أحمد"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                )}

                <div className="input-group">
                    <label className="input-label">البريد الإلكتروني</label>
                    <input
                        className="input-field"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">كلمة المرور</label>
                    <input
                        className="input-field"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                </div>

                {error && (
                    <div style={{ color: 'var(--noor-error)', fontSize: 13, textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={handleAuth}
                    disabled={loading}
                    style={{ marginTop: 8 }}
                >
                    {loading ? (
                        <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                    ) : (
                        mode === 'login' ? 'دخول' : 'إنشاء حساب'
                    )}
                </button>

                <button
                    className="btn btn-ghost btn-full"
                    onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                    }}
                >
                    {mode === 'login' ? 'ليس لديك حساب؟ سجّل الآن' : 'لديك حساب بالفعل؟ سجّل دخول'}
                </button>

                <div style={{ textAlign: 'center', color: 'var(--noor-text-tertiary)', fontSize: 12, margin: '8px 0' }}>
                    ─── أو ───
                </div>

                <button
                    className="btn btn-outline btn-full"
                    onClick={handleGuestMode}
                    disabled={loading}
                >
                    🌙 الدخول كضيف
                </button>
            </div>
        </motion.div>
    );
}
