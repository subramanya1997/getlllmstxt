// test-sitemap-processor.ts - Test script for sitemap processor

import { processSitemapRecursively } from "./sitemap-processor";

// Configure test parameters
const sitemapUrl = "https://www.alaskarubbergroup.com/sitemap.xml"; // Replace with the sitemap URL you want to test
const domain = new URL(sitemapUrl).hostname;

console.log(`Starting test of processSitemapRecursively with sitemap: ${sitemapUrl}`);

// Main test function
async function runTest() {
  try {
    console.log("Beginning sitemap processing...");
    
    // Process the sitemap recursively
    const startTime = Date.now();
    const extractedUrls = await processSitemapRecursively(sitemapUrl, domain);
    const endTime = Date.now();
    
    // Display results
    console.log("\n----- Test Results -----");
    console.log(`Total URLs extracted: ${extractedUrls.length}`);
    console.log(`Processing time: ${(endTime - startTime) / 1000} seconds`);
    
    if (extractedUrls.length > 0) {
      console.log("\nSample URLs (up to 5):");
      extractedUrls.slice(0, 5).forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
    } else {
      console.log("\nNo URLs were extracted from the sitemap.");
    }
    
    console.log("\nTest completed successfully.");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
runTest();
