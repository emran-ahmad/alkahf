# Contributing to alkahf

Thank you for your interest in improving alkahf! This guide will help you get set up and submit quality contributions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

Be respectful, constructive, and professional. Harassment or abusive behavior of any kind will not be tolerated.

---

## Getting Started

```bash
# Fork the repo, then clone your fork
git clone https://github.com/your-username/alkahf.git
cd alkahf

# Install dependencies
npm install

# Start in development mode
npm start
```

For a closer look at IPC messages between processes, open DevTools by temporarily uncommenting this line in `main.js`:

```js
// mainWindow.webContents.openDevTools();
```

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** — keep commits small and focused.

3. **Test manually** before opening a PR:
   - Test on the target OS if possible
   - Verify the database isn't corrupted after your changes
   - Check that auto-backup still works on startup

4. **Push your branch** and open a Pull Request against `main`.

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Code restructure (no feature/fix) |
| `perf` | Performance improvement |
| `chore` | Build, tooling, or config changes |

**Examples:**
```
feat(customer): add bulk delete support
fix(database): prevent crash when backup folder is missing
docs(readme): add screenshots section
```

---

## Pull Request Guidelines

- **One PR per feature or fix** — keep it focused
- Fill out the PR template completely
- Link any related issues in the description (`Closes #123`)
- Keep diffs clean — avoid unnecessary whitespace changes
- PRs that break the database schema must include a migration plan

---

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md).

Include:
- OS and Node.js version
- Steps to reproduce
- Expected vs. actual behavior
- Any error messages from the terminal

---

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md).

Explain:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

---

## Questions?

Open a [GitHub Discussion](../../discussions) or email [mr_imran_ahmad@yahoo.com](mailto:mr_imran_ahmad@yahoo.com).
