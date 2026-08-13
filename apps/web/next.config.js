/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Two Next servers in the same folder share .next and corrupt each other's
  // route manifest — the test server would silently 404 routes in the dev
  // server you are using. scripts/run-e2e.sh sets this so it builds elsewhere.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // Runs instrumentation.ts at server start. That file refuses to boot when
    // DEMO_MODE is set in a production runtime, so an insecure deploy fails
    // loudly instead of quietly allowing password-free sign-in.
    instrumentationHook: true,
  },
}

module.exports = nextConfig
