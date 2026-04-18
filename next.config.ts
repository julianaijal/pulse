import type { NextConfig } from "next";
// @ts-expect-error - next-pwa has no types
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  env: {
    NS_API: process.env.NS_API ?? "",
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
