# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
# Automatic Poll Generation System 🎯

This is the **frontend** for the Automatic Poll Generation and Participant Tracking System, part of a monorepo setup with React + TypeScript + Vite. The project includes automatic poll generation from Zoom classes using AI, live leaderboard, participant tracking, and dashboards.

> ✅ This sub-package lives in `apps/frontend/` of the monorepo.

---

## 📦 Tech Stack

- ⚛️ **React 19**
- ⚡ **Vite 6**
- ✨ **TypeScript**
- 🎨 **TailwindCSS**
- 🔁 **React Router**
- 📊 **Recharts**
- 🧩 **Framer Motion**
- ✅ **React Hook Form**
- 💡 ESLint + Type-Aware Rules

---

## 🚀 Features (Developed by Frontend Team)

- 🔐 Login, Register, and Forgot Password pages
- 📊 Host & Student Dashboards
- 🧠 AI-Generated Question Feed (via backend AI service)
- 🗣️ Audio Capture UI (for speech input)
- 👥 Participants tracking
- 🥇 Live Leaderboard
- 📈 Reports and analytics
- ⚙️ Host Settings + Orbital Navigation
- 💎 Custom reusable components (`GlassCard`, `Sidebar`, `DashboardLayout` etc.)

🛠 Setup Instructions
📦 Install dependencies
      pnpm install

🧪 Run dev server
      pnpm dev

👨‍💻 Frontend Team
We are a 7-member frontend team contributing via pull requests to this sub-package under apps/frontend/.