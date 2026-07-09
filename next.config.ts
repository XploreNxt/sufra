import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Portal subdomains used in local dev (vendor.localhost, etc.). Harmless in
  // production where the real subdomains are same-origin anyway.
  allowedDevOrigins: [
    "vendor.localhost",
    "rider.localhost",
    "admin.localhost",
  ],
};

export default nextConfig;
