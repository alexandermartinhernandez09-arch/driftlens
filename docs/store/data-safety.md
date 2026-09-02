# Google Play — Data safety form (DriftLens 1.0.0)

Use these answers in **Play Console → App content → Data safety**.

## Summary

| Question | Answer |
|----------|--------|
| Does your app collect or share user data? | **No** (for user-provided images/content) |
| Is all data encrypted in transit? | N/A for user images (not transmitted) |
| Can users request deletion? | N/A — no server storage |

## Data types

### Photos and videos

| | |
|---|---|
| **Collected?** | No — processed locally only, not sent to developer servers |
| **Shared?** | No |

### App activity / Analytics

| | |
|---|---|
| **Collected?** | No analytics SDK |
| **Shared?** | No |

### Device or other IDs

| | |
|---|---|
| **Collected?** | No |

## Optional face gate (disclosure text for store listing)

When the user enables face gate, the app downloads ML model files from:

- `cdn.jsdelivr.net` (MediaPipe runtime)
- `storage.googleapis.com` (face detector model)

User images are **not** uploaded as part of this. Mention in “Data safety → Data types → optional” or in app description if Google asks about third-party SDK network access.

## Feedback feature

“Report issue” copies text to clipboard locally. No automatic transmission. **Not** “data collection” by the app.

## Future in-app purchases

When Pro is added, Google Play handles payment data. Declare “Purchase history” as collected by Google, not by DriftLens directly.

## Privacy policy URL

Required: public HTTPS link to `privacy.html`.

Examples:

- `https://yourusername.github.io/driftlens/privacy.html`
- Hosted copy of this repo’s `privacy.html`

Until hosted, Play Console submission will block — set up hosting before upload.
