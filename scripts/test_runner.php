<?php
/**
 * POST API — Unified Test Runner
 * ==============================
 * Usage (on the Webuzo server):
 *   php test_runner.php facebook_image
 *   php test_runner.php instagram_video
 *   php test_runner.php accounts   ← list all accounts first!
 *
 * STEP 1: Run with 'accounts' to get id_secure values
 * STEP 2: Fill in the ACCOUNT_IDs in config below
 * STEP 3: Run tests one by one
 */

// ─────────────────────────────────────────────
// CONFIGURATION — fill these in before testing
// ─────────────────────────────────────────────
define('API_BASE',  'https://post.devad.io/api/public/v1');
define('API_TOKEN', 'YOUR_API_TOKEN_HERE');  // ← replace with your token

$ACCOUNT_IDS = [
    'facebook'   => 'FILL_ME',   // from /accounts response
    'instagram'  => 'FILL_ME',
    'twitter'    => 'FILL_ME',
    'linkedin'   => 'FILL_ME',
    'tiktok'     => 'FILL_ME',
    'youtube'    => 'FILL_ME',
    'pinterest'  => 'FILL_ME',
    'telegram'   => 'FILL_ME',
];

// Public test image and video URLs
define('TEST_IMAGE',    'https://via.placeholder.com/1080x1080.jpg');
define('TEST_IMAGE_2',  'https://via.placeholder.com/1080x1080/FF5733.jpg');
define('TEST_IMAGE_3',  'https://via.placeholder.com/1080x1080/33C1FF.jpg');
define('TEST_VIDEO',    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');

// ─────────────────────────────────────────────
// TEST PAYLOADS
// ─────────────────────────────────────────────
function getPayload(string $test, array $ids): ?array
{
    $caption = "✅ POST API Test — {$test}. #devadio #test";

    $map = [
        // ── Facebook ──────────────────────────────────
        'facebook_text' => [
            'posts' => [[
                'integration' => ['id' => $ids['facebook']],
                'value' => [['content' => $caption]],
            ]],
            'type' => 'now',
        ],
        'facebook_image' => [
            'posts' => [[
                'integration' => ['id' => $ids['facebook']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE]]],
            ]],
            'type' => 'now',
        ],
        'facebook_carousel' => [
            'posts' => [[
                'integration' => ['id' => $ids['facebook']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE, TEST_IMAGE_2, TEST_IMAGE_3]]],
            ]],
            'type' => 'now',
        ],
        'facebook_video' => [
            'posts' => [[
                'integration' => ['id' => $ids['facebook']],
                'value' => [['content' => $caption, 'video' => [TEST_VIDEO]]],
            ]],
            'type' => 'now',
        ],

        // ── Instagram ─────────────────────────────────
        'instagram_image' => [
            'posts' => [[
                'integration' => ['id' => $ids['instagram']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE]]],
            ]],
            'type' => 'now',
        ],
        'instagram_carousel' => [
            'posts' => [[
                'integration' => ['id' => $ids['instagram']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE, TEST_IMAGE_2, TEST_IMAGE_3]]],
            ]],
            'type' => 'now',
        ],
        'instagram_video' => [
            'posts' => [[
                'integration' => ['id' => $ids['instagram']],
                'value' => [['content' => $caption, 'video' => [TEST_VIDEO]]],
                'settings' => ['post_type' => 'reel'],
            ]],
            'type' => 'now',
        ],

        // ── Twitter / X ───────────────────────────────
        'twitter_text' => [
            'posts' => [[
                'integration' => ['id' => $ids['twitter']],
                'value' => [['content' => $caption]],
            ]],
            'type' => 'now',
        ],
        'twitter_image' => [
            'posts' => [[
                'integration' => ['id' => $ids['twitter']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE]]],
            ]],
            'type' => 'now',
        ],
        'twitter_carousel' => [
            'posts' => [[
                'integration' => ['id' => $ids['twitter']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE, TEST_IMAGE_2, TEST_IMAGE_3]]],
            ]],
            'type' => 'now',
        ],

        // ── LinkedIn ─────────────────────────────────
        'linkedin_text' => [
            'posts' => [[
                'integration' => ['id' => $ids['linkedin']],
                'value' => [['content' => $caption]],
            ]],
            'type' => 'now',
        ],
        'linkedin_image' => [
            'posts' => [[
                'integration' => ['id' => $ids['linkedin']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE]]],
            ]],
            'type' => 'now',
        ],
        'linkedin_video' => [
            'posts' => [[
                'integration' => ['id' => $ids['linkedin']],
                'value' => [['content' => $caption, 'video' => [TEST_VIDEO]]],
            ]],
            'type' => 'now',
        ],

        // ── TikTok ───────────────────────────────────
        'tiktok_video' => [
            'posts' => [[
                'integration' => ['id' => $ids['tiktok']],
                'value' => [['content' => $caption, 'video' => [TEST_VIDEO]]],
                'settings' => ['privacy' => 'SELF_ONLY', 'duet' => false, 'stitch' => false, 'comment' => false],
            ]],
            'type' => 'now',
        ],

        // ── YouTube ──────────────────────────────────
        'youtube_video' => [
            'posts' => [[
                'integration' => ['id' => $ids['youtube']],
                'value' => [['content' => 'POST API Test — YouTube video description. #devadio', 'video' => [TEST_VIDEO]]],
                'settings' => ['title' => 'POST API Test Video', 'type' => 'unlisted'],
            ]],
            'type' => 'now',
        ],

        // ── Pinterest ────────────────────────────────
        'pinterest_image' => [
            'posts' => [[
                'integration' => ['id' => $ids['pinterest']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE]]],
                'settings' => ['title' => 'POST API Test Pin'],
            ]],
            'type' => 'now',
        ],

        // ── Telegram ─────────────────────────────────
        'telegram_text' => [
            'posts' => [[
                'integration' => ['id' => $ids['telegram']],
                'value' => [['content' => $caption]],
            ]],
            'type' => 'now',
        ],
        'telegram_image' => [
            'posts' => [[
                'integration' => ['id' => $ids['telegram']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE]]],
            ]],
            'type' => 'now',
        ],
        'telegram_carousel' => [
            'posts' => [[
                'integration' => ['id' => $ids['telegram']],
                'value' => [['content' => $caption, 'image' => [TEST_IMAGE, TEST_IMAGE_2, TEST_IMAGE_3]]],
            ]],
            'type' => 'now',
        ],
        'telegram_video' => [
            'posts' => [[
                'integration' => ['id' => $ids['telegram']],
                'value' => [['content' => $caption, 'video' => [TEST_VIDEO]]],
            ]],
            'type' => 'now',
        ],
    ];

    return $map[$test] ?? null;
}

