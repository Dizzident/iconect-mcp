# Security Setup Guide

This guide helps you configure your repository to work with the security features in our GitHub Actions workflows.

## Common Permission Errors

### Error: "Resource not accessible by integration"

This error occurs when GitHub Actions doesn't have the necessary permissions to upload security results. Here are the solutions:

## Solution 1: Enable GitHub Advanced Security (Recommended)

If you have access to GitHub Advanced Security:

1. Go to **Settings** → **Security & analysis**
2. Enable:
   - **Dependency graph**
   - **Dependabot alerts**
   - **Dependabot security updates**
   - **Code scanning** (if available)

## Solution 2: Use Repository Settings

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - **Read and write permissions**
   - ✅ Allow GitHub Actions to create and approve pull requests

## Solution 3: Use Personal Access Token (PAT)

If you're using a fork or have restricted permissions:

1. Create a PAT with these scopes:
   - `repo` (full control)
   - `security_events` (read and write)
   - `workflow` (update workflows)

2. Add the PAT as a repository secret:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add new secret: `SECURITY_TOKEN`

3. Update the workflow to use the token:
   ```yaml
   - name: Checkout code
     uses: actions/checkout@v4
     with:
       token: ${{ secrets.SECURITY_TOKEN }}
   ```

## Solution 4: Use the Simple CodeQL Workflow

If advanced security features aren't available:

1. Disable the main CodeQL workflow:
   ```bash
   mv .github/workflows/codeql.yml .github/workflows/codeql.yml.disabled
   ```

2. Enable the simple workflow:
   ```bash
   mv .github/workflows/codeql-simple.yml .github/workflows/codeql.yml
   ```

This workflow saves results as artifacts instead of uploading to GitHub Security.

## Workflow Permissions Matrix

| Workflow | Required Permissions | Purpose |
|----------|---------------------|---------|
| `ci.yml` | `contents: read`<br>`security-events: write`<br>`actions: read` | Upload CodeQL results |
| `codeql.yml` | `contents: read`<br>`security-events: write`<br>`actions: read`<br>`pull-requests: read` | Full security analysis |
| `quality-gates.yml` | `contents: read`<br>`security-events: write`<br>`checks: write`<br>`pull-requests: write` | PR quality checks |
| `release.yml` | `contents: write`<br>`packages: write` | Create releases and packages |

## Troubleshooting Steps

1. **Check Repository Type**
   - Public repos: Most features available
   - Private repos: May need GitHub Advanced Security license

2. **Verify Workflow Permissions**
   ```yaml
   permissions:
     contents: read
     security-events: write
   ```

3. **Check Branch Protection**
   - Ensure workflows can run on protected branches
   - May need to exclude GitHub Actions from restrictions

4. **Use Workflow Dispatch for Testing**
   ```yaml
   on:
     workflow_dispatch:
   ```

## Alternative Security Scanning

If GitHub Security features aren't available, consider:

1. **Local Scanning**
   ```bash
   # Install CodeQL CLI
   npm install -g @github/codeql-cli
   
   # Run analysis locally
   codeql database create codeql-db --language=javascript
   codeql database analyze codeql-db javascript-security-extended.qls
   ```

2. **Third-party Services**
   - Snyk
   - SonarCloud
   - Codacy
   - Semgrep

3. **NPM Audit**
   ```bash
   # Built into the CI workflow
   npm audit --audit-level=moderate
   ```

## Best Practices

1. **Start Simple**: Use basic workflows first, add advanced features gradually
2. **Test in Forks**: Test security workflows in a fork before main repository
3. **Monitor Logs**: Check workflow logs for specific permission errors
4. **Use Artifacts**: When uploads fail, save results as artifacts for manual review
5. **Regular Updates**: Keep actions versions updated for latest security fixes

## Support

If you continue to experience issues:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)
2. Review [CodeQL documentation](https://codeql.github.com/docs/)
3. Open an issue with workflow logs attached