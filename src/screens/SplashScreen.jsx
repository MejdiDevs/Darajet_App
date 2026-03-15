import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from '../lib/store';

export default function SplashScreen() {
    const dispatch = useDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_SCREEN', payload: 'onboarding' });
        }, 2500);
        return () => clearTimeout(timer);
    }, [dispatch]);

    return (
        <div className="splash-screen">
            <div className="islamic-pattern" />
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="splash-logo"
            >
                دَرَجَات
            </motion.div>
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="splash-tagline"
            >
                أول منصة ينمو فيها المسلمون في دينهم معًا
            </motion.div>
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.7 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="splash-subtitle"
            >
                DARAJAT
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                style={{ position: 'absolute', bottom: 60, zIndex: 1 }}
            >
                <div className="spinner" style={{ borderTopColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)' }} />
            </motion.div>
        </div>
    );
}
