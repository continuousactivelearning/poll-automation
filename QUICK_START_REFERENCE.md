# ⚡ Quick Start Reference Card

## 🚀 30-Second Setup

```bash
# 1. Fork gayathri-1911/poll-automation on GitHub

# 2. Clone YOUR fork
git clone https://github.com/YOUR-USERNAME/poll-automation.git
cd poll-automation

# 3. Add remotes
git remote add upstream https://github.com/continuousactivelearning/poll-automation.git
git remote add gayathri https://github.com/gayathri-1911/poll-automation.git

# 4. Get latest code
git fetch --all
git checkout -b development gayathri/development

# 5. Create your feature branch
git checkout -b feature/your-feature-name

# 6. Install and run
pnpm install
pnpm dev
```

## 🎯 Work Areas (No Conflicts)

| Teammate | Feature | Files |
|----------|---------|-------|
| **Teammate 1** | Student Dashboard | `apps/frontend/src/components/student/` |
| **Teammate 2** | Analytics System | `apps/backend/src/routes/analytics.ts` |
| **Teammate 3** | Mobile UI | `apps/frontend/src/styles/mobile.css` |
| **Teammate 4** | Testing Suite | `apps/*/src/__tests__/` |

## 📝 Daily Workflow

```bash
# Morning sync
git checkout development && git pull gayathri development
git checkout feature/your-feature-name && git merge development

# Work on your feature
# ... make changes ...

# End of day
git add . && git commit -m "feat: your changes"
git push origin feature/your-feature-name
```

## 🔧 Essential Commands

```bash
pnpm dev          # Start all services
pnpm test         # Run tests
pnpm lint         # Check code style
pnpm build        # Build project
```

## 📊 Ports

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Whisper**: http://localhost:8000

## 🆘 Quick Fixes

**Port in use**: `lsof -ti:5173 | xargs kill -9`
**Dependencies**: `rm -rf node_modules && pnpm install`
**Conflicts**: `git merge development` then resolve in editor

## 📞 Help

- **Issues**: Create GitHub issue with `help wanted` label
- **Chat**: @gayathri-1911 in team channel
- **Email**: chaitanyabaggam3@gmail.com

---

**🎯 Goal**: Build amazing features without conflicts!
