/**
 * Geoblocking Test Script
 * 
 * Run with: npx ts-node scripts/test-geoblock.ts
 * 
 * This script tests the geoblocking middleware locally by simulating
 * requests from different countries.
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

interface TestResult {
  country: string;
  path: string;
  expectedBlocked: boolean;
  actualBlocked: boolean;
  status: number;
  passed: boolean;
}

async function testGeoblock(country: string, path: string, expectedBlocked: boolean): Promise<TestResult> {
  const url = `${BASE_URL}${path}?_geo=${country}`;
  
  try {
    const response = await fetch(url, {
      redirect: "manual", // Don't follow redirects automatically
      headers: {
        "User-Agent": "GeoBlockTest/1.0",
      },
    });
    
    // Check if redirected to /blocked
    const location = response.headers.get("location") || "";
    const actualBlocked = location.includes("/blocked") || response.status === 307;
    
    return {
      country,
      path,
      expectedBlocked,
      actualBlocked,
      status: response.status,
      passed: expectedBlocked === actualBlocked,
    };
  } catch (error) {
    console.error(`Error testing ${country} -> ${path}:`, error);
    return {
      country,
      path,
      expectedBlocked,
      actualBlocked: false,
      status: 0,
      passed: false,
    };
  }
}

async function runTests() {
  console.log("🌎 Geoblocking Test Suite");
  console.log("=".repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log("");
  
  const tests: Array<{ country: string; path: string; expectedBlocked: boolean }> = [
    // Brazil should be allowed
    { country: "BR", path: "/", expectedBlocked: false },
    { country: "BR", path: "/pt-BR", expectedBlocked: false },
    { country: "BR", path: "/portal", expectedBlocked: false },
    { country: "BR", path: "/api/user/dashboard", expectedBlocked: false },
    
    // US should be blocked
    { country: "US", path: "/", expectedBlocked: true },
    { country: "US", path: "/pt-BR", expectedBlocked: true },
    { country: "US", path: "/portal", expectedBlocked: true },
    
    // China should be blocked
    { country: "CN", path: "/", expectedBlocked: true },
    { country: "CN", path: "/cursos", expectedBlocked: true },
    
    // Hong Kong should be blocked
    { country: "HK", path: "/", expectedBlocked: true },
    
    // Russia should be blocked
    { country: "RU", path: "/", expectedBlocked: true },
    
    // Bypass paths should ALWAYS work (even from blocked countries)
    { country: "US", path: "/blocked", expectedBlocked: false },
    { country: "CN", path: "/blocked", expectedBlocked: false },
    { country: "US", path: "/api/health", expectedBlocked: false },
    { country: "CN", path: "/api/payments/webhook", expectedBlocked: false },
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await testGeoblock(test.country, test.path, test.expectedBlocked);
    results.push(result);
    
    const icon = result.passed ? "✅" : "❌";
    const action = result.actualBlocked ? "BLOCKED" : "ALLOWED";
    console.log(`${icon} ${test.country} -> ${test.path} = ${action} (expected: ${test.expectedBlocked ? "blocked" : "allowed"})`);
  }
  
  console.log("");
  console.log("=".repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  
  console.log(`Results: ${passed}/${total} tests passed`);
  
  if (!allPassed) {
    console.log("");
    console.log("Failed tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.country} -> ${r.path}: got ${r.actualBlocked ? "blocked" : "allowed"}, expected ${r.expectedBlocked ? "blocked" : "allowed"}`);
    });
  }
  
  console.log("");
  console.log(allPassed ? "🎉 All tests passed!" : "⚠️ Some tests failed");
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);
