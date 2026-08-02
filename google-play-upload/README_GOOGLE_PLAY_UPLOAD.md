# IESVRA Boutique - Google Play Console Signed Release Bundle

The Android App Bundle has been **fully signed** with a release keystore and is ready for direct upload to Google Play Console.

---

## 📁 Folder Contents

| File / Folder | Purpose | Google Play Action |
|---|---|---|
| 📦 `app-release.aab` | **Signed App Bundle** *(6.0 MB)* | **Upload this file directly to Google Play Console** |
| 📱 `app-release.apk` | **Signed Release APK** *(6.3 MB)* | Install & test directly on Android devices |
| 🔑 `iesvra-release-key.jks` | **Release Keystore File** | Keep safe for future app updates & version releases |
| 📂 `android-project/` | **Android Studio Project** | Complete source code configured with release signing |

---

## 🔑 Keystore Information (Keep Secure)
- **Keystore File**: `iesvra-release-key.jks`
- **Alias**: `iesvra-key`
- **Store Password**: `iesvrapassword123`
- **Key Password**: `iesvrapassword123`

---

## 🚀 How to Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console).
2. Open your App (*IESVRA*).
3. In the left navigation panel, click **Production** (or **Internal testing** / **Closed testing**).
4. Click **Create new release**.
5. Drag and drop **`app-release.aab`** into the upload box.
6. Google Play will accept it without errors!
