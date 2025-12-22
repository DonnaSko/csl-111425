# Repository Security Checklist

## ✅ COMPLETED

1. **Removed exposed GitHub token from git config** ✓
   - Token was exposed in remote URL - now removed
   - **ACTION REQUIRED**: Revoke the exposed token (see below)

2. **Updated .gitignore** ✓
   - Added `.cursor/debug.log` to prevent committing debug logs
   - Already excludes `.env` files and sensitive data

## 🔴 CRITICAL ACTIONS REQUIRED

### 1. Revoke Exposed GitHub Token (URGENT)

An old GitHub token was exposed and has been revoked.

1. Go to: https://github.com/settings/tokens
2. Find any old/unused tokens and revoke them
3. Click "Revoke" next to any exposed tokens
4. Create a new token if needed (see below)

### 2. Verify Repository is Private

1. Go to: https://github.com/DonnaSko/csl-111425
2. Click "Settings" tab
3. Scroll to "Danger Zone"
4. Verify "Change repository visibility" shows "Make private"
   - If it shows "Make public" → Repository is already private ✓
   - If it shows "Make private" → Click it and make it private

### 3. Enable Two-Factor Authentication (2FA)

**On GitHub:**
1. Go to: https://github.com/settings/security
2. Under "Two-factor authentication", click "Enable two-factor authentication"
3. Follow the setup wizard (use authenticator app recommended)
4. Save backup codes securely

**For Organization (if applicable):**
1. Go to organization settings
2. Enable "Require two-factor authentication for all members"

### 4. Review Repository Access

1. Go to: https://github.com/DonnaSko/csl-111425/settings/access
2. Review all collaborators
3. Remove anyone who shouldn't have access
4. For each collaborator, verify:
   - They need access (principle of least privilege)
   - They have 2FA enabled
   - They have appropriate permission level (Read/Write/Admin)

### 5. Set Up Branch Protection

1. Go to: https://github.com/DonnaSko/csl-111425/settings/branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Restrict pushes that create matching branches

### 6. Review Deploy Keys & Secrets

1. Go to: https://github.com/DonnaSko/csl-111425/settings/keys
2. Review all deploy keys - remove unused ones
3. Go to: https://github.com/DonnaSko/csl-111425/settings/secrets/actions
4. Review all secrets - ensure they're necessary
5. Rotate any secrets that might have been exposed

### 7. Enable Security Alerts

1. Go to: https://github.com/DonnaSko/csl-111425/settings/security_analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"
4. Enable "Code scanning" (if available)

### 8. Review Commit History for Secrets

The exposed token might be in git history. Check:
```bash
git log --all --full-history --source -- "*" | grep -i "ghp_"
```

If found, consider:
- Using `git-filter-repo` to remove from history (advanced)
- Or accept risk if repository is private and token is revoked

## 🔐 Best Practices Going Forward

### Authentication
- **Never** commit tokens, passwords, or API keys
- Use GitHub CLI (`gh auth login`) or SSH keys instead of PATs in URLs
- Use environment variables for all secrets
- Rotate credentials regularly

### Access Control
- Follow principle of least privilege
- Only grant access to people who need it
- Use teams/organizations for better access management
- Review access quarterly

### Code Protection
- Keep repository private
- Use branch protection rules
- Require code reviews
- Enable security scanning

### Monitoring
- Set up alerts for repository access changes
- Monitor for exposed secrets (GitHub will alert you)
- Review audit logs regularly

## 📋 Quick Verification Checklist

- [ ] Repository is private
- [ ] 2FA enabled on your GitHub account
- [ ] Exposed token revoked
- [ ] Collaborators reviewed and minimal
- [ ] Branch protection enabled
- [ ] Security alerts enabled
- [ ] No secrets in code (use environment variables)
- [ ] .gitignore excludes sensitive files

## 🆘 If Token Was Already Used

If you suspect the token was compromised:
1. Revoke it immediately (see above)
2. Review GitHub audit log: https://github.com/settings/security-log
3. Check for unauthorized access
4. Rotate all related credentials
5. Review recent commits for suspicious activity

