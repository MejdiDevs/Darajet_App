import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from './supabase';
import { getLevelFromXP, getCurrentPrayer } from './xp';

const AppContext = createContext(null);
const DispatchContext = createContext(null);

const initialState = {
    // App state
    screen: 'splash', // splash, onboarding, auth, home, duel-home, duel-matchmaking, duel-active, duel-results, tafsir, tafsir-results, roadmap-entry, roadmap-quiz, roadmap-processing, roadmap-results, roadmap-plan, leaderboard, achievements, profile, salat-history
    previousScreen: null,

    // User
    user: null,
    isAuthenticated: false,

    // User profile
    profile: {
        id: null,
        displayNameAr: 'ضيف',
        avatarUrl: null,
        totalXP: 0,
        currentLevel: 'مبتدئ',
        duelsWon: 0,
        duelsLost: 0,
        duelsDrawn: 0,
        salatStreak: 0,
        tafsirStreak: 0,
    },

    // Salat
    currentPrayer: getCurrentPrayer(),
    salatResponse: null,
    salatLoading: false,
    todayPrayers: {},

    // Duel
    selectedDuelType: 'fiqh',
    currentDuel: null,
    duelQuestion: null,
    duelAnswer: '',
    duelTimer: 60,
    duelResults: null,
    duelLoading: false,

    // Tafsir
    todayVerses: [],
    tafsirAnswers: {},
    tafsirResults: null,
    tafsirLoading: false,

    // Roadmap
    roadmapQuestions: [],
    roadmapCurrentLevel: 0,
    roadmapCurrentQuestion: 0,
    roadmapAnswers: {},
    roadmapResults: null,
    roadmapLoading: false,

    // Leaderboard
    leaderboard: [],

    // Badges
    badges: [],
    allBadges: [],

    // XP Animation
    xpPopup: null,

    // Modals
    showLevelUp: false,
    showBadgeEarned: null,
    newLevel: null,
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_SCREEN':
            return { ...state, previousScreen: state.screen, screen: action.payload };

        case 'GO_BACK':
            return { ...state, screen: state.previousScreen || 'home', previousScreen: null };

        case 'SET_USER':
            return { ...state, user: action.payload, isAuthenticated: !!action.payload };

        case 'SET_PROFILE':
            return { ...state, profile: { ...state.profile, ...action.payload } };

        case 'UPDATE_XP': {
            const newXP = state.profile.totalXP + action.payload;
            const newLevel = getLevelFromXP(newXP);
            const levelChanged = newLevel.name !== state.profile.currentLevel;
            return {
                ...state,
                profile: { ...state.profile, totalXP: newXP, currentLevel: newLevel.name },
                showLevelUp: levelChanged,
                newLevel: levelChanged ? newLevel : null,
            };
        }

        case 'SET_SALAT_RESPONSE':
            return { ...state, salatResponse: action.payload };

        case 'SET_SALAT_LOADING':
            return { ...state, salatLoading: action.payload };

        case 'LOG_PRAYER':
            return {
                ...state,
                todayPrayers: { ...state.todayPrayers, [action.payload.prayer]: action.payload.wasPrayed },
            };

        case 'SET_CURRENT_PRAYER':
            return { ...state, currentPrayer: action.payload };

        case 'SET_DUEL_TYPE':
            return { ...state, selectedDuelType: action.payload };

        case 'SET_DUEL_QUESTION':
            return { ...state, duelQuestion: action.payload };

        case 'SET_DUEL_ANSWER':
            return { ...state, duelAnswer: action.payload };

        case 'SET_DUEL_TIMER':
            return { ...state, duelTimer: action.payload };

        case 'SET_DUEL_RESULTS':
            return { ...state, duelResults: action.payload };

        case 'SET_DUEL_LOADING':
            return { ...state, duelLoading: action.payload };

        case 'RESET_DUEL':
            return { ...state, duelQuestion: null, duelAnswer: '', duelTimer: 60, duelResults: null, duelLoading: false };

        case 'SET_TODAY_VERSES':
            return { ...state, todayVerses: action.payload };

        case 'SET_TAFSIR_ANSWER':
            return { ...state, tafsirAnswers: { ...state.tafsirAnswers, [action.payload.index]: action.payload.answer } };

        case 'SET_TAFSIR_RESULTS':
            return { ...state, tafsirResults: action.payload };

        case 'SET_TAFSIR_LOADING':
            return { ...state, tafsirLoading: action.payload };

        case 'RESET_TAFSIR':
            return { ...state, tafsirAnswers: {}, tafsirResults: null, tafsirLoading: false };

        case 'SET_ROADMAP_QUESTIONS':
            return { ...state, roadmapQuestions: action.payload };

        case 'SET_ROADMAP_LEVEL':
            return { ...state, roadmapCurrentLevel: action.payload };

        case 'SET_ROADMAP_QUESTION':
            return { ...state, roadmapCurrentQuestion: action.payload };

        case 'SET_ROADMAP_ANSWER':
            return { ...state, roadmapAnswers: { ...state.roadmapAnswers, [action.payload.key]: action.payload.answer } };

        case 'SET_ROADMAP_RESULTS':
            return { ...state, roadmapResults: action.payload };

        case 'SET_ROADMAP_LOADING':
            return { ...state, roadmapLoading: action.payload };

        case 'RESET_ROADMAP':
            return { ...state, roadmapCurrentLevel: 0, roadmapCurrentQuestion: 0, roadmapAnswers: {}, roadmapResults: null, roadmapLoading: false };

        case 'SET_LEADERBOARD':
            return { ...state, leaderboard: action.payload };

        case 'SET_BADGES':
            return { ...state, badges: action.payload };

        case 'SET_ALL_BADGES':
            return { ...state, allBadges: action.payload };

        case 'SHOW_XP_POPUP':
            return { ...state, xpPopup: action.payload };

        case 'HIDE_XP_POPUP':
            return { ...state, xpPopup: null };

        case 'DISMISS_LEVEL_UP':
            return { ...state, showLevelUp: false, newLevel: null };

        case 'SHOW_BADGE_EARNED':
            return { ...state, showBadgeEarned: action.payload };

        case 'DISMISS_BADGE':
            return { ...state, showBadgeEarned: null };

        case 'UPDATE_PROFILE_STATS':
            return { ...state, profile: { ...state.profile, ...action.payload } };

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                {children}
            </DispatchContext.Provider>
        </AppContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppContext);
    if (!context && context !== initialState) throw new Error('useAppState must be used within AppProvider');
    return context;
}

export function useDispatch() {
    const context = useContext(DispatchContext);
    if (!context) throw new Error('useDispatch must be used within AppProvider');
    return context;
}
