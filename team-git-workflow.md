# 👥 Team Git Workflow for Poll Automation Project

## 🌟 Branch Strategy

### Main Branches:
- `main` - Production ready code
- `development` - Integration branch for features

### Feature Branches:
- `feature/audio-processing`
- `feature/ui-enhancements` 
- `feature/poll-generation`
- `hotfix/bug-name`

## 🔄 Daily Workflow

### 1. **Start of Day - Sync Up**
```bash
# Get latest changes
git checkout development
git pull origin development

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. **During Development**
```bash
# Commit frequently with clear messages
git add .
git commit -m "feat: add audio chunking functionality"

# Sync with development daily
git fetch origin
git merge origin/development
```

### 3. **Before Creating PR**
```bash
# Final sync
git fetch origin
git merge origin/development

# Push your branch
git push origin feature/your-feature-name
```

## 🚀 PR Creation & Review

### Creating PR:
1. **Base branch**: `development` (not main)
2. **Title**: Clear and descriptive
3. **Description**: What changed and why
4. **Reviewers**: Assign team members

### Review Process:
1. **Code review** by at least 1 team member
2. **Test locally** if needed
3. **Check for conflicts**
4. **Approve and merge**

## 🛠️ Conflict Resolution Commands

### Quick Resolution:
```bash
# If you see conflicts in your PR
git checkout your-branch-name
git fetch origin
git merge origin/development  # or origin/main
# Edit conflicted files
git add .
git commit -m "resolve: merge conflicts"
git push origin your-branch-name
```

### For Package.json Conflicts:
```bash
# Delete lock file and regenerate
rm package-lock.json
npm install
git add .
git commit -m "fix: regenerate package-lock.json"
```

## 📋 File-Specific Guidelines

### High-Conflict Files:
- `package.json` - Coordinate dependency changes
- `docker-compose.yml` - Discuss port/service changes
- `turbo.json` - Coordinate build changes
- `.env` files - Use different env files per feature

### Safe Files:
- Individual component files
- Feature-specific routes
- New service files
- Documentation

## 🎯 Team Communication

### Before Major Changes:
- [ ] Announce in team chat
- [ ] Check if others are working on same files
- [ ] Coordinate timing of merges

### Daily Standup Items:
- [ ] What files/features you're working on
- [ ] Any potential conflicts you foresee
- [ ] When you plan to merge

## 🆘 Emergency Procedures

### If Main Branch is Broken:
1. **Create hotfix branch from last working commit**
2. **Fix the issue**
3. **Fast-track review and merge**
4. **Notify team immediately**

### If Development Branch is Broken:
1. **Identify the breaking commit**
2. **Revert if necessary**
3. **Fix forward if possible**
4. **Communicate with team**

## 📊 Merge Strategies

### For Feature PRs:
- **Squash and merge** - Cleaner history
- **Create merge commit** - Preserve feature branch history

### For Hotfixes:
- **Merge commit** - Clear tracking
- **Cherry-pick** to other branches if needed

## 🔧 Tools & Settings

### Git Configuration:
```bash
# Set up merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'

# Better conflict markers
git config --global merge.conflictstyle diff3
```

### VS Code Extensions:
- GitLens
- Git Graph
- Merge Conflict
- GitHub Pull Requests

## 📈 Success Metrics

### Good Indicators:
- [ ] PRs merge without conflicts
- [ ] Fast review cycles
- [ ] No broken builds
- [ ] Clear commit history

### Warning Signs:
- [ ] Frequent conflicts
- [ ] Long-running branches
- [ ] Large PRs
- [ ] Unclear commit messages

Remember: **Small PRs, frequent merges, clear communication!** 🚀
