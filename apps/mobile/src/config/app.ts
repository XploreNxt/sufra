export type AppMode = "customer" | "vendor" | "rider";

const MODES: readonly AppMode[] = ["customer", "vendor", "rider"];
const requested = process.env.EXPO_PUBLIC_APP_MODE as AppMode | undefined;

/**
 * Which app shell to open. Set at build time with EXPO_PUBLIC_APP_MODE:
 * "vendor" (default), "customer" or "rider".
 * app.config.js reads the same variable for the app name and package.
 */
export const APP_MODE: AppMode = requested && MODES.includes(requested) ? requested : "vendor";
