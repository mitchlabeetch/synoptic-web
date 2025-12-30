// src/app/(marketing)/library/LibraryPageClient.tsx
// PURPOSE: Client-side Library page with state management
// ACTION: Manages tile selection, modal state, and import flow
// MECHANISM: Uses library components with zustand integration

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LibraryGrid, PreviewModal } from '@/components/library';
import { LIBRARY_TILES } from '@/services/library/registry';
import { LibraryTile, IngestedContent } from '@/services/library/types';
import { useProjectStore } from '@/lib/store/projectStore';
import { generateCreditsPage } from '@/components/library/CreditsPageGenerator';
import { cn } from '@/lib/utils';
import { 
  Library, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LibraryPageClient() {
  const router = useRouter();
  const t = useTranslations('Library');
  
  // Modal state
  const [selectedTile, setSelectedTile] = useState<LibraryTile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle tile click
  const handleTileClick = useCallback((tile: LibraryTile) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTile(null);
  }, []);

  // Handle content import
  const handleImport = useCallback((tile: LibraryTile, content: IngestedContent) => {
    // Close modal
    setIsModalOpen(false);

    // Add credits page if attribution required
    if (tile.license.type === 'attribution' && content.credits) {
      const creditsPage = generateCreditsPage(content.credits.sources);
      content.pages.push(creditsPage);
    }

    // TODO: Create new project with ingested content
    // For now, redirect to dashboard and let them create a project
    console.log('Imported content:', content);
    
    // Store content temporarily and redirect to project creation
    sessionStorage.setItem('library-import', JSON.stringify({
      tile: tile.id,
      content,
    }));
    
    router.push('/dashboard?import=library');
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Library className="w-4 h-4" />
              60+ Free Content Sources
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-primary via-violet-600 to-blue-600 bg-clip-text text-transparent">
              Discovery Library
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            Browse free, curated content for your bilingual book projects. 
            Sacred texts, classic literature, museum art, and more—all license-verified.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>
                <strong>{LIBRARY_TILES.filter(t => t.license.type === 'commercial-safe').length}</strong> Commercial Safe
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-yellow-600" />
              <span>
                <strong>{LIBRARY_TILES.filter(t => t.license.type === 'attribution').length}</strong> Attribution Required
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                <strong>{new Set(LIBRARY_TILES.map(t => t.category)).size}</strong> Categories
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => {
                document.getElementById('library-grid')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Browse Library
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Library Grid Section */}
      <section id="library-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LibraryGrid
          tiles={LIBRARY_TILES}
          onTileClick={handleTileClick}
        />
      </section>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        tile={selectedTile}
        onImport={handleImport}
      />

      {/* Bottom CTA */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to start your bilingual book?
          </h2>
          <p className="text-muted-foreground mb-6">
            Import any source above and start translating in Synoptic Studio.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/signup">Get Started Free</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/about">Learn More</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
