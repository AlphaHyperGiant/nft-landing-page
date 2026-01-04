## APK Marketplace (iPhone-friendly browser UI)

This is a **static APK marketplace template** optimized for iPhone users to **browse** apps and **share/copy** download links to an Android device.

### Key features

- **Search + filter + sort** over a sample catalog
- **App details modal** with metadata and safety messaging
- **iPhone-friendly actions**: `Share` (Web Share API) + `Copy link`
- **PWA manifest** for “Add to Home Screen”

### Customize the catalog

Edit the sample app list in `js/app.js`:

- Update each app’s `downloadUrl` to your real APK hosting URL
- Add/remove fields as needed (category, tags, version, size, etc.)

### Important note

iOS can’t install APKs. This UI is intended for **discovery** and **link-sharing**.
