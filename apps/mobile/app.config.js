// Layers the app identity on top of app.json, so one codebase builds two apps.
// EXPO_PUBLIC_APP_MODE picks which one: "vendor" (default) or "customer".
// The same variable selects the opening screens in src/config/app.ts.
const APPS = {
  customer: { name: "Surfa", package: "com.surfa.customer" },
  vendor: { name: "Surfa Vendor", package: "com.surfa.vendor" },
};

module.exports = ({ config }) => {
  const mode = process.env.EXPO_PUBLIC_APP_MODE === "customer" ? "customer" : "vendor";
  const app = APPS[mode];
  return {
    ...config,
    name: app.name,
    android: { ...config.android, package: app.package },
    ios: { ...config.ios, bundleIdentifier: app.package },
  };
};
