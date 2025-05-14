// sitemap-parser.ts - Functions for parsing sitemaps and extracting URLs

// @ts-ignore: Deno module
import { parse as parseXML } from "https://deno.land/x/xml@2.1.1/mod.ts";
// @ts-ignore: Deno module
import { SAXParser } from "https://deno.land/x/xmlp@v0.3.0/mod.ts";
import { SitemapProcessingResult } from "./types";

const MAX_DOM_PARSE_SIZE = 5 * 1024 * 1024;

/**
 * Extract URLs from an XML document
 * @param doc The XML document to extract URLs from
 * @returns Array of URLs found in the document
 */
export function extractUrlsFromXml(doc: any): string[] {
  const urls: string[] = [];
  
  // Function to recursively search for loc elements
  function findLocElements(node: any) {
    if (!node) return;
    
    // Direct case: Check if this is an object with a 'loc' property
    if (typeof node === 'object' && node.loc && typeof node.loc === 'string') {
      urls.push(node.loc.trim());
      return;
    }
    
    // Legacy case: Check if this is a loc element with text content
    if (typeof node === 'object' && node.name && 
        (node.name === 'loc' || node.name.endsWith(':loc')) && 
        node.children && node.children.length > 0) {
        
      // Handle different child types including CDATA
      const child = node.children[0];
      
      // Regular text node
      if (typeof child.text === 'string') {
        urls.push(child.text.trim());
        return;
      }
      
      // CDATA section - might be represented in different ways depending on the XML parser
      if (child.name === '$cdata' && typeof child.text === 'string') {
        urls.push(child.text.trim());
        return;
      }
      
      // Try other common representations of CDATA
      if (child.cdata && typeof child.cdata === 'string') {
        urls.push(child.cdata.trim());
        return;
      }
      
      // Some parsers might put CDATA in a property or in a nested structure
      if (typeof child === 'object' && child.children && child.children.length > 0) {
        const nestedText = child.children[0].text;
        if (typeof nestedText === 'string') {
          urls.push(nestedText.trim());
          return;
        }
      }
    }
    
    // Process array elements first
    if (Array.isArray(node)) {
      for (const item of node) {
        findLocElements(item);
      }
      return;
    }
    
    // If this is an object, process its properties
    if (typeof node === 'object') {
      // Process children array if it exists (legacy structure)
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          findLocElements(child);
        }
      }
      
      // Process all properties that might be objects or arrays
      for (const key in node) {
        if (typeof node[key] === 'object' && key !== 'children') {
          findLocElements(node[key]);
        }
      }
    }
  }
  
  findLocElements(doc);
  return urls;
}

/**
 * Extract URLs from XML text using regex (fallback method)
 * @param xmlText The XML text to extract URLs from
 * @returns Array of URLs found in the text
 */
export function extractUrlsWithRegex(xmlText: string): string[] {
  const urls: string[] = [];
  
  const locRegex = /<(?:[\w\d]+:)?loc[^>]*>(?:<!\[CDATA\[\s*)?(.*?)(?:\s*\]\]>)?<\/(?:[\w\d]+:)?loc>/gi;
  
  let match;
  while ((match = locRegex.exec(xmlText)) !== null) {
    if (match[1] && match[1].trim()) {
      try {
        const decodedUrl = decodeURIComponent(match[1].trim().replace(/&amp;/g, '&'));
        urls.push(decodedUrl);
      } catch (e) {
        urls.push(match[1].trim());
      }
    }
  }
  
  return urls;
}

/**
 * Extract URLs from XML using a streaming SAX parser
 * @param xmlText The XML text to parse
 * @returns Promise with array of URLs found
 */
