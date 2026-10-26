import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

function logoImageHosts(): string[] {
  return (process.env.LOGO_IMAGE_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function logoImgSrc(): string[] {
  return logoImageHosts().map((host) => (/^https?:\/\//i.test(host) ? host : `https://${host}`));
}

function logoRemotePatterns(): { protocol: "http" | "https"; hostname: string }[] {
  return logoImgSrc().flatMap((source) => {
    const match = source.match(/^(https?):\/\/([^/]+)/i);
    if (!match) {
      return [];
    }
    return [
      {
        protocol: match[1].toLowerCase() as "http" | "https",
        hostname: match[2],
      },
    ];
  });
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob: https: http:", ...logoImgSrc()].join(" "),
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: logoRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    const permanent = true;
    return [
      {
        source: "/inventory/movements",
        destination: "/inventory/materials/report",
        permanent,
      },
      // Legacy paths → navigation-group URLs
      { source: "/companies", destination: "/masters/companies", permanent },
      { source: "/companies/:path*", destination: "/masters/companies/:path*", permanent },
      { source: "/inventory/units", destination: "/masters/units", permanent },
      { source: "/inventory/units/:path*", destination: "/masters/units/:path*", permanent },
      { source: "/users", destination: "/administration/users", permanent },
      { source: "/users/:path*", destination: "/administration/users/:path*", permanent },
      { source: "/roles", destination: "/administration/roles", permanent },
      { source: "/roles/:path*", destination: "/administration/roles/:path*", permanent },
      { source: "/permissions", destination: "/administration/permissions", permanent },
      { source: "/permissions/:path*", destination: "/administration/permissions/:path*", permanent },
      { source: "/branches", destination: "/administration/branches", permanent },
      { source: "/branches/:path*", destination: "/administration/branches/:path*", permanent },
      { source: "/departments", destination: "/administration/departments", permanent },
      { source: "/departments/:path*", destination: "/administration/departments/:path*", permanent },
      { source: "/warehouses", destination: "/administration/warehouses", permanent },
      { source: "/warehouses/:path*", destination: "/administration/warehouses/:path*", permanent },
      {
        source: "/organization-settings",
        destination: "/administration/organization-settings",
        permanent,
      },
      {
        source: "/organization-settings/:path*",
        destination: "/administration/organization-settings/:path*",
        permanent,
      },
      { source: "/audit-logs", destination: "/administration/audit-logs", permanent },
      { source: "/audit-logs/:path*", destination: "/administration/audit-logs/:path*", permanent },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
