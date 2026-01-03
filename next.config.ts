import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /**
   * React Compiler Configuration
   * 
   * The React Compiler (formerly React Forget) automatically memoizes components
   * and their values, eliminating the need for manual useMemo/useCallback.
   * 
   * Currently DISABLED until babel-plugin-react-compiler is installed.
   * 
   * To enable:
   * 1. Run: npm install babel-plugin-react-compiler --save-dev
   * 2. Change this to: reactCompiler: true
   * 
   * For opt-in mode (recommended for gradual adoption):
   * reactCompiler: { compilationMode: 'annotation' }
   * Then add 'use memo' directive to components you want optimized.
   */
  reactCompiler: false,
  
  // Remote image patterns for library sources
  images: {
    // SECURITY: Strict size limits to prevent DoS via "image bombs"
    // These limits protect the image optimization API from being abused
    // with extremely large images that could overwhelm server resources
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Max 1920px wide
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Small icons/thumbnails
    
    // Limit image optimization to prevent abuse
    minimumCacheTTL: 60, // 1 minute minimum cache
    
    remotePatterns: [
      // Museums
      { hostname: "images.metmuseum.org" },
      { hostname: "www.artic.edu" },
      { hostname: "lh3.ggpht.com" }, // Rijksmuseum
      { hostname: "collectionapi.metmuseum.org" },
      
      // NASA & Science
      { hostname: "apod.nasa.gov" },
      
      // Food & Recipes
      { hostname: "www.themealdb.com" },
      
      // Knowledge & Encyclopedia
      { hostname: "upload.wikimedia.org" },
      { hostname: "en.wikipedia.org" },
      
      // News & History
      { hostname: "chroniclingamerica.loc.gov" },
      { hostname: "tile.loc.gov" },
      
      // Comics & Pop Culture
      { hostname: "imgs.xkcd.com" },
      { hostname: "raw.githubusercontent.com" }, // Pokemon sprites
      
      // General / Stock
      { hostname: "images.unsplash.com" },
      { hostname: "source.unsplash.com" },
      
      // Books
      { hostname: "covers.openlibrary.org" },
      { hostname: "standardebooks.org" },
    ],
  },
};

export default withNextIntl(nextConfig);

