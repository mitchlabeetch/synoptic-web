import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Disable React Compiler (experimental) - causes too many false positives
  reactCompiler: false,
};

export default withNextIntl(nextConfig);