export async function extractUrlsWithSaxParser(xmlText: string): Promise<string[]> {
  return new Promise((resolve) => {
    const urls: string[] = [];
    let currentElement = '';
    let isLocElement = false;
    let currentUrl = '';
    
    const parser = new SAXParser();
    
    parser.on('opentag', (tag) => {
      currentElement = tag.name.toLowerCase();
      // Handle both namespaced and non-namespaced loc elements
      isLocElement = currentElement === 'loc' || currentElement.endsWith(':loc');
      if (isLocElement) {
        currentUrl = '';
      }
    });
    
    parser.on('text', (text) => {
      if (isLocElement) {
        currentUrl += text;
      }
    });
    
    parser.on('cdata', (text) => {
      if (isLocElement) {
        currentUrl += text;
      }
    });
    
    parser.on('closetag', (tagName) => {
      const tag = tagName.toLowerCase();
      if ((tag === 'loc' || tag.endsWith(':loc')) && currentUrl.trim()) {
        try {
          const decodedUrl = decodeURIComponent(currentUrl.trim().replace(/&amp;/g, '&'));
          urls.push(decodedUrl);
        } catch (e) {
          urls.push(currentUrl.trim());
        }
      }
      isLocElement = false;
    });
    
    parser.on('end', () => {
      resolve(urls);
    });
    
    parser.on('error', (error) => {
      console.error('SAX parser error:', error);
      const regexUrls = extractUrlsWithRegex(xmlText);
      resolve(regexUrls);
    });
    
    parser.write(xmlText).close();
  });
}

/**
 * Determine if XML represents a sitemap index
 * @param xmlDoc The parsed XML document
 * @param xmlText The raw XML text (used for regex detection if xmlDoc is null)
 * @param foundUrls Array of URLs extracted from the XML
 * @returns Boolean indicating if this is a sitemap index
 */
export function isSitemapIndex(xmlDoc: any, xmlText: string, foundUrls: string[]): boolean {
  // Check 1: Root element name or property
  if (xmlDoc && typeof xmlDoc === 'object' && xmlDoc !== null) {
    // First check: Is 'sitemapindex' a direct property of the XML object?
    if ('sitemapindex' in xmlDoc) {
      console.log(`Identified as sitemap index by root element property`);
      return true;
    }
    
    // Second check: Legacy approach - check for name property
    const docElement = xmlDoc as {name?: string};
    if (docElement.name) {
      if (docElement.name === 'sitemapindex' || docElement.name.endsWith(':sitemapindex')) {
        console.log(`Identified as sitemap index by root element name`);
        return true;
      }
    }
  }
  
  // Check 2: Sitemap index markers in XML text
  if (xmlText) {
    const hasSitemapIndexTag = /(<[\w\d]*:?sitemapindex|<\/[\w\d]*:?sitemapindex)/i.test(xmlText);
    const hasSitemapTags = /(<[\w\d]*:?sitemap>|<\/[\w\d]*:?sitemap>)/i.test(xmlText);
    
    if (hasSitemapIndexTag || hasSitemapTags) {
      console.log(`Detected sitemap index markers in XML`);
      return true;
    }
  }
  
  // Check 3: Heuristic - URLs that look like sitemaps
  if (foundUrls.length > 0) {
    const sitemapLikeUrlCount = foundUrls.filter(u => 
      u.toLowerCase().includes('sitemap') || 
      u.toLowerCase().endsWith('.xml') || 
      u.toLowerCase().endsWith('.xml.gz')).length;
    
    // If most URLs look like sitemaps, treat as sitemap index
    if (sitemapLikeUrlCount > 0 && sitemapLikeUrlCount / foundUrls.length > 0.5) {
      console.log(`Identified as sitemap index by URL patterns`);
      return true;
    }
    
    // Check 4: Heuristic - Low URL count may indicate nested sitemaps
    if (foundUrls.length < 10) {
      console.log(`Low URL count (${foundUrls.length}) suggests this might be a sitemap index`);
      
      // Check if URLs match typical sitemap patterns
      const sitemapExtensions = ['.xml', '.xml.gz', '.gz'];
      const sitemapKeywords = ['sitemap', 'sitemap_', 'sitemap-', 'siteindex'];
      
      for (const url of foundUrls) {
        const lowerUrl = url.toLowerCase();
        
        // Check URL extensions
        for (const ext of sitemapExtensions) {
          if (lowerUrl.endsWith(ext)) {
            console.log(`URL ${url} ends with ${ext}, treating as sitemap index`);
            return true;
          }
        }
        
        // Check for sitemap keywords in URL
        for (const keyword of sitemapKeywords) {
          if (lowerUrl.includes(keyword)) {
            console.log(`URL ${url} contains keyword ${keyword}, treating as sitemap index`);
            return true;
          }
        }
        
        // Check URL path structure for sitemap indicators
        try {
          const parsedUrl = new URL(url);
          const pathParts = parsedUrl.pathname.split('/');
          const lastPathPart = pathParts[pathParts.length - 1].toLowerCase();
          
          if (lastPathPart && (
              lastPathPart.includes('sitemap') || 
              lastPathPart.endsWith('.xml') || 
              lastPathPart.endsWith('.xml.gz'))) {
            console.log(`URL path ${parsedUrl.pathname} indicates sitemap, treating as sitemap index`);
            return true;
          }
        } catch (error) {
          console.error(`Error parsing URL: ${url}`, error);
        }
      }
    }
  }
  
  return false;
}

