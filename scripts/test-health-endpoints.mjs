/**
 * Test script for health check endpoints.
 * Run with: node scripts/test-health-endpoints.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const tests = [
  {
    name: "Basic Health Check",
    url: `${BASE_URL}/api/health`,
    expectedStatus: [200, 503],
    expectedFields: ["status", "timestamp", "uptime", "version", "checks"],
  },
  {
    name: "Readiness Check",
    url: `${BASE_URL}/api/health/ready`,
    expectedStatus: [200, 503],
    expectedFields: ["ready", "checks"],
  },
  {
    name: "Liveness Check",
    url: `${BASE_URL}/api/health/live`,
    expectedStatus: [200],
    expectedFields: ["alive", "timestamp"],
  },
];

async function testEndpoint(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    const response = await fetch(test.url);
    const data = await response.json();

    console.log(`   Status: ${response.status} ${test.expectedStatus.includes(response.status) ? "✅" : "❌"}`);

    if (!test.expectedStatus.includes(response.status)) {
      console.log(`   ❌ Expected status ${test.expectedStatus.join(" or ")}, got ${response.status}`);
      return false;
    }

    const missingFields = test.expectedFields.filter((field) => !(field in data));
    if (missingFields.length > 0) {
      console.log(`   ❌ Missing fields: ${missingFields.join(", ")}`);
      return false;
    }

    console.log(`   ✅ All required fields present`);
    console.log(`   Response preview: ${JSON.stringify(data, null, 2).split("\n").slice(0, 10).join("\n")}`);

    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🏥 Health Check Endpoints Test Suite");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log("=" .repeat(60));

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push({ name: test.name, passed: result });
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary:");
  console.log("=".repeat(60));

  results.forEach((result) => {
    console.log(`   ${result.passed ? "✅" : "❌"} ${result.name}`);
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log("\n" + "=".repeat(60));
  console.log(`   Total: ${passed}/${total} tests passed`);
  console.log("=".repeat(60));

  if (passed === total) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
