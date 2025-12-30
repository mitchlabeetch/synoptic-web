import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Disable React Compiler (experimental) - causes too many false positives
  reactCompiler: false,
  
  // Remote image patterns for library sources
  images: {
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

