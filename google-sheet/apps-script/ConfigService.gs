/**
 * @OnlyCurrentDoc
 */

/**
 * ConfigService.gs
 * 100% Sidebar-Managed Configuration - POST.devad.io
 */

/**
 * 📱 Supported Platforms Registry
 * Master list of all social media platforms supported by POST.devad.io.
 * The 'handle' is the persistent key used in ScriptProperties.
 */
const SUPPORTED_PLATFORMS = [
  { handle: "fb_page",    name: "Facebook Page",     help: "Images, Videos, Carousels." },
  { handle: "ig_profile",  name: "Instagram Profile", help: "Images, Videos, Carousels." },
  { handle: "gbp_loc",     name: "Google Profile",    help: "Images, Multi-Images." },
  { handle: "li_page",     name: "LinkedIn Page",     help: "Images, Videos, Carousels." },
  { handle: "li_profile",  name: "LinkedIn Profile",  help: "Images, Videos, Carousels." },
  { handle: "pinterest",   name: "Pinterest",         help: "Images, Multi-Images (Req Board ID)." },
  { handle: "tg_channel",  name: "Telegram Channel",  help: "Images, Videos, Carousels." },
  { handle: "tt_profile",  name: "TikTok Profile",    help: "Video Only." },
  { handle: "tumblr",      name: "Tumblr Blog",       help: "Images, Videos." },
  { handle: "yt_channel",  name: "YouTube Channel",   help: "Video Only." }
];

function readJsonProperty_(rawValue, fallbackValue) {
  try {
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (e) {
    return fallbackValue;
  }
}

/**
 * Loads the core configuration for publishing.
 * Strictly ignores the 'access' sheet tab.
 * 
 * @param {boolean} throwOnError If true, validates Token and Active integrations.
 */
function loadAccessConfig(throwOnError = true) {
  const scriptProps = PropertiesService.getScriptProperties();
  const token = scriptProps.getProperty("POST_API_TOKEN") || "";
  const savedSettings = readJsonProperty_(scriptProps.getProperty("PLATFORM_SETTINGS"), {});

  const config = {
    token: token,
    platforms: []
  };

  // 🔄 Merge the Registry with User's Saved IDs & Toggles
  SUPPORTED_PLATFORMS.forEach(p => {
    const setting = savedSettings[p.handle] || {
      enabled: false,
      id: "",
      boardId: "",
      plusStory: false,
      promoLinkMode: "none",
      includeLinkInCaption: false
    };
    
    // Only add to 'active' list if it's explicitly enabled AND has an ID
    if (setting.id && setting.enabled) {
      const promoLinkMode = setting.promoLinkMode || (setting.includeLinkInCaption ? "caption" : "none");
      config.platforms.push({
        handle: p.handle,
        id: setting.id,  // The numeric Integration ID
        name: p.name,
        boardId: setting.boardId || "",
        plusStory: setting.plusStory || false,
        promoLinkMode: promoLinkMode,
        includeLinkInCaption: promoLinkMode === "caption"
      });
    }
  });

  // Final Validation for Actual Publishing
  if (throwOnError) {
    if (!config.token) {
      throw new Error("POST.devad.io Token is missing. 🔑 Open the Manager and paste your token.");
    }
    if (config.platforms.length === 0) {
      throw new Error("No social platforms are active. 📱 Add your IDs in the Manager to enable posting.");
    }
  }

  return config;
}
