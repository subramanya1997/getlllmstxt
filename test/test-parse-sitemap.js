// Simple test script to validate sitemap parsing logic

// Sample sitemap content from the real site
const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">                                     
    
      <url>
        <loc>https://subramanya.ai/blog/</loc>
        <changefreq>weekly</changefreq> 
        <priority>0.5</priority>
      </url>
    
      <url>
        <loc>https://subramanya.ai/books/</loc>
        <changefreq>weekly</changefreq> 
        <priority>0.5</priority>
      </url>
    
      <url>
        <loc>https://subramanya.ai/</loc>
        <changefreq>weekly</changefreq> 
        <priority>0.5</priority>
      </url>
  
      <url>
        <loc>https://subramanya.ai/assets/css/style.css</loc>
        <changefreq>weekly</changefreq> 
        <priority>0.5</priority>
      </url>
  
    <url>
      <loc>https://subramanya.ai/2024/12/10/ai-agents-agentic-security-enterprise-automation/</loc>
      <lastmod>2024-12-10T00:00:00+00:00</lastmod>
      <changefreq>weekly</changefreq> 
      <priority>0.5</priority>
    </url>
</urlset>`;

// Function to extract URLs using regex
function extractUrlsWithRegex(xmlText) {
  const urls = [];
  const locRegex = /<loc[^>]*>(.*?)<\/loc>/gi;
  let match;
  
  while ((match = locRegex.exec(xmlText)) !== null) {
    if (match[1] && match[1].trim()) {
      urls.push(match[1].trim());
    }
  }
  
  return urls;
}

// Run the test
console.log("Testing sitemap parsing with regex approach:");
const extractedUrls = extractUrlsWithRegex(sampleXml);
console.log(`Found ${extractedUrls.length} URLs:`);
extractedUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

// Run a test with subramanya.ai sitemap
console.log("\nTo test with the actual sitemap, run:");
console.log("curl -s https://subramanya.ai/sitemap.xml | node test-parse-sitemap.js --real");

// Handle real sitemap if passed as argument
if (process.argv.includes('--real')) {
  process.stdin.setEncoding('utf8');
  let inputData = '';
  
  process.stdin.on('data', (chunk) => {
    inputData += chunk;
  });
  
  process.stdin.on('end', () => {
    console.log("\nTesting with real sitemap data:");
    const realUrls = extractUrlsWithRegex(inputData);
    console.log(`Found ${realUrls.length} URLs in real sitemap:`);
    realUrls.forEach((url, index) => {
      if (index < 10) { // Only show first 10 to avoid too much output
        console.log(`${index + 1}. ${url}`);
      } else if (index === 10) {
        console.log(`... and ${realUrls.length - 10} more`);
      }
    });
  });
} 