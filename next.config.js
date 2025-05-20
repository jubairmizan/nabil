/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["nabil-backend-dev.projectsample.info"],
  },
  env: {
    NEXT_PUBLIC_API_URL: "https://nabil-backend-dev.projectsample.info",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              upgrade-insecure-requests;
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              connect-src 'self' https: http: https://nabil-backend-dev.projectsample.info http://localhost:8000 https://nabil-dev.old19.com ws://localhost:8282 ws://localhost:8182;
              img-src 'self' data:;
              style-src 'self' 'unsafe-inline';
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
