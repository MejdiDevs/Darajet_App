# Darajat

Darajat (which means "ranks" or "degrees" in Arabic) is an interactive Islamic learning platform built as a web app. The idea behind it: the first place where Muslims grow in their din together.

The app is entirely in Arabic. Every screen, every prompt, every AI response is written in formal Arabic. It runs inside a simulated phone frame in the browser so it looks and feels like a mobile app, even though it's just a website.


## What it does

There are four main features, all powered by AI.

**Prayer Tracker**

Each day, the app asks the user if they prayed each of the five daily prayers. When they respond (yes or no), an AI generates a short, warm, personalized message in Arabic. If they prayed, the AI encourages them and might share a hadith. If they missed it, the message is gentle and motivating, never harsh. The app tracks prayer streaks over time.

**Duel Arena**

Two players answer the same Islamic knowledge question (covering fiqh, akhlaq, or da'wah). Once both answers are submitted, the AI acts as a judge. It scores each answer from 0 to 100, explains what each player got right or wrong in Arabic, picks a winner, and delivers a final verdict. All of this comes back as structured data that the app displays in a results screen.

**Daily Tafsir Challenge**

The user is shown Quran verses and asked to explain them in their own words. The AI scores the explanation, provides corrections where needed, and gives words of encouragement. The language is always constructive (it never says "wrong," it says "you could improve by...").

**Fiqh Roadmap**

The user takes a short quiz covering different levels of Islamic jurisprudence (beginner, intermediate, advanced, expert). The AI evaluates every answer individually, gives a correction for each one, identifies strengths and weaknesses, and generates a personalized weekly study plan spanning 4 to 6 weeks.

On top of all this, there is an XP and leveling system. Every interaction earns experience points. There are level tiers with Arabic names, badges you can unlock, and a leaderboard that ranks users by total XP. On Fridays, XP is doubled. During Ramadan, it is tripled. If it is both Friday and Ramadan, it is multiplied by six.


## Tech stack

- **Frontend**: React 19 with Vite
- **Styling**: Vanilla CSS, right-to-left layout, Cairo and Noto Sans Arabic fonts
- **Animations**: Framer Motion
- **Backend**: Supabase (database, auth)
- **AI**: NVIDIA API with Meta's LLaMA 3.1 405B Instruct model
- **Proxy**: Vite dev server proxy to handle CORS during development


## Project structure

```
src/
  lib/
    ai.js         Core AI service layer (all LLM calls, retries, fallbacks)
    xp.js         XP calculation, levels, badges, multiplier logic
    store.jsx     Global state management with React Context
    supabase.js   Supabase client setup
  screens/
    HomeScreen.jsx        Main dashboard with prayer tracker
    DuelScreens.jsx       Duel matchmaking, active duel, and results
    TafsirScreens.jsx     Tafsir challenge and results
    RoadmapScreens.jsx    Fiqh quiz, processing, results, and study plan
    OtherScreens.jsx      Leaderboard, achievements, profile, salat history
    SplashScreen.jsx      Loading splash
    OnboardingScreen.jsx  First-time user walkthrough
    AuthScreen.jsx        Login and registration
  App.jsx       Root component with routing, header, nav, and AI loading overlay
  index.css     Full design system
```


## How to run it

You need Node.js installed (version 18 or later).

1. Clone or download the project, then open a terminal in the `noor-app` folder.

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the root of `noor-app` with the following variables:

```
VITE_AI_API_KEY=your_nvidia_api_key_here
VITE_AI_BASE_URL=https://integrate.api.nvidia.com/v1
VITE_AI_MODEL=meta/llama-3.1-405b-instruct
```

You can get an API key from [NVIDIA's API catalog](https://build.nvidia.com/).

4. Start the dev server:

```
npm run dev
```

5. Open `http://localhost:5173` in your browser. The app will appear inside a phone-shaped frame.

The Vite dev server includes a proxy that routes AI requests through the backend to avoid browser CORS issues. You do not need to set up any separate server.


## Database

The app uses Supabase for storage. The following tables are used:

- `noor_users` stores user profiles, XP, level, and streak data
- `noor_salat_logs` tracks individual prayer responses and AI feedback
- `noor_duels` records duel questions, answers, scores, and AI verdicts
- `noor_daily_challenges` stores tafsir challenge results and roadmap evaluations
- `noor_xp_transactions` logs every XP award with its source and multiplier
- `noor_badges` tracks which badges each user has earned
- `noor_duel_questions` and `noor_tafsir_verses` hold the question/verse content

The Supabase credentials are currently hardcoded in `src/lib/supabase.js`. If you are setting up your own instance, you will need to replace those values and create the tables listed above.


## AI integration

All AI calls go through a single function in `src/lib/ai.js`. It handles:

- Sending requests to the LLaMA model via NVIDIA's OpenAI-compatible API
- 10-second timeout on every call
- Automatic retry if the AI responds in English (it re-prompts asking for Arabic)
- JSON parsing with cleanup (strips markdown fences, extracts the JSON object)
- A second retry if JSON parsing fails
- Structured fallback responses with null scores and an Arabic error message if everything fails
- Console logging of every call in development (endpoint, latency, response)

Each module (salat, duel, tafsir, roadmap) has its own exported function with a tailored Arabic system prompt. The AI always responds in formal Arabic.


## Notes

- This is a demo/prototype, not a production app. It was built for an ideathon presentation.
- Guest login is available so you can try it without creating an account.
- The "opponent" in duels is currently the AI using the correct answer from the database, not a real second player.
- The app is designed for desktop browsers showing a mobile phone simulation. It is not optimized as a standalone mobile web app.
