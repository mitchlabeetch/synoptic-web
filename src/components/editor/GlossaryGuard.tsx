// src/components/editor/GlossaryGuard.tsx
// PURPOSE: Translation Memory Manager for consistent terminology across chapters
// ACTION: Allows users to add, edit, and manage term pairs that enforce translations
// MECHANISM: Uses centralized Zustand store with localStorage persistence

'use client';

import React, { useState, useMemo } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { useGlossaryStore } from '@/lib/store/glossaryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Languages,
  Edit2,
  X,
  Eye,
  EyeOff,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/Toast';
import {
  GlossaryCategory,
  GLOSSARY_CATEGORIES,
} from '@/types/glossaryGuard';

interface GlossaryGuardProps {
  className?: string;
}

export default function GlossaryGuard({ className }: GlossaryGuardProps) {
  const { meta } = useProjectStore();
  const { 
    entries, 
    warnings,
    isLintingEnabled,
    highlightWarnings,
    addEntry, 
    updateEntry, 
    deleteEntry,
    setLintingEnabled,
    setHighlightWarnings,
    importEntriesFromCSV
  } = useGlossaryStore();
  const t = useTranslations('GlossaryGuard');
  
  // Local UI state
  const [newSourceTerm, setNewSourceTerm] = useState('');
  const [newTargetTerm, setNewTargetTerm] = useState('');
  const [newCategory, setNewCategory] = useState<GlossaryCategory>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<GlossaryCategory | 'all'>('all');
  const [isImporting, setIsImporting] = useState(false);
  
  // Hidden file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // CSV Import handler
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    try {
      const text = await file.text();
      const result = importEntriesFromCSV(text);
      
      if (result.imported > 0) {
        toast.success(t('importSuccess'), {
          description: `${result.imported} terms imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}`
        });
      } else if (result.skipped > 0) {
        toast.info(t('importNoNew'), {
          description: `${result.skipped} duplicate terms skipped`
        });
      } else {
        toast.error(t('importFailed'), {
          description: 'No valid entries found in file'
        });
      }
      
      if (result.errors.length > 0) {
        console.warn('[GlossaryGuard] Import errors:', result.errors);
      }
    } catch (error) {
      console.error('[GlossaryGuard] CSV import failed:', error);
      toast.error(t('importFailed'), {
        description: 'Could not read file'
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = 
        entry.sourceTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.targetTerm.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, filterCategory]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: entries.length,
      activeWarnings: warnings.length,
    };
  }, [entries, warnings]);

  // Add new entry
  const handleAddEntry = () => {
    if (!newSourceTerm.trim() || !newTargetTerm.trim()) return;
    
    addEntry(newSourceTerm.trim(), newTargetTerm.trim(), { 
      category: newCategory,
      caseSensitive: false,
      wholeWord: true
    });
    
    setNewSourceTerm('');
    setNewTargetTerm('');
  };

  // Handle update entry
  const handleUpdateEntry = (id: string, updates: { sourceTerm?: string; targetTerm?: string }) => {
    updateEntry(id, updates);
    setEditingId(null);
  };

  return (
    <div className={`flex flex-col h-full bg-card ${className}`}>
      {/* Hidden CSV file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.tsv"
        className="hidden"
        onChange={handleCSVImport}
        aria-label="Import glossary CSV"
      />
      
      {/* Header */}
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            {t('title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            title={t('importCSV')}
          >
            <Upload className="h-3 w-3" />
            <span className="hidden sm:inline">{t('import')}</span>
          </Button>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>{stats.total} {t('termsProtected')}</span>
          </div>
        </div>
      </div>

      {/* Add New Entry Form */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
              {t('addTerm')}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground">
            {t('csvHint')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground uppercase">
              {meta?.source_lang?.toUpperCase() || 'L1'} ({t('source')})
            </label>
            <Input
              value={newSourceTerm}
              onChange={(e) => setNewSourceTerm(e.target.value)}
              placeholder={t('sourceTermPlaceholder')}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground uppercase">
              {meta?.target_lang?.toUpperCase() || 'L2'} ({t('target')})
            </label>
            <Input
              value={newTargetTerm}
              onChange={(e) => setNewTargetTerm(e.target.value)}
              placeholder={t('targetTermPlaceholder')}
              className="h-8 text-xs"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={newCategory} onValueChange={(v) => setNewCategory(v as GlossaryCategory)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GLOSSARY_CATEGORIES).map(([key, { label, icon }]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddEntry}
            disabled={!newSourceTerm.trim() || !newTargetTerm.trim()}
            className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-3 w-3" />
            {t('add')}
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-8 text-xs pl-7"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as GlossaryCategory | 'all')}>
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{t('allCategories')}</SelectItem>
            {Object.entries(GLOSSARY_CATEGORIES).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key} className="text-xs">
                <span className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span>{label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground font-medium">
              {entries.length === 0 ? t('noEntries') : t('noMatchingEntries')}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {t('addTermHint')}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div 
              key={entry.id}
              className="group p-3 rounded-lg border bg-background/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {GLOSSARY_CATEGORIES[entry.category as GlossaryCategory]?.icon || '📝'}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {GLOSSARY_CATEGORIES[entry.category as GlossaryCategory]?.label || 'Custom'}
                    </span>
                  </div>
                  
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <Input
                        value={entry.sourceTerm}
                        onChange={(e) => handleUpdateEntry(entry.id, { sourceTerm: e.target.value })}
                        className="h-7 text-xs"
                      />
                      <Input
                        value={entry.targetTerm}
                        onChange={(e) => handleUpdateEntry(entry.id, { targetTerm: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {entry.sourceTerm}
                      </span>
                      <Languages className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
                        {entry.targetTerm}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === entry.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(entry.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEntry(entry.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t bg-muted/5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            {t('guardInfo')}
          </p>
        </div>
      </div>
    </div>
  );
}