// ─────────────────────────────────────────────
// HTTP HELPER
// ─────────────────────────────────────────────
function apiRequest(string $method, string $path, ?array $body = null): array
{
    $ch = curl_init(API_BASE . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . API_TOKEN,
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_POSTFIELDS     => $body ? json_encode($body) : null,
        CURLOPT_TIMEOUT        => 30,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'code'     => $httpCode,
        'body'     => json_decode($response, true) ?? $response,
        'curl_err' => $error,
    ];
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
$test = $argv[1] ?? '';

if (!$test) {
    echo "Usage: php test_runner.php <test_name>\n";
    echo "       php test_runner.php accounts\n";
    echo "\nAvailable tests:\n";
    echo "  facebook_text, facebook_image, facebook_carousel, facebook_video\n";
    echo "  instagram_image, instagram_carousel, instagram_video\n";
    echo "  twitter_text, twitter_image, twitter_carousel\n";
    echo "  linkedin_text, linkedin_image, linkedin_video\n";
    echo "  tiktok_video\n";
    echo "  youtube_video\n";
    echo "  pinterest_image\n";
    echo "  telegram_text, telegram_image, telegram_carousel, telegram_video\n";
    exit(0);
}

if ($test === 'accounts') {
    echo "Fetching connected social accounts...\n\n";
    $result = apiRequest('GET', '/accounts');
    echo "HTTP {$result['code']}\n";
    echo json_encode($result['body'], JSON_PRETTY_PRINT) . "\n";
    exit(0);
}

if ($test === 'health') {
    echo "Checking API health...\n\n";
    $result = apiRequest('GET', '/health');
    echo "HTTP {$result['code']}\n";
    echo json_encode($result['body'], JSON_PRETTY_PRINT) . "\n";
    exit(0);
}

$payload = getPayload($test, $ACCOUNT_IDS);

if (!$payload) {
    echo "❌ Unknown test: '{$test}'\n";
    exit(1);
}

echo "🚀 Running test: {$test}\n";
echo "   Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

$result = apiRequest('POST', '/posts', $payload);

echo "HTTP {$result['code']}\n";
echo json_encode($result['body'], JSON_PRETTY_PRINT) . "\n\n";

if ($result['code'] === 202) {
    echo "✅ Queued successfully! Wait 30-90s then check the social channel.\n";
} else {
    echo "❌ Failed. Check the response above for error details.\n";
}
