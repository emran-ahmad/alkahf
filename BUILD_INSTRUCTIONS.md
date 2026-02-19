# Build Instructions - alkahf Tailoring Suite

## Production Build Setup

### Prerequisites
- Node.js 16.x or higher
- npm 8.x or higher
- All dependencies installed (`npm install`)

### Quick Build Commands

```bash
# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux

# Build for all platforms (current platform)
npm run build
```

### Output

Built applications will be in the `dist/` folder:
- **macOS**: `.dmg` installer and `.zip` archive
- **Windows**: `.exe` NSIS installer and portable `.exe`
- **Linux**: `.AppImage` and `.deb` package

### Icon Configuration

Current build uses `assets/icon.png` (PNG). For best Windows appearance generate a multi-size `assets/icon.ico` (16–256px) and set `build.win.icon` and optionally provide 1024×1024 PNG for future macOS `.icns` conversion.

### Current Icon Setup

✅ Unified window/build icon: `assets/icon.png`
🟡 Recommended improvement: add `assets/icon.ico` for Windows clarity
🟡 Recommended improvement: add `assets/icon.icns` for macOS dock fidelity

### Build Configuration

The build is configured in `package.json` under the `build` section:

- **App ID**: `com.systemdecode.alkahf`
- **Product Name**: alkahf
- **Copyright**: Copyright © 2025 Imran Ahmad
- **Output Directory**: `dist/`

### Distribution

After building:

1. **macOS**:
   - Distribute the `.dmg` file
   - Users drag app to Applications folder
   - App signed and notarized (if certificates configured)

2. **Windows**:
   - Distribute the NSIS `.exe` installer
   - Or the portable `.exe` for no-install usage
   - Includes automatic updates support

3. **Linux**:
   - Distribute `.AppImage` (universal, no install needed)
   - Or `.deb` for Debian/Ubuntu systems

### File Size

Expected build sizes:
- macOS: ~150-200 MB
- Windows: ~120-180 MB
- Linux: ~150-200 MB

### Important Notes

- Database files in `database/` are excluded from builds (see .gitignore)
- Each fresh install creates a new database
- Users should backup their `database/` folder regularly
- Auto-backup feature creates backups in `database/backups/auto/`

### Troubleshooting

**Build fails on macOS:**
- Ensure Xcode Command Line Tools installed: `xcode-select --install`

**Build fails on Windows:**
- Ensure Windows SDK is installed
- Run build in Administrator mode if needed

**Build fails on Linux:**
- Install required dependencies: `sudo apt-get install -y rpm`

**Icon not showing:**
- The current logo (462x236) works but isn't ideal
- For best results, create a square 1024x1024 version
- Update paths in package.json if you create new icon files

### Production Checklist

Before building for production:

- [ ] Remove or comment out `webContents.openDevTools()` in main.js ✅ (Already done)
- [ ] Test all features thoroughly
- [ ] Update version number in package.json
- [ ] Update CHANGELOG.md
- [ ] Ensure database backups work
- [ ] Test on target platform
- [ ] Check file permissions
- [ ] Verify icon displays correctly

### Version Management

To release a new version:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Tag release: `git tag v1.0.0`
5. Build for all platforms
6. Test installers
7. Distribute to users

---

**Powered by Imran Ahmad** - Professional Software Solutions (alkahf)
