# Lunnoa Automate Repository Separation Migration Guide

## Overview

This guide explains how to migrate from a monorepo structure to separate repositories for better deployment control and modularity.

## New Repository Structure

### Before (Monorepo)
```
lunnoa-automate/
├── packages/
│   ├── apps/           # All integrations
│   ├── toolkit/        # Core toolkit
│   ├── ui/             # Client interface
│   └── server/         # Core server
```

### After (Separate Repos)
```
lunnoa-automate/                    # Main platform
├── packages/
│   ├── ui/             # Client interface
│   └── server/         # Core server

lunnoa-automate-toolkit/            # Toolkit repo
├── src/                # Toolkit source
├── package.json
└── .github/workflows/

lunnoa-automate-apps/              # Apps repo
├── src/                # Apps source
├── package.json
└── .github/workflows/
```

## Migration Steps

### 1. Create New Repositories

**Create these GitHub repositories:**
- `lunnoa-automate-toolkit`
- `lunnoa-automate-apps`

### 2. Extract Toolkit

**Copy from main repo:**
```bash
# Copy toolkit package
cp -r packages/toolkit/* lunnoa-automate-toolkit/
cd lunnoa-automate-toolkit
```

**Replace files with provided:**
- `package.json`
- `project.json`
- `nx.json`
- `.github/workflows/publish.yml`

### 3. Extract Apps

**Copy from main repo:**
```bash
# Copy apps package
cp -r packages/apps/* lunnoa-automate-apps/
cd lunnoa-automate-apps
```

**Replace files with provided:**
- `package.json`
- `.github/workflows/publish.yml`

### 4. Update Main Repository

**Update main repo `package.json`:**
```json
{
  "dependencies": {
    "@lunnoa-automate/apps": "^1.0.0",
    "@lunnoa-automate/toolkit": "^1.0.0"
  }
}
```

**Remove workspace references:**
```json
{
  "workspaces": [
    "packages/ui",
    "packages/server"
  ]
}
```

### 5. Update Deployment Workflows

**Update your workflows to use published packages:**
```yaml
- name: Update Dependencies
  run: |
    pnpm up @lunnoa-automate/apps@latest @lunnoa-automate/toolkit@latest
    pnpm install --no-frozen-lockfile
```

## Benefits

### ✅ **Independent Deployments**
- Deploy toolkit updates without affecting UI/Server
- Deploy new apps without full platform rebuild
- Faster CI/CD pipelines

### ✅ **Better Version Control**
- Clear versioning for integrations
- Easier rollbacks
- Independent release cycles

### ✅ **Cleaner Dependencies**
- Explicit external dependencies
- No workspace confusion
- Better package management

### ✅ **Scalable Architecture**
- Prepare for future dynamic loading
- Easier team collaboration
- Better separation of concerns

## Publishing Strategy

### Automatic Publishing
1. **Push to toolkit repo** → Auto-publish toolkit
2. **Push to apps repo** → Auto-publish apps
3. **Main repo workflows** → Auto-update to latest versions

### Manual Version Management
- Update `package.json` versions manually
- Control exactly which versions are used
- Better production stability

## Next Steps

1. **Create the repositories** on GitHub
2. **Extract and copy** the code
3. **Set up CI/CD** with NPM tokens
4. **Update main repo** to use published packages
5. **Test deployments** to ensure everything works

## Commands Summary

```bash
# Create toolkit repo
mkdir lunnoa-automate-toolkit
cd lunnoa-automate-toolkit
git init
# Copy provided files
git add .
git commit -m "Initial toolkit extraction"
git remote add origin https://github.com/skelebuda/lunnoa-automate-toolkit.git
git push -u origin main

# Create apps repo
mkdir lunnoa-automate-apps
cd lunnoa-automate-apps
git init
# Copy provided files
git add .
git commit -m "Initial apps extraction"
git remote add origin https://github.com/skelebuda/lunnoa-automate-apps.git
git push -u origin main

# Update main repo
cd lunnoa-automate
# Update package.json
pnpm install
git add .
git commit -m "Migrate to separate repositories"
git push
```

## Troubleshooting

### Common Issues:
1. **NPM Token**: Make sure to set `NPM_TOKEN` secret in GitHub
2. **Version Conflicts**: Use `pnpm install --no-frozen-lockfile`
3. **Import Errors**: Check that all imports use `@lunnoa-automate/toolkit`

### Support:
- Check repository CI/CD logs
- Verify NPM package publications
- Test locally before deploying 