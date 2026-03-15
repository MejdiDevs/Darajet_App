import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useAppState, useDispatch } from './lib/store';
import { getLevelFromXP, getLevelProgress, toArabicNumerals } from './lib/xp';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import { DuelHomeScreen, DuelMatchmakingScreen, DuelActiveScreen, DuelResultsScreen } from './screens/DuelScreens';
import { TafsirChallengeScreen, TafsirResultsScreen } from './screens/TafsirScreens';
import { RoadmapEntryScreen, RoadmapQuizScreen, RoadmapProcessingScreen, RoadmapResultsScreen, RoadmapPlanScreen } from './screens/RoadmapScreens';
import { LeaderboardScreen, AchievementsScreen, ProfileScreen, SalatHistoryScreen } from './screens/OtherScreens';

import './index.css';

// ─── Rotating wisdom messages for AI loading ───
const AI_LOADING_MESSAGES = [
  { label: 'الذكاء الاصطناعي يفكر...', wisdom: 'دَرَجَات يحلل إجابتك بعناية' },
  { label: 'جارٍ التحليل...', wisdom: '﴿ وَقُل رَبِّ زِدْنِي عِلْمًا ﴾' },
  { label: 'لحظات من فضلك...', wisdom: 'الصبر مفتاح الفرج' },
  { label: 'نراجع الإجابة...', wisdom: '﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾' },
  { label: 'نُعدّ النتائج...', wisdom: 'طلب العلم فريضة على كل مسلم' },
  { label: 'اقتربنا...', wisdom: '﴿ وَاللَّهُ يُحِبُّ الصَّابِرِينَ ﴾' },
  { label: 'جارٍ التقييم...', wisdom: 'من سلك طريقًا يلتمس فيه علمًا سهّل الله له طريقًا إلى الجنة' },
  { label: 'لحظة واحدة...', wisdom: '﴿ فَاذْكُرُونِي أَذْكُرْكُمْ ﴾' },
  { label: 'نجهّز الرد...', wisdom: 'أفضل الأعمال أدومها وإن قلّت' },
  { label: 'يكاد ينتهي...', wisdom: '﴿ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ﴾' },
];

function AILoadingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % AI_LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = AI_LOADING_MESSAGES[msgIndex];

  return (
    <motion.div
      className="ai-loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Orbital spinner */}
      <div className="ai-spinner-container">
        <div className="ai-spinner-ring" />
        <div className="ai-spinner-ring" />
        <div className="ai-spinner-ring" />
        <div className="ai-spinner-dot" />
      </div>

      {/* Rotating text */}
      <div className="ai-loading-text-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <div className="ai-loading-label">{current.label}</div>
            <div className="ai-loading-wisdom">{current.wisdom}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { screen, profile, xpPopup, showLevelUp, newLevel } = state;

  const level = getLevelFromXP(profile.totalXP);
  const progress = getLevelProgress(profile.totalXP);

  // Global AI loading — true if any module is waiting for AI
  const isAILoading = state.salatLoading || state.duelLoading || state.tafsirLoading || state.roadmapLoading;

  // Determine which screens show header & nav
  const showHeader = !['splash', 'onboarding', 'auth', 'duel-active', 'duel-matchmaking', 'roadmap-processing'].includes(screen);
  const showNav = ['home', 'leaderboard', 'achievements', 'profile'].includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'auth': return <AuthScreen />;
      case 'home': return <HomeScreen />;
      case 'duel-home': return <DuelHomeScreen />;
      case 'duel-matchmaking': return <DuelMatchmakingScreen />;
      case 'duel-active': return <DuelActiveScreen />;
      case 'duel-results': return <DuelResultsScreen />;
      case 'tafsir': return <TafsirChallengeScreen />;
      case 'tafsir-results': return <TafsirResultsScreen />;
      case 'roadmap-entry': return <RoadmapEntryScreen />;
      case 'roadmap-quiz': return <RoadmapQuizScreen />;
      case 'roadmap-processing': return <RoadmapProcessingScreen />;
      case 'roadmap-results': return <RoadmapResultsScreen />;
      case 'roadmap-plan': return <RoadmapPlanScreen />;
      case 'leaderboard': return <LeaderboardScreen />;
      case 'achievements': return <AchievementsScreen />;
      case 'profile': return <ProfileScreen />;
      case 'salat-history': return <SalatHistoryScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="mobile-frame">
      <div className="app-container">
        {/* App Header */}
        {showHeader && (
          <div className="app-header">
            <div className="header-user">
              <div className="header-avatar">
                {profile.displayNameAr.charAt(0)}
              </div>
              <div className="header-info">
                <span className="header-name">{profile.displayNameAr}</span>
                <span className="header-level">{level.badge} {level.name}</span>
              </div>
            </div>

            <div className="header-xp-bar">
              <div className="xp-bar-container">
                <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="xp-text">{toArabicNumerals(profile.totalXP)} XP</div>
            </div>

            <div className="header-actions">
              <button className="header-btn" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'achievements' })}>
                🏆
              </button>
            </div>
          </div>
        )}

        {/* Screen Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation */}
        {showNav && (
          <div className="bottom-nav">
            <button
              className={`nav-item ${screen === 'home' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-label">الرئيسية</span>
            </button>
            <button
              className={`nav-item ${screen === 'duel-home' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'duel-home' })}
            >
              <span className="nav-icon">⚔️</span>
              <span className="nav-label">المبارزة</span>
            </button>
            <button
              className={`nav-item ${screen === 'leaderboard' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'leaderboard' })}
            >
              <span className="nav-icon">👑</span>
              <span className="nav-label">المتصدرون</span>
            </button>
            <button
              className={`nav-item ${screen === 'achievements' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'achievements' })}
            >
              <span className="nav-icon">🏆</span>
              <span className="nav-label">الإنجازات</span>
            </button>
            <button
              className={`nav-item ${screen === 'profile' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'profile' })}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">ملفي</span>
            </button>
          </div>
        )}

        {/* AI Loading Overlay — covers the entire app frame */}
        <AnimatePresence>
          {isAILoading && <AILoadingOverlay />}
        </AnimatePresence>

        {/* XP Popup */}
        <AnimatePresence>
          {xpPopup && (
            <motion.div
              className="xp-popup"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -60, scale: 1.2 }}
              exit={{ opacity: 0, y: -120, scale: 0.8 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
              }}
            >
              +{toArabicNumerals(xpPopup)} XP ✨
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Modal */}
        <AnimatePresence>
          {showLevelUp && newLevel && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch({ type: 'DISMISS_LEVEL_UP' })}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-icon">{newLevel.badge}</div>
                <div className="modal-title">تهانينا! 🎉</div>
                <div className="modal-subtitle">
                  لقد وصلت إلى مستوى <strong>{newLevel.name}</strong>!
                  <br />
                  استمر في رحلتك مع دَرَجَات.
                </div>
                <button
                  className="btn btn-gold btn-full"
                  onClick={() => dispatch({ type: 'DISMISS_LEVEL_UP' })}
                >
                  ما شاء الله! ✨
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
