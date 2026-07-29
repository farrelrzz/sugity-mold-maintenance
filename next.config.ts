import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dev dari IP jaringan lokal
  allowedDevOrigins: ['172.20.10.2'],
};

export default nextConfig;
