import type { NextConfig } from "next";
import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

// Step 1: Add i18n plugin wrapper with correct path to your request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts"); // Adjust if in a different location

// Step 2: Setup Bundle Analyzer
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

// Step 3: Your base config
const baseConfig: NextConfig = {
  reactCompiler: true,
  images: {
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        hostname: "**",
        pathname: "/**"
      },
      {
        protocol: (process.env.PROTOCOL as "http" | "https") ?? "https",
        hostname: process.env.HOST_NAME ?? "localhost",
        port: process.env.PORT ?? "3000",
        pathname: "/external-resource/**"
      }
    ]
  },
  webpack: (config, { webpack }) => {
    config.experiments = {
      ...config.experiments,
      layers: true,
      topLevelAwait: true
    };
    return config;
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false
  },
  devIndicators: {
    position: "bottom-left"
  },
  typescript: {
    ignoreBuildErrors: false
  },
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/index", destination: "/" },
        { source: "/index.html", destination: "/" },
        { source: "/index.php", destination: "/" }
      ],
      afterFiles: [{ source: "/non-existent", destination: "/somewhere-else" }]
      // fallback: [
      //   {
      //     source: "/external-api/:path*",
      //     destination: `${process.env.API_URL}:path*`,
      //   },
      //   {
      //     source: "/external-resource/:path*",
      //     destination: `${process.env.RESOURCE_URL}:path*`,
      //   }
      // ]
    };
  }
};

// Step 4: Wrap with next-intl and bundle-analyzer
const intlConfig = withNextIntl(baseConfig);
export default bundleAnalyzer(intlConfig);
