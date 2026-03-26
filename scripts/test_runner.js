// ============================================================
// POST API — Test Runner (JavaScript / Node.js)
// ============================================================
// Usage: node test_runner.js <test_name>
//        node test_runner.js accounts         ← run this FIRST
//        node test_runner.js health
//        node test_runner.js tiktok_video
//
// Requirements: Node.js 18+ (uses native fetch, no npm needed)
// ============================================================

// ────────────────────────────────────────────
// ⚙️  CONFIG — Edit ONLY these values at top
// ────────────────────────────────────────────
const API_BASE  = "https://post.devad.io/api/public/v1";
const API_TOKEN = "YOUR_API_TOKEN_HERE"; 

// Run `node test_runner.js accounts` to get these IDs
const ACCOUNT_IDS = {
  facebook:         "FILL_ME",  
  instagram:        "FILL_ME",  
  twitter:          "FILL_ME",     
  linkedin:         "FILL_ME",  
  tiktok:           "FILL_ME",  
  youtube:          "FILL_ME",  
  pinterest:        "FILL_ME",  
  telegram:         "FILL_ME",  
  tumblr:           "FILL_ME",  
  google_business:  "FILL_ME",  
};

// Test Media URLs
const TEST_IMAGE   = "https://via.placeholder.com/1080x1080.jpg";
const TEST_VIDEO    = "https://www.w3schools.com/html/mov_bbb.mp4";
const LARGE_VIDEO   = "https://www.w3schools.com/html/mov_bbb.mp4"; // placeholder

// TikTok Privacy: SELF_ONLY (testing) | MUTUAL_CAN_VIEW | FOLLOWER_OF_CREATOR | PUBLIC_TO_EVERYONE
const TIKTOK_PRIVACY = "SELF_ONLY";

// ────────────────────────────────────────────
// 📦  TEST PAYLOADS
// ────────────────────────────────────────────
function getPayload(test) {
  const caption = `✅ API Test — ${test}. #devadio`;
  const ids = ACCOUNT_IDS;

  const tests = {
    // ── Facebook ─────────────────────
    facebook_text:   { posts: [{ integration: { id: ids.facebook }, value: [{ content: caption }] }], type: "now" },
    facebook_image:  { posts: [{ integration: { id: ids.facebook }, value: [{ content: caption, image: [TEST_IMAGE] }] }], type: "now" },
    facebook_video:  { posts: [{ integration: { id: ids.facebook }, value: [{ content: caption, video: [TEST_VIDEO] }] }], type: "now" },

    // ── Instagram ────────────────────
    instagram_image: { posts: [{ integration: { id: ids.instagram }, value: [{ content: caption, image: [TEST_IMAGE] }] }], type: "now" },
    instagram_video: { posts: [{ integration: { id: ids.instagram }, value: [{ content: caption, video: [TEST_VIDEO] }], settings: { post_type: "reel" } }], type: "now" },

    // ── LinkedIn ─────────────────────
    linkedin_text:   { posts: [{ integration: { id: ids.linkedin }, value: [{ content: caption }] }], type: "now" },
    linkedin_image:  { posts: [{ integration: { id: ids.linkedin }, value: [{ content: caption, image: [TEST_IMAGE] }] }], type: "now" },
    linkedin_video:  { posts: [{ integration: { id: ids.linkedin }, value: [{ content: caption, video: [TEST_VIDEO] }] }], type: "now" },

    // ── TikTok ───────────────────────
    tiktok_video: {
      posts: [{
        integration: { id: ids.tiktok },
        value: [{ content: `✅ TikTok Test — ${test}`, video: [TEST_VIDEO] }],
        settings: { privacy: TIKTOK_PRIVACY, duet: false, stitch: false, comment: false, music_usage_confirmed: true, tt_consent: 1 },
      }],
      type: "now"
    },
    tiktok_large_video: {
      posts: [{
        integration: { id: ids.tiktok },
        value: [{ content: `✅ TikTok 18MB Test — ${test}`, video: [LARGE_VIDEO] }],
        settings: { privacy: TIKTOK_PRIVACY, music_usage_confirmed: true, tt_consent: 1 },
      }],
      type: "now"
    },
    tiktok_image: {
      posts: [{
        integration: { id: ids.tiktok },
        value: [{ content: `✅ TikTok Image Test — ${test}`, image: [TEST_IMAGE] }],
        settings: { privacy: TIKTOK_PRIVACY, tt_consent: 1 },
      }],
      type: "now"
    },

    // ── Others ───────────────────────
    youtube_video:   { posts: [{ integration: { id: ids.youtube }, value: [{ content: caption, video: [TEST_VIDEO] }], settings: { title: "API Test", type: "unlisted" } }], type: "now" },
    telegram_text:   { posts: [{ integration: { id: ids.telegram }, value: [{ content: caption }] }], type: "now" },
    telegram_video:  { posts: [{ integration: { id: ids.telegram }, value: [{ content: caption, video: [TEST_VIDEO] }] }], type: "now" },
    google_image:    { posts: [{ integration: { id: ids.google_business }, value: [{ content: caption, image: [TEST_IMAGE] }] }], type: "now" },
  };

  return tests[test] ?? null;
}

// ────────────────────────────────────────────
// 🌐  HTTP HELPER
// ────────────────────────────────────────────
async function apiRequest(method, path, body = null) {
  const url = `${API_BASE}${path}` + (method === "POST" && path === "/upload" ? `?api_token=${API_TOKEN}` : "");
  
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "X-Api-Token":   API_TOKEN,
      "Content-Type":  "application/json",
      "Accept":        "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res  = await fetch(url, options);
  const text = await res.text();

  let json;
  try { json = JSON.parse(text); } catch { json = text; }

  return { code: res.status, body: json };
}

// ────────────────────────────────────────────
// 🚀  MAIN
// ────────────────────────────────────────────
async function main() {
  const test = process.argv[2];

  if (!test) {
    console.log("Usage: node test_runner.js <test_name>\n");
    console.log("Commands: accounts, health, facebook_image, instagram_video, tiktok_video, tiktok_large_video, tiktok_image, etc.");
    return;
  }

  if (test === "health") {
    const result = await apiRequest("GET", "/health");
    console.log(`HTTP ${result.code}`, result.body);
    return;
  }

  if (test === "accounts") {
    const result = await apiRequest("GET", "/accounts");
    console.log(`HTTP ${result.code}`, JSON.stringify(result.body, null, 2));
    return;
  }

  const payload = getPayload(test);
  if (!payload) {
    console.error(`❌ Unknown test: '${test}'`);
    process.exit(1);
  }

  console.log(`🚀 Running test: ${test}`);
  const result = await apiRequest("POST", "/posts", payload);
  console.log(`HTTP ${result.code}`, JSON.stringify(result.body, null, 2));
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
