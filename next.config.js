/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["nabil-backend-dev.projectsample.info"],
  },
  env: {
    // Default API URL for production (Vercel)
    NEXT_PUBLIC_API_URL: "https://nabil-backend-dev.projectsample.info",
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: http: https://nabil-backend-dev.projectsample.info http://localhost:8000; img-src 'self' data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
