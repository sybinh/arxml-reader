# Git Hooks Setup

To automatically run tests before commits, set up the git hook:

## Windows (PowerShell)
```powershell
# Navigate to your git hooks directory
cd .git\hooks

# Create pre-commit hook
@"
#!/bin/sh
# Run pre-commit checks using PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "./scripts/pre-commit.ps1"
"@ | Out-File -FilePath "pre-commit" -Encoding utf8

# Make it executable (if using Git Bash)
chmod +x pre-commit
```

## Linux/Mac
```bash
# Navigate to your git hooks directory
cd .git/hooks

# Create pre-commit hook
cat << 'EOF' > pre-commit
#!/bin/sh
# Run pre-commit checks
npm run verify
EOF

# Make it executable
chmod +x pre-commit
```

This will automatically run tests before every commit, preventing broken code from being committed.
