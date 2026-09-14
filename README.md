# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Sentry

The app reports errors to `codesistency-gs/codexgram`. Initialization and the root
error boundary are in `src/app/_layout.tsx`; `metro.config.js` and the Sentry Expo
plugin in `app.json` configure build uploads. Structured logs are enabled; session
replay and default PII collection are disabled.

The app emits `Codexgram initialized` with a `platform` attribute when the root
module initializes. Open Sentry's Logs view and search for that message to verify
delivery after launching the app. Fast Refresh can emit it again during development.
Add operation logs using the SDK directly, with consistent `snake_case` attributes:

```ts
import * as Sentry from '@sentry/react-native';

Sentry.logger.info('Post published', { media_count: 2, duration_ms: 450 });
```

Use `trace`, `debug`, `info`, `warn`, `error`, or `fatal` as appropriate. Include
operation metadata rather than message contents, credentials, or personal data.
Console output is not automatically forwarded to Sentry Logs by this setup.

Open Profile → Settings → Diagnostics → Sentry test to generate synthetic feed
timeouts, upload rejections, malformed responses, recovery logs, or all six log
levels. Errors and logs carry `source: sentry_test`, `scenario`, and `test_run_id`;
filter by `source:sentry_test` in Sentry and use the displayed run ID to correlate
events. The test page stays available in builds and keeps native tabs visible.
Tests do not change account data or intentionally crash the app. A successful
queue flush does not confirm dashboard ingestion.

Settings includes a **Share feedback** card and **Report a problem** action that
open Sentry's feedback form. The form uses Codexgram colors, accepts an optional
name and email, and submits to the project's User Feedback view. Its configuration
lives in the root layout's `feedbackIntegration`; `Sentry.wrap` provides the modal.

The wizard saves `SENTRY_AUTH_TOKEN` in the ignored `.env.local` file for local
builds. EAS builds need the same variable with sensitive visibility in their
environment (currently `development`). Configure it for any new build environments
you add. Never put the token in app config or an `EXPO_PUBLIC_*` variable.

Rebuild the development client after installing Sentry. For local native builds,
run `npx expo prebuild` and then `npm run ios` or `npm run android`. EAS generates
the native projects automatically.

To verify delivery, temporarily call
`Sentry.captureException(new Error('Codexgram Sentry smoke test'))` from a development
screen and confirm it appears in the
[Sentry project](https://codesistency-gs.sentry.io/issues/?project=4512078093942864).
Verify readable stack traces and symbol uploads with a release build.

See the [Expo Sentry guide](https://docs.expo.dev/guides/using-sentry/) for build
and EAS Update source-map upload instructions.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
