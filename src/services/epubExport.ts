// src/services/epubExport.ts
// PURPOSE: Generate valid EPUB 3 files from project content
// ACTION: Builds complete .epub archive with all block types rendered
// MECHANISM: Uses JSZip to create the EPUB structure with proper XML/XHTML content

import JSZip from 'jszip';
import { sanitizeForXML, escapeHTML } from '@/lib/sanitize';

interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  identifier: string;
  publisher?: string;
  description?: string;
  coverUrl?: string;
}

interface ImageAsset {
  id: string;
  filename: string;
  data: Uint8Array;
  mediaType: string;
}

export async function generateEpub(
  project: any,
  metadata: EpubMetadata,
  imageAssets: ImageAsset[] = []
): Promise<Blob> {
  const zip = new JSZip();

  // Required: mimetype (uncompressed, must be first file)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF/container.xml
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder('OEBPS');
  const images = oebps?.folder('images');

  // Add image assets
  for (const asset of imageAssets) {
    images?.file(asset.filename, asset.data);
  }

  // content.opf (Package Document)
  oebps?.file('content.opf', generateOPF(project, metadata, imageAssets));

  // toc.ncx (EPUB 2 Navigation - for compatibility)
  oebps?.file('toc.ncx', generateNCX(project, metadata));

  // nav.xhtml (EPUB 3 Navigation)
  oebps?.file('nav.xhtml', generateNav(project));

  // styles.css
  oebps?.file('styles.css', generateEpubCSS(project));

  // Content files (chapters)
  const pages = project.content?.pages || [];
  pages.forEach((page: any, index: number) => {
    oebps?.file(
      `chapter${index + 1}.xhtml`,
      generateChapterXHTML(page, index, project)
    );
  });

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

function generateOPF(project: any, metadata: EpubMetadata, imageAssets: ImageAsset[]): string {
  const pages = project.content?.pages || [];
  
  // Chapter items
  const chapterItems = pages
    .map(
      (_: any, i: number) =>
        `    <item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
    )
    .join('\n');

  // Image items
  const imageItems = imageAssets
    .map(
      (img) =>
        `    <item id="${img.id}" href="images/${img.filename}" media-type="${img.mediaType}"/>`
    )
    .join('\n');

  // Spine
  const spine = pages
    .map((_: any, i: number) => `    <itemref idref="chapter${i + 1}"/>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${escapeHTML(metadata.identifier)}</dc:identifier>
    <dc:title>${escapeHTML(metadata.title)}</dc:title>
    <dc:creator>${escapeHTML(metadata.author)}</dc:creator>
    <dc:language>${escapeHTML(metadata.language)}</dc:language>
    ${metadata.publisher ? `<dc:publisher>${escapeHTML(metadata.publisher)}</dc:publisher>` : ''}
    ${metadata.description ? `<dc:description>${escapeHTML(metadata.description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
${chapterItems}
${imageItems}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>`;
}

function generateNCX(project: any, metadata: EpubMetadata): string {
  const pages = project.content?.pages || [];
  const navPoints = pages
    .map(
      (page: any, i: number) => `
    <navPoint id="navpoint${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${page.chapterTitle ? escapeHTML(page.chapterTitle) : `Page ${i + 1}`}</text></navLabel>
      <content src="chapter${i + 1}.xhtml"/>
    </navPoint>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeHTML(metadata.identifier)}"/>
  </head>
  <docTitle><text>${escapeHTML(metadata.title)}</text></docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
}

function generateNav(project: any): string {
  const pages = project.content?.pages || [];
  const items = pages
    .map((page: any, i: number) => 
      `      <li><a href="chapter${i + 1}.xhtml">${page.chapterTitle ? escapeHTML(page.chapterTitle) : `Page ${i + 1}`}</a></li>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Generate XHTML for a single chapter/page with ALL block types
 */
function generateChapterXHTML(page: any, index: number, project: any): string {
  const blocks = page.blocks || [];
  const sourceLang = project.source_lang || project.meta?.source_lang || 'fr';
  const targetLang = project.target_lang || project.meta?.target_lang || 'en';
  
  const content = blocks
    .map((block: any) => renderBlockToXHTML(block, sourceLang, targetLang))
    .filter(Boolean)
    .join('\n');

  const pageTitle = page.chapterTitle || `Page ${index + 1}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${sourceLang}">
<head>
  <title>${escapeHTML(pageTitle)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  ${page.isChapterStart ? `<section epub:type="chapter" class="chapter-start">` : '<section>'}
    ${page.chapterTitle ? `<h2 class="chapter-title">${escapeHTML(page.chapterTitle)}</h2>` : ''}
    ${content}
  </section>
</body>
</html>`;
}

/**
 * Render a single block to XHTML - handles ALL block types
 */
function renderBlockToXHTML(block: any, sourceLang: string, targetLang: string): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block, sourceLang, targetLang);
    
    case 'image':
      return renderImageBlock(block);
    
    case 'separator':
      return renderSeparatorBlock(block);
    
    case 'callout':
      return renderCalloutBlock(block, sourceLang, targetLang);
    
    case 'table':
      return renderTableBlock(block);
    
    case 'stamp':
      return renderStampBlock(block);
    
    default:
      console.warn(`Unknown block type in EPUB export: ${block.type}`);
      return '';
  }
}

/**
 * Render text block with bilingual content
 */
function renderTextBlock(block: any, sourceLang: string, targetLang: string): string {
  const l1Content = sanitizeForXML(block.L1?.content || '');
  const l2Content = sanitizeForXML(block.L2?.content || '');
  
  // Determine block classes
  const classes = ['bilingual'];
  if (block.isTitle) classes.push('title');
  if (block.isChapterHeading) classes.push('chapter-heading');
  if (block.isVerse) classes.push('verse');
  
  const layout = block.layout || 'side-by-side';

  return `
    <div class="${classes.join(' ')} layout-${layout}">
      <p class="source" lang="${sourceLang}">${l1Content}</p>
      <p class="translation" lang="${targetLang}">${l2Content}</p>
    </div>`;
}

/**
 * Render image block with caption
 */
function renderImageBlock(block: any): string {
  const altText = escapeHTML(block.altText || 'Image');
  const captionL1 = block.caption?.L1 ? sanitizeForXML(block.caption.L1) : '';
  const captionL2 = block.caption?.L2 ? sanitizeForXML(block.caption.L2) : '';
  
  // For EPUB, we need to reference images in the images folder
  // The URL should be converted to a local reference
  const imageSrc = block.url?.startsWith('data:') 
    ? block.url 
    : `images/${block.url?.split('/').pop() || 'image.jpg'}`;
  
  return `
    <figure class="image-block" style="text-align: ${block.alignment || 'center'}">
      <img src="${escapeHTML(imageSrc)}" alt="${altText}" style="max-width: ${block.width || 100}%"/>
      ${captionL1 || captionL2 ? `
      <figcaption>
        ${captionL1 ? `<span class="caption-source">${captionL1}</span>` : ''}
        ${captionL2 ? `<span class="caption-translation">${captionL2}</span>` : ''}
      </figcaption>` : ''}
    </figure>`;
}

/**
 * Render separator/divider block
 */
function renderSeparatorBlock(block: any): string {
  const style = block.style || 'line';
  
  // Ornament separators
  if (style.startsWith('ornament-')) {
    const ornamentMap: Record<string, string> = {
      'ornament-fleuron': '❦',
      'ornament-stars': '✦ ✦ ✦',
      'ornament-diamond': '◆',
      'ornament-vine': '❧',
    };
    const ornament = ornamentMap[style] || '* * *';
    return `<div class="separator ornament">${ornament}</div>`;
  }
  
  // Custom emoji/SVG
  if (style === 'custom') {
    if (block.customEmoji) {
      return `<div class="separator ornament">${escapeHTML(block.customEmoji)}</div>`;
    }
    // Skip custom SVG for EPUB as it may not be supported
    return `<div class="separator ornament">* * *</div>`;
  }
  
  // Line-based separators
  const borderStyle = style === 'double-line' ? 'double' :
                      style === 'dashed' ? 'dashed' :
                      style === 'dotted' ? 'dotted' :
                      style === 'gradient' ? 'solid' : 'solid';
  
  return `<hr class="separator ${style}" style="width: ${block.width || 80}%; border-style: ${borderStyle}; border-width: ${block.thickness || 1}px 0 0 0; border-color: ${block.color || '#cccccc'};"/>`;
}

/**
 * Render callout/note block
 */
function renderCalloutBlock(block: any, sourceLang: string, targetLang: string): string {
  const calloutType = block.calloutType || 'note';
  const title = block.title ? escapeHTML(block.title) : calloutType.toUpperCase();
  const content = sanitizeForXML(block.content || block.L1?.content || '');
  const contentL2 = block.L2?.content ? sanitizeForXML(block.L2.content) : '';
  
  // Icon mapping for EPUB (using text alternatives)
  const iconMap: Record<string, string> = {
    note: '📝',
    tip: '💡',
    warning: '⚠️',
    grammar: '📖',
    vocabulary: '📚',
    culture: '🌍',
    pronunciation: '🗣️',
    'false-friend': '⚡',
  };
  const icon = iconMap[calloutType] || '📝';

  return `
    <aside class="callout callout-${calloutType}" style="border-left-color: ${block.headerColor || '#3b82f6'}; background-color: ${block.backgroundColor || '#f8fafc'};">
      <div class="callout-header">
        <span class="callout-icon">${icon}</span>
        <span class="callout-title">${title}</span>
      </div>
      <div class="callout-body">
        <p class="source" lang="${sourceLang}">${content}</p>
        ${contentL2 ? `<p class="translation" lang="${targetLang}">${contentL2}</p>` : ''}
      </div>
    </aside>`;
}

/**
 * Render table block
 */
function renderTableBlock(block: any): string {
  const rows = block.rows || [];
  
  const tableContent = rows.map((row: any[], rowIndex: number) => {
    const cells = row.map((cell: any) => {
      const tag = cell.isHeader ? 'th' : 'td';
      const attrs = [];
      if (cell.colspan && cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`);
      if (cell.rowspan && cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`);
      if (cell.alignment) attrs.push(`style="text-align: ${cell.alignment}"`);
      
      return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${sanitizeForXML(cell.content || '')}</${tag}>`;
    }).join('');
    
    return `<tr>${cells}</tr>`;
  }).join('\n');

  return `
    <table class="data-table" style="border-color: ${block.borderColor || '#dddddd'}; border-width: ${block.borderWidth || 1}px;">
      ${tableContent}
    </table>`;
}

/**
 * Render stamp block (semantic markers)
 */
function renderStampBlock(block: any): string {
  const label = escapeHTML(block.label || '');
  const icon = block.icon || '🏷️';
  
  return `<span class="stamp" style="color: ${block.color || '#000000'}; background-color: ${block.backgroundColor || '#f0f0f0'};">${icon} ${label}</span>`;
}

/**
 * Generate comprehensive CSS for EPUB
 */
function generateEpubCSS(project?: any): string {
  const settings = project?.settings || {};
  const bodyFont = settings.fonts?.body || 'Georgia, serif';
  const headingFont = settings.fonts?.heading || 'Georgia, serif';
  
  return `
/* Base Typography */
body {
  font-family: ${bodyFont};
  line-height: 1.6;
  margin: 5%;
  padding: 0;
  color: #1a1a1a;
}

/* Table of Contents */
nav ol {
  list-style-type: decimal;
  padding-left: 2em;
}
nav li {
  margin: 0.5em 0;
}

/* Chapter Styles */
.chapter-start {
  page-break-before: always;
}
.chapter-title {
  font-family: ${headingFont};
  font-size: 1.8em;
  font-weight: bold;
  text-align: center;
  margin: 2em 0 1em 0;
  color: #333;
}

/* Bilingual Text Blocks */
.bilingual {
  margin-bottom: 1.5em;
}
.bilingual.title .source,
.bilingual.title .translation {
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
}
.bilingual.chapter-heading .source,
.bilingual.chapter-heading .translation {
  font-size: 1.3em;
  font-weight: bold;
  font-style: italic;
  text-align: center;
}
.bilingual.verse {
  padding-left: 1em;
  border-left: 2px solid #ddd;
}

.source {
  font-weight: normal;
  color: #111;
  margin-bottom: 0.3em;
}
.translation {
  font-style: italic;
  color: #555;
  font-size: 0.95em;
}

/* Layout variations */
.layout-side-by-side {
  display: flex;
  gap: 1em;
}
.layout-side-by-side .source,
.layout-side-by-side .translation {
  flex: 1;
}
.layout-interlinear .translation {
  padding-left: 1em;
  border-left: 2px solid #eee;
  margin-left: 0.5em;
}
.layout-stacked .translation {
  margin-top: 0.5em;
}

/* Separators */
.separator {
  text-align: center;
  margin: 2em 0;
}
.separator.ornament {
  font-size: 1.5em;
  color: #888;
  border: none;
}
hr.separator {
  border: none;
  border-top: 1px solid #ccc;
  margin: 2em auto;
}

/* Images */
.image-block {
  margin: 1.5em 0;
  page-break-inside: avoid;
}
.image-block img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}
figcaption {
  margin-top: 0.5em;
  font-size: 0.9em;
  color: #666;
  text-align: center;
}
.caption-source {
  display: block;
}
.caption-translation {
  display: block;
  font-style: italic;
  color: #888;
}

/* Callouts */
.callout {
  margin: 1.5em 0;
  padding: 1em;
  border-left: 4px solid #3b82f6;
  background-color: #f8f9fa;
  page-break-inside: avoid;
}
.callout-header {
  font-weight: bold;
  margin-bottom: 0.5em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.callout-icon {
  font-size: 1.2em;
}
.callout-body .source {
  margin-bottom: 0.5em;
}
.callout-body .translation {
  font-size: 0.9em;
}

/* Callout types */
.callout-grammar { border-left-color: #8b5cf6; background-color: #faf5ff; }
.callout-vocabulary { border-left-color: #10b981; background-color: #ecfdf5; }
.callout-culture { border-left-color: #f59e0b; background-color: #fffbeb; }
.callout-warning { border-left-color: #ef4444; background-color: #fef2f2; }
.callout-tip { border-left-color: #06b6d4; background-color: #ecfeff; }
.callout-pronunciation { border-left-color: #ec4899; background-color: #fdf2f8; }
.callout-false-friend { border-left-color: #f97316; background-color: #fff7ed; }

/* Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.95em;
}
.data-table th,
.data-table td {
  padding: 0.5em;
  border: 1px solid #ddd;
  text-align: left;
}
.data-table th {
  background-color: #f3f4f6;
  font-weight: bold;
}
.data-table tr:nth-child(even) {
  background-color: #fafafa;
}

/* Stamps */
.stamp {
  display: inline-block;
  padding: 0.2em 0.5em;
  border-radius: 0.3em;
  font-size: 0.85em;
  font-weight: 500;
  margin: 0.2em;
}
`;
}
