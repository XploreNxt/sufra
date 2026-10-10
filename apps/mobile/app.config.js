// Layers the app identity on top of app.json, so one codebase builds three apps.
// EXPO_PUBLIC_APP_MODE picks which one: "vendor" (default), "customer" or "rider".
// The same variable selects the opening screens in src/config/app.ts.
const APPS = {
  customer: { name: "Surfa", package: "com.surfa.customer" },
  vendor: { name: "Surfa Vendor", package: "com.surfa.vendor" },
  rider: { name: "Surfa Rider", package: "com.surfa.rider" },
};

module.exports = ({ config }) => {
  const app = APPS[process.env.EXPO_PUBLIC_APP_MODE] ?? APPS.vendor;
  return {
    ...config,
    name: app.name,
    android: { ...config.android, package: app.package },
    ios: { ...config.ios, bundleIdentifier: app.package },
  };
};
