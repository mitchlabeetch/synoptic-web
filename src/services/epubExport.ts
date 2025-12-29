// src/services/epubExport.ts
import JSZip from 'jszip';

interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  identifier: string;
  publisher?: string;
  description?: string;
}

export async function generateEpub(
  project: any,
  metadata: EpubMetadata
): Promise<Blob> {
  const zip = new JSZip();

  // Required: mimetype (uncompressed)
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

  // content.opf (Package Document)
  oebps?.file('content.opf', generateOPF(project, metadata));

  // toc.ncx (Navigation)
  oebps?.file('toc.ncx', generateNCX(project, metadata));

  // nav.xhtml (EPUB3 Navigation)
  oebps?.file('nav.xhtml', generateNav(project));

  // styles.css
  oebps?.file('styles.css', generateEpubCSS());

  // Content files
  const pages = project.content.pages || [];
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
  });
}

function generateOPF(project: any, metadata: EpubMetadata): string {
  const pages = project.content.pages || [];
  const items = pages
    .map(
      (_: any, i: number) =>
        `<item id="chapter${i + 1}" href="chapter${
          i + 1
        }.xhtml" media-type="application/xhtml+xml"/>`
    )
    .join('\n    ');

  const spine = pages
    .map((_: any, i: number) => `<itemref idref="chapter${i + 1}"/>`)
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${metadata.identifier}</dc:identifier>
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.author}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <meta property="dcterms:modified">${
      new Date().toISOString().split('.')[0]
    }Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    ${items}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>`;
}

function generateNCX(project: any, metadata: EpubMetadata): string {
  const pages = project.content.pages || [];
  const navPoints = pages
    .map(
      (page: any, i: number) => `
    <navPoint id="navpoint${i + 1}" playOrder="${i + 1}">
      <navLabel><text>Page ${i + 1}</text></navLabel>
      <content src="chapter${i + 1}.xhtml"/>
    </navPoint>
  `
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${metadata.identifier}"/>
  </head>
  <docTitle><text>${metadata.title}</text></docTitle>
  <navMap>${navPoints}</navMap>
</ncx>`;
}

function generateNav(project: any): string {
  const pages = project.content.pages || [];
  const items = pages
    .map((_: any, i: number) => `<li><a href="chapter${i + 1}.xhtml">Page ${i + 1}</a></li>`)
    .join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>${items}</ol>
  </nav>
</body>
</html>`;
}

function generateChapterXHTML(page: any, index: number, project: any): string {
  const blocks = page.blocks || [];
  const content = blocks
    .map((block: any) => {
      if (block.type === 'text') {
        const sourceLang = project.source_lang || 'fr';
        const targetLang = project.target_lang || 'en';
        return `
        <div class="bilingual">
          <p class="source" lang="${sourceLang}">${block.L1.content}</p>
          <p class="translation" lang="${targetLang}">${block.L2.content}</p>
        </div>
      `;
      }
      return '';
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Page ${index + 1}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <section>${content}</section>
</body>
</html>`;
}

function generateEpubCSS(): string {
  return `
body { font-family: serif; line-height: 1.6; padding: 5%; }
.bilingual { margin-bottom: 2em; }
.source { font-weight: bold; margin-bottom: 0.5em; font-size: 1.1em; }
.translation { color: #444; font-style: italic; }
  `;
}
