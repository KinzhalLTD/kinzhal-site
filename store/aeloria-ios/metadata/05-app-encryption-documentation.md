# 5. App Encryption Documentation

App Store Connect → **App Information → App Encryption Documentation**. Answer this once per build when you upload.

**Does your app use encryption?** Yes. It uses only encryption that is **exempt**:

- standard HTTPS/TLS through Apple's own networking (WKWebView / URLSession), for example fetching the App Store receipt through StoreKit
- no proprietary or non-standard cryptography
- no custom encryption of user data

**Which exemption applies?** "Your app uses encryption limited to that within the Apple operating system" (Category 5 Part 2 exemption, mass market / standard OS crypto).

**Documentation upload:** not required for the exempt case. No CCATS or French declaration is needed.

## Info.plist (skips the question on every upload)

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

If a future version adds its own encryption, for example end-to-end encrypted chat, revisit this answer.
