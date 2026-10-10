export type AppMode = "customer" | "vendor";

/**
 * Which app shell to open. Set at build time with EXPO_PUBLIC_APP_MODE:
 * "vendor" (default) runs the Surfa vendor app, "customer" the customer app.
 * app.config.js reads the same variable for the app name and package.
 */
export const APP_MODE: AppMode =
  process.env.EXPO_PUBLIC_APP_MODE === "customer" ? "customer" : "vendor";
