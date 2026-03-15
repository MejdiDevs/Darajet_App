import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from '../lib/store';

const slides = [
    {
        icon: '⚔️',
        title: 'تنافس في ساحة المبارزة',
        desc: 'تحدَّ أصدقاءك في مبارزات علمية إسلامية. أسئلة فقهية وأخلاقية ودعوية — والذكاء الاصطناعي يحكم بينكم بعدل.',
    },
    {
        icon: '📖',
        title: 'تحدي التفسير اليومي',
        desc: 'كل يوم 5 آيات قرآنية تنتظرك. اكتب تفسيرك وسيقيّمه الذكاء الاصطناعي مع تصحيحات مشجعة.',
    },
    {
        icon: '🕌',
        title: 'تابع صلاتك واكسب النقاط',
        desc: 'سجّل صلواتك الخمس يومياً واحصل على تشجيع شخصي من رفيقك الروحي. ابنِ سلسلتك واصعد في المستويات.',
    },
];

export default function OnboardingScreen() {
    const dispatch = useDispatch();
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            dispatch({ type: 'SET_SCREEN', payload: 'auth' });
        }
    };

    const handleSkip = () => {
        dispatch({ type: 'SET_SCREEN', payload: 'auth' });
    };

    return (
        <div className="onboarding-screen">
            <div style={{ padding: '36px 16px 0', display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={handleSkip} className="btn btn-ghost" style={{ fontSize: 12 }}>
                    تخطي
                </button>
            </div>

            <div className="onboarding-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div className="onboarding-icon">{slides[currentSlide].icon}</div>
                        <h2 className="onboarding-title">{slides[currentSlide].title}</h2>
                        <p className="onboarding-desc">{slides[currentSlide].desc}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="onboarding-dots">
                {slides.map((_, i) => (
                    <div key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} />
                ))}
            </div>

            <div className="onboarding-footer">
                <button onClick={handleNext} className="btn btn-primary btn-full btn-lg">
                    {currentSlide < slides.length - 1 ? 'التالي ←' : 'ابدأ رحلتك مع دَرَجَات ✨'}
                </button>
            </div>
        </div>
    );
}
