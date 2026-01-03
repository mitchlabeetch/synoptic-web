// src/lib/utils/pasteSanitizer.ts
// PURPOSE: Clean pasted HTML from Word/Google Docs to match Grid-Lock styling
// ACTION: Strips unwanted inline styles while preserving semantic formatting
// MECHANISM: DOM parsing and selective attribute removal

/**
 * Allowed inline styles that should be preserved during paste.
 * Everything else is stripped to maintain design consistency.
 */
const ALLOWED_STYLES = [
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
];

/**
 * Microsoft Word/Office specific classes and styles to remove
 */
const OFFICE_PATTERNS = [
  /^Mso/i,           // MsoNormal, MsoBodyText, etc.
  /^apple-/i,        // Apple-specific styles
  /^x_/i,            // Google Docs prefixes
  /^gmail_/i,        // Gmail-specific
];

/**
 * Inline styles that are commonly garbage from word processors
 */
const GARBAGE_STYLE_PATTERNS = [
  /margin-?\w*/i,
  /padding-?\w*/i,
  /line-height/i,
  /font-family/i,
  /font-size/i,
  /color(?!:)/i,       // Remove color but keep background-color check
  /background-?\w*/i,
  /mso-\w+/i,          // Microsoft Office specific
  /tab-stops/i,
  /text-indent/i,
  /orphans/i,
  /widows/i,
  /page-break-?\w*/i,
];

/**
 * Sanitize pasted HTML to remove garbage styles from Word/Google Docs.
 * Use this as the transformPastedHTML handler in Tiptap.
 */
export function sanitizePastedHTML(html: string): string {
  // Create a temporary DOM element to parse the HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Process all elements
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  
  const elementsToProcess: Element[] = [];
  let currentNode = walker.nextNode();
  
  while (currentNode) {
    elementsToProcess.push(currentNode as Element);
    currentNode = walker.nextNode();
  }
  
  for (const element of elementsToProcess) {
    // Remove Office-specific class names
    if (element.className) {
      const classes = element.className.split(/\s+/);
      const cleanClasses = classes.filter(cls => 
        !OFFICE_PATTERNS.some(pattern => pattern.test(cls))
      );
      
      if (cleanClasses.length === 0) {
        element.removeAttribute('class');
      } else {
        element.className = cleanClasses.join(' ');
      }
    }
    
    // Clean inline styles
    const styleAttr = element.getAttribute('style');
    if (styleAttr) {
      const cleanedStyle = cleanInlineStyle(styleAttr);
      if (cleanedStyle) {
        element.setAttribute('style', cleanedStyle);
      } else {
        element.removeAttribute('style');
      }
    }
    
    // Remove common garbage attributes
    element.removeAttribute('data-mce-style');
    element.removeAttribute('data-mce-bogus');
    element.removeAttribute('lang');
    element.removeAttribute('dir'); // We'll set direction ourselves
    
    // Convert Word-specific elements to semantic HTML
    const tagName = element.tagName.toLowerCase();
    
    // Remove empty spans that just add styling
    if (tagName === 'span' && !element.textContent?.trim()) {
      element.remove();
      continue;
    }
    
    // Remove font tags (legacy HTML)
    if (tagName === 'font') {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent?.insertBefore(element.firstChild, element);
      }
      element.remove();
    }
  }
  
  // Remove empty paragraphs that Word loves to add
  const emptyParagraphs = doc.body.querySelectorAll('p:empty, p:has(> br:only-child)');
  emptyParagraphs.forEach(p => {
    // Keep if it's the only paragraph
    if (doc.body.querySelectorAll('p').length > 1) {
      p.remove();
    }
  });
  
  return doc.body.innerHTML;
}

/**
 * Clean an inline style string, keeping only allowed properties.
 */
function cleanInlineStyle(styleStr: string): string {
  const declarations = styleStr.split(';').filter(d => d.trim());
  const cleanDeclarations: string[] = [];
  
  for (const declaration of declarations) {
    const [property] = declaration.split(':').map(s => s.trim());
    if (!property) continue;
    
    // Check if this property is garbage
    const isGarbage = GARBAGE_STYLE_PATTERNS.some(pattern => 
      pattern.test(property)
    );
    
    // Check if this property is explicitly allowed
    const isAllowed = ALLOWED_STYLES.some(allowed => 
      property.toLowerCase() === allowed
    );
    
    if (isAllowed && !isGarbage) {
      cleanDeclarations.push(declaration);
    }
  }
  
  return cleanDeclarations.join('; ');
}

/**
 * Use this function to transform pasted text into clean paragraphs.
 * Handles plain text pasting while preserving line breaks.
 */
export function transformPastedText(text: string): string {
  return text
    .split(/\n\n+/)                   // Split on double newlines (paragraphs)
    .map(para => para.trim())          // Trim each paragraph
    .filter(para => para.length > 0)   // Remove empty paragraphs
    .map(para => 
      `<p>${para.replace(/\n/g, '<br>')}</p>` // Single newlines become <br>
    )
    .join('');
}
