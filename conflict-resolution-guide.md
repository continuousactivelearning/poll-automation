# 🔧 GitHub Merge Conflict Resolution Guide

## 🚨 When Conflicts Happen

### Method 1: GitHub Web Interface
1. **In your PR, click "Resolve conflicts"**
2. **Edit the conflicted files:**
   ```
   <<<<<<< HEAD (your branch)
   Your changes here
   =======
   Main branch changes here
   >>>>>>> main
   ```
3. **Remove conflict markers and choose what to keep**
4. **Click "Mark as resolved" → "Commit merge"**

### Method 2: Local Resolution (Recommended)

```bash
# 1. Switch to your branch
git checkout your-branch-name

# 2. Fetch latest changes
git fetch origin

# 3. Merge main into your branch
git merge origin/main

# 4. Resolve conflicts in your editor
# 5. Add resolved files
git add .

# 6. Commit the merge
git commit -m "resolve: merge conflicts with main"

# 7. Push to update PR
git push origin your-branch-name
```

## 🛡️ Prevention Strategies

### 1. **Always Sync Before Starting Work**
```bash
git checkout main
git pull origin main
git checkout -b new-feature-branch
```

### 2. **Regular Syncing During Development**
```bash
# Do this daily or before major changes
git fetch origin
git merge origin/main
```

### 3. **Small, Focused PRs**
- Keep PRs small and focused
- Merge frequently
- Avoid long-running branches

### 4. **Communication**
- Coordinate with team on shared files
- Use different files/folders when possible
- Discuss major changes before starting

## 🎯 Common Conflict Areas

### Package Files
- `package.json` - coordinate dependency additions
- `package-lock.json` - delete and regenerate if needed

### Config Files
- `docker-compose.yml`
- `turbo.json`
- `.env` files

### Shared Components
- Common UI components
- Shared utilities
- API routes

## 🔄 Team Workflow

### For Team Members:
1. **Before starting work:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature
   ```

2. **During development (daily):**
   ```bash
   git fetch origin
   git merge origin/main
   ```

3. **Before creating PR:**
   ```bash
   git fetch origin
   git merge origin/main
   # Resolve any conflicts
   git push origin feature/your-feature
   ```

### For Reviewers:
1. **Test the PR locally**
2. **Check for conflicts before approving**
3. **Use "Squash and merge" for cleaner history**

## 🚀 Quick Conflict Resolution

### If you see conflicts in your PR:

1. **Local resolution:**
   ```bash
   git checkout your-branch
   git fetch origin
   git merge origin/main
   # Fix conflicts in editor
   git add .
   git commit -m "resolve conflicts"
   git push origin your-branch
   ```

2. **GitHub resolution:**
   - Click "Resolve conflicts" in PR
   - Edit files to remove conflict markers
   - Commit resolution

## 📋 Checklist Before Merging

- [ ] All conflicts resolved
- [ ] Tests passing
- [ ] Code reviewed
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Branch is up to date with main

## 🆘 Emergency: Major Conflicts

If conflicts are too complex:

1. **Create a backup:**
   ```bash
   git checkout your-branch
   git checkout -b backup-branch
   ```

2. **Start fresh:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b new-clean-branch
   # Manually apply your changes
   ```

3. **Cherry-pick specific commits:**
   ```bash
   git cherry-pick commit-hash
   ```

Remember: **Communication is key!** 🗣️