/**
 * Process a sitemap URL to extract all URLs
 * @param url The sitemap URL to process
 * @returns Promise with the sitemap processing result
 */
export async function processSitemapUrl(url: string): Promise<SitemapProcessingResult> {
  // Fetch the sitemap content
  console.log(`Fetching sitemap: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; getlllmstxt/1.0; +https://getlllmstxt.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch sitemap: ${url}, status: ${response.status}`);
      return { urls: [], isSitemapIndex: false };
    }
    
    // Check if we should use streaming parser based on content length
    const contentLength = response.headers.get('content-length');
    const useStreamingParser = contentLength && parseInt(contentLength, 10) > MAX_DOM_PARSE_SIZE;
    
    if (useStreamingParser) {
      console.log(`Large sitemap detected (${contentLength} bytes), using streaming parser`);
      const xmlText = await response.text();
      
      const foundUrls = await extractUrlsWithSaxParser(xmlText);
      console.log(`SAX parser extracted ${foundUrls.length} URLs from: ${url}`);
      
      // Determine if this is a sitemap index
      const isSitemapIndexFlag = isSitemapIndex(null, xmlText, foundUrls);
      
      return {
        urls: foundUrls,
        isSitemapIndex: isSitemapIndexFlag
      };
    } else {
      const xmlText = await response.text();
      let xmlDoc = null;
      
      // Try to parse the XML - this may fail for malformed XML
      try {
        console.log(`Parsing XML from ${url}`);
        xmlDoc = parseXML(xmlText);
      } catch (parseError) {
        console.error(`XML parsing failed for ${url}: ${parseError.message || 'Unknown parse error'}`);
        // We'll handle this with SAX or regex fallback
      }
      
      // Track URLs found in this sitemap
      let foundUrls: string[] = [];
      let isSitemapIndexFlag = false;
      
      // APPROACH 1: If XML parsing succeeded, extract URLs from the document structure
      if (xmlDoc) {
        foundUrls = extractUrlsFromXml(xmlDoc);
        console.log(`Found ${foundUrls.length} URLs in sitemap: ${url}`);
        isSitemapIndexFlag = isSitemapIndex(xmlDoc, xmlText, foundUrls);
      }
      // APPROACH 2: Try SAX parser if DOM parsing failed
      else {
        try {
          console.log(`Using SAX parser for: ${url}`);
          foundUrls = await extractUrlsWithSaxParser(xmlText);
          console.log(`SAX parser extracted ${foundUrls.length} URLs from: ${url}`);
        } catch (saxError) {
          console.error(`SAX parsing failed for ${url}:`, saxError);
          // APPROACH 3: Regex fallback if both DOM and SAX parsing failed
          console.log(`Using regex fallback for: ${url}`);
          foundUrls = extractUrlsWithRegex(xmlText);
          console.log(`Regex extracted ${foundUrls.length} URLs from: ${url}`);
        }
        
        isSitemapIndexFlag = isSitemapIndex(null, xmlText, foundUrls);
      }
      
      return {
        urls: foundUrls,
        isSitemapIndex: isSitemapIndexFlag
      };
    }
  } catch (error) {
    console.error(`Error processing sitemap ${url}:`, error);
    return { urls: [], isSitemapIndex: false };
  }
}
