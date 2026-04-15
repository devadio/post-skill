// Sanitized public template.
// Replace only the placeholder values in add-HERE-your-token-and-ids and relink Google credentials in n8n.
import { workflow, node, trigger, sticky, newCredential, switchCase, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const overviewNote = sticky(`## POST.devad.io -> Google Sheet -> Social

1. Edit only the node named add-HERE-your-token-and-ids.
2. Reads the post tab directly from Google Sheets.
3. Expands Google Drive folder links and file links.
4. Supports direct links, text/image/video/carousel, comments, and FB/IG story duplicates.
5. Writes status back to Action? and log.
6. If Google Sheets or Google Drive nodes fail auth, relink them in n8n.`, undefined, {
  name: 'Workflow overview',
  width: 540,
  height: 320,
  position: [-1000, -280],
});

const credentialsNote = sticky(`## Relink if needed

- Google Sheets node uses a Google Sheets OAuth2 credential.
- Google Drive node uses a Google Drive OAuth2 credential.
- If either node errors, relink the credential in n8n and rerun.`, undefined, {
  name: 'Credential note',
  width: 320,
  height: 220,
  color: 6,
  position: [-380, -260],
});

const manualTriggerNode = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger', position: [-880, 40] },
  output: [{}],
});

const setupNode = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'add-HERE-your-token-and-ids',
    position: [-620, 40],
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'cfg-base-url', name: 'base_url', value: 'https://post.devad.io/api/public/v1', type: 'string' },
          { id: 'cfg-sheet-url', name: 'spreadsheet_url', value: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0', type: 'string' },
          { id: 'cfg-sheet-name', name: 'sheet_name', value: 'post', type: 'string' },
          { id: 'cfg-token', name: 'post_devad_io_token', value: 'ADD_HERE_YOUR_POST_DEVD_IO_TOKEN', type: 'string' },
          { id: 'cfg-instagram', name: 'instagram_id', value: 'ADD_HERE_YOUR_INSTAGRAM_ID', type: 'string' },
          { id: 'cfg-youtube', name: 'youtube_id', value: 'ADD_HERE_YOUR_YOUTUBE_ID', type: 'string' },
          { id: 'cfg-tiktok', name: 'tiktok_id', value: 'ADD_HERE_YOUR_TIKTOK_ID', type: 'string' },
          { id: 'cfg-facebook', name: 'facebook_id', value: 'ADD_HERE_YOUR_FACEBOOK_ID', type: 'string' },
          { id: 'cfg-pinterest', name: 'pinterest_id', value: 'ADD_HERE_YOUR_PINTEREST_ID', type: 'string' },
          { id: 'cfg-pinterest-board', name: 'pinterest_board_id', value: 'ADD_HERE_YOUR_PINTEREST_BOARD_ID', type: 'string' },
          { id: 'cfg-telegram', name: 'telegram_id', value: 'ADD_HERE_YOUR_TELEGRAM_ID', type: 'string' },
          { id: 'cfg-li-page', name: 'linkedin_page_id', value: 'ADD_HERE_YOUR_LINKEDIN_PAGE_ID', type: 'string' },
          { id: 'cfg-li-profile', name: 'linkedin_profile_id', value: 'ADD_HERE_YOUR_LINKEDIN_PROFILE_ID', type: 'string' },
          { id: 'cfg-tumblr', name: 'tumblr_id', value: 'ADD_HERE_YOUR_TUMBLR_ID', type: 'string' },
          { id: 'cfg-gbp', name: 'google_business_profile_id', value: 'ADD_HERE_YOUR_GOOGLE_BUSINESS_PROFILE_ID', type: 'string' },
          { id: 'cfg-default-promo', name: 'default_promo_link_mode', value: 'caption', type: 'string' },
          { id: 'cfg-fb-promo', name: 'facebook_promo_link_mode', value: 'comment', type: 'string' },
          { id: 'cfg-ig-promo', name: 'instagram_promo_link_mode', value: 'comment', type: 'string' },
          { id: 'cfg-fb-story', name: 'facebook_plus_story', value: '0', type: 'string' },
          { id: 'cfg-ig-story', name: 'instagram_plus_story', value: '0', type: 'string' },
          { id: 'cfg-row-select', name: 'process_row_numbers', value: '', type: 'string' },
          { id: 'cfg-max-rows', name: 'max_rows_per_run', value: '1', type: 'string' },
          { id: 'cfg-webhook-url', name: 'default_webhook_url', value: '', type: 'string' },
          { id: 'cfg-webhook-method', name: 'default_webhook_method', value: 'POST', type: 'string' }
        ]
      },
      options: {}
    }
  },
  output: [{
    base_url: 'https://post.devad.io/api/public/v1',
    spreadsheet_url: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0',
    sheet_name: 'post',
    post_devad_io_token: 'ADD_HERE_YOUR_POST_DEVD_IO_TOKEN',
    instagram_id: 'ADD_HERE_YOUR_INSTAGRAM_ID',
    youtube_id: 'ADD_HERE_YOUR_YOUTUBE_ID',
    tiktok_id: 'ADD_HERE_YOUR_TIKTOK_ID',
    facebook_id: 'ADD_HERE_YOUR_FACEBOOK_ID',
    pinterest_id: 'ADD_HERE_YOUR_PINTEREST_ID',
    pinterest_board_id: 'ADD_HERE_YOUR_PINTEREST_BOARD_ID',
    telegram_id: 'ADD_HERE_YOUR_TELEGRAM_ID',
    linkedin_page_id: 'ADD_HERE_YOUR_LINKEDIN_PAGE_ID',
    linkedin_profile_id: 'ADD_HERE_YOUR_LINKEDIN_PROFILE_ID',
    tumblr_id: 'ADD_HERE_YOUR_TUMBLR_ID',
    google_business_profile_id: 'ADD_HERE_YOUR_GOOGLE_BUSINESS_PROFILE_ID',
    default_promo_link_mode: 'caption',
    facebook_promo_link_mode: 'comment',
    instagram_promo_link_mode: 'comment',
    facebook_plus_story: '0',
    instagram_plus_story: '0',
    process_row_numbers: '',
    max_rows_per_run: '1',
    default_webhook_url: '',
    default_webhook_method: 'POST',
  }],
});

const fetchAccountsNode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch PostApi Accounts',
    position: [-360, 40],
    parameters: {
      method: 'GET',
      url: expr('{{ $json.base_url + "/accounts" }}'),
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'api_token', value: expr('{{ $json.post_devad_io_token }}') }] },
      options: { response: { response: { responseFormat: 'json' } } },
    },
  },
  output: [{ data: [{ id: 'ADD_HERE_YOUR_FACEBOOK_ID', provider: 'facebook', category: 'page', capabilities: { image: true, video: true, carousel: true } }] }],
});

const readSheetNode = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets OAuth2') },
  config: {
    name: 'Read Post Sheet',
    position: [-100, 40],
    parameters: {
      resource: 'sheet',
      operation: 'read',
      authentication: 'oAuth2',
      documentId: { __rl: true, mode: 'url', value: expr('{{ $("add-HERE-your-token-and-ids").item.json.spreadsheet_url }}') },
      sheetName: { __rl: true, mode: 'name', value: expr('{{ $("add-HERE-your-token-and-ids").item.json.sheet_name }}') },
      options: { returnAllMatches: 'returnAllMatches' },
    },
  },
  output: [{
    Reference: '',
    'Promotional link': 'https://example.com/offer',
    Title: 'Example post title',
    'Social media summary (caption)': 'Example caption for the post',
    'Creative link': 'https://drive.google.com/file/d/ADD_HERE_YOUR_DRIVE_FILE_ID/view?usp=sharing',
    'Creative type': 'image_manual',
    'Action?': 'To do',
    Check: 'Google Drive',
    log: '',
    row_number: '2',
  }],
});

const normalizeRowsNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Action Rows',
    position: [160, 40],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg=$('add-HERE-your-token-and-ids').item.json;
function s(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function rv(row, aliases){const m={}; for(const [k,v] of Object.entries(row||{})) m[s(k)] = v; for(const a of aliases){const hit=m[s(a)]; if(hit!==undefined && String(hit).trim()!=='') return String(hit).trim();} return '';}
function list(v){return v?String(v).split(/[,\\n|]/).map(i=>i.trim()).filter(Boolean):[];}
function parseRows(v){return new Set(list(v).map(n=>Number(String(n).trim())).filter(n=>Number.isInteger(n) && n > 1));}
function gidFile(u){const m=String(u||'').match(/\\/d\\/([a-zA-Z0-9_-]+)/)||String(u||'').match(/[?&]id=([a-zA-Z0-9_-]+)/); return m?m[1]:'';}
function gidFolder(u){const m=String(u||'').match(/\\/folders\\/([a-zA-Z0-9_-]+)/); return m?m[1]:'';}
function hint(t, links){const v=String(t||'').toLowerCase(); if(v.includes('carousel')) return 'carousel'; if(v.includes('video')) return 'video'; if(v.includes('image')||v.includes('photo')) return 'image'; if(v.includes('text')) return 'text'; if(links.length>1) return 'carousel'; return '';}
function hasUsableRow(title, caption, promoLink, mediaLink){return !!(String(title||'').trim() || String(caption||'').trim() || String(promoLink||'').trim() || String(mediaLink||'').trim());}
const out=[]; const rows=$input.all().map(i=>i.json);
const selectedRows=parseRows(cfg.process_row_numbers || '');
const maxRows=Math.max(0, parseInt(String(cfg.max_rows_per_run || '1'), 10) || 0);
for(let i=0;i<rows.length;i++){const row=rows[i]; const action=rv(row,['action?','action']); if(!['to do','todo','post','queue','publish'].includes(String(action).trim().toLowerCase())) continue;
  const rowNumber=Number(row.row_number||i+2);
  if(selectedRows.size && !selectedRows.has(rowNumber)) continue;
  const title=rv(row,['title']); const promoLink=rv(row,['promotional link','link']); const captionBase=rv(row,['social media summary (caption)','caption','summary']); const mediaLink=rv(row,['creative link','media','media url']);
  if(!hasUsableRow(title, captionBase, promoLink, mediaLink)) continue;
  const links=list(mediaLink); const folderId=links.length===1?gidFolder(links[0]):''; const fileId=!folderId&&links.length===1?gidFile(links[0]):''; const h=hint(rv(row,['creative type']), links);
  let src=folderId?'folder':(fileId?'file':'direct'); if(!links.length && h==='text') src='direct';
  out.push({json:{rowNumber:rowNumber,row_number:String(rowNumber),sourceRow:row,title,promoLink,captionBase,creativeType:rv(row,['creative type']),postTypeHint:h,mediaSourceType:src,googleDriveFolderId:folderId,googleDriveFileId:fileId,directMediaUrls:src==='direct'?links:[],webhookUrl:rv(row,['webhook url'])||cfg.default_webhook_url,webhookMethod:(rv(row,['webhook method'])||cfg.default_webhook_method||'POST').toUpperCase(),scheduleAt:rv(row,['schedule at','publish at','date'])}});
  if(maxRows > 0 && out.length >= maxRows) break;
}
return out;`,
    },
  },
  output: [{
    rowNumber: 2,
    row_number: '2',
    sourceRow: { Title: 'Example post title' },
    title: 'Example post title',
    promoLink: 'https://example.com/offer',
    captionBase: 'Example caption for the post',
    creativeType: 'image_manual',
    postTypeHint: 'image',
    mediaSourceType: 'file',
    googleDriveFolderId: '',
    googleDriveFileId: 'ADD_HERE_YOUR_DRIVE_FILE_ID',
    directMediaUrls: [],
    webhookUrl: '',
    webhookMethod: 'POST',
    scheduleAt: '',
  }],
});

const rowBatchNode = splitInBatches({
  version: 3,
  config: { name: 'Current Row Batch', position: [420, 40], parameters: { batchSize: 1 } },
});

const finishNode = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Done',
    position: [2920, 320],
    parameters: { mode: 'manual', assignments: { assignments: [{ id: 'done-msg', name: 'message', value: 'Workflow finished processing current actionable rows.', type: 'string' }] }, options: {} },
  },
  output: [{ message: 'Workflow finished processing current actionable rows.' }],
});

const mediaRouteNode = switchCase({
  version: 3.4,
  config: {
    name: 'Route Media Source',
    position: [680, 40],
    parameters: { mode: 'expression', numberOutputs: 3, output: expr('{{ $json.mediaSourceType === "folder" ? 0 : ($json.mediaSourceType === "file" ? 1 : 2) }}') },
  },
});

const folderSearchNode = node({
  type: 'n8n-nodes-base.googleDrive',
  version: 3,
  credentials: { googleDriveOAuth2Api: newCredential('Google Drive OAuth2') },
  config: {
    name: 'List Drive Folder Files',
    position: [940, -120],
    parameters: {
      resource: 'fileFolder',
      operation: 'search',
      authentication: 'oAuth2',
      searchMethod: 'query',
      queryString: expr('{{ "\\"" + $("Current Row Batch").item.json.googleDriveFolderId + "\\" in parents and trashed = false and mimeType != \\"application/vnd.google-apps.folder\\"" }}'),
      returnAll: true,
      options: { fields: ['id', 'name', 'mimeType', 'webViewLink'] },
    },
  },
  output: [{ id: 'ADD_HERE_SAMPLE_DRIVE_FILE_ID', name: 'slide-1.jpg', mimeType: 'image/jpeg', webViewLink: 'https://drive.google.com/file/d/abc123/view' }],
});

const buildFolderMediaNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Media From Folder',
    position: [1200, -120],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `function infer(h, files){if(h) return h; if(files.length>1) return 'carousel'; const m=String(files[0]?.mimeType||'').toLowerCase(); return m.startsWith('video/')?'video':'image';}
const row=$('Current Row Batch').item.json;
const files=$input.all().map(i=>i.json).filter(f=>f.id && (/^image\\//i.test(String(f.mimeType||'')) || /^video\\//i.test(String(f.mimeType||'')))).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),undefined,{numeric:true,sensitivity:'base'}));
const mediaUrls=files.map(f=>'https://drive.google.com/uc?export=download&id='+f.id);
return [{json:{...row,mediaUrls,postType:mediaUrls.length?infer(row.postTypeHint,files):(row.postTypeHint||'text')}}];`,
    },
  },
  output: [{ rowNumber: 2, mediaUrls: ['https://drive.google.com/uc?export=download&id=abc123'], postType: 'image' }],
});

const buildFileMediaNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Media From Drive File',
    position: [940, 40],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const row=$input.first().json; const postType=row.postTypeHint||'image'; return [{json:{...row,mediaUrls:row.googleDriveFileId?['https://drive.google.com/uc?export=download&id='+row.googleDriveFileId]:[],postType:postType==='text'?'text':postType}}];`,
    },
  },
  output: [{ rowNumber: 2, mediaUrls: ['https://drive.google.com/uc?export=download&id=ADD_HERE_YOUR_DRIVE_FILE_ID'], postType: 'image' }],
});

const buildDirectMediaNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Media From Direct Links',
    position: [940, 200],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `function infer(h, urls){if(h) return h; if(!urls.length) return 'text'; if(urls.length>1) return 'carousel'; const f=String(urls[0]||'').split('?')[0].toLowerCase(); return /\\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/.test(f)?'video':'image';}
const row=$input.first().json; const mediaUrls=Array.isArray(row.directMediaUrls)?row.directMediaUrls.filter(Boolean):[]; return [{json:{...row,mediaUrls,postType:infer(row.postTypeHint,mediaUrls)}}];`,
    },
  },
  output: [{ rowNumber: 2, mediaUrls: ['https://cdn.example.com/example-image.jpg'], postType: 'image' }],
});

const buildPayloadNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build PostApi Payload',
    position: [1460, 40],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `function s(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function rv(row, aliases){const m={}; for(const [k,v] of Object.entries(row||{})) m[s(k)] = v; for(const a of aliases){const hit=m[s(a)]; if(hit!==undefined && String(hit).trim()!=='') return String(hit).trim();} return '';}
function yes(v,d=false){if(v===undefined||v===null||v==='') return d; return ['1','true','yes','y','on','ok','done'].includes(String(v).trim().toLowerCase());}
function list(v){return v?String(v).split(/[,\\n|]/).map(i=>i.trim()).filter(Boolean):[];}
function alias(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');}
function ttPrivacy(v){const n=String(v||'PUBLIC_TO_EVERYONE').trim().toUpperCase(); if(['PUBLIC','EVERYONE','PUBLIC_TO_EVERYONE'].includes(n)) return 'PUBLIC_TO_EVERYONE'; if(['FRIENDS','FRIEND','MUTUAL_FOLLOW_FRIENDS'].includes(n)) return 'MUTUAL_FOLLOW_FRIENDS'; if(['FOLLOWERS','FOLLOWER','FOLLOWER_OF_CREATOR'].includes(n)) return 'FOLLOWER_OF_CREATOR'; if(['PRIVATE','ONLY_ME','SELF_ONLY'].includes(n)) return 'SELF_ONLY'; return n;}
function ytPrivacy(v){const n=String(v||'public').trim().toLowerCase(); return ['private','unlisted','public'].includes(n)?n:'public';}
function configured(cfg){return {facebook:cfg.facebook_id,instagram:cfg.instagram_id,youtube:cfg.youtube_id,tiktok:cfg.tiktok_id,pinterest:cfg.pinterest_id,telegram:cfg.telegram_id,linkedin_page:cfg.linkedin_page_id,linkedin_profile:cfg.linkedin_profile_id,tumblr:cfg.tumblr_id,google_business_profile:cfg.google_business_profile_id};}
function defaultKeys(type){if(type==='video') return ['facebook','instagram','youtube','tiktok','linkedin_profile','linkedin_page','telegram','tumblr']; if(type==='carousel') return ['facebook','instagram','linkedin_profile','linkedin_page']; if(type==='text') return ['facebook','linkedin_profile','linkedin_page','telegram','tumblr','google_business_profile']; return ['facebook','instagram','linkedin_profile','linkedin_page','pinterest','telegram','tumblr','google_business_profile'];}
function bucketAccounts(accounts){const buckets={}; for(const a of accounts){const provider=String(a.provider||'').toLowerCase(); const category=String(a.category||'').toLowerCase(); const key=provider+'::'+category; if(!buckets[key]) buckets[key]=[]; buckets[key].push(a);} return buckets;}
function desiredCategories(key){if(key==='facebook') return ['page']; if(key==='instagram') return ['profile']; if(key==='youtube') return ['channel']; if(key==='tiktok') return ['profile']; if(key==='pinterest') return ['board']; if(key==='telegram') return ['channel']; if(key==='linkedin_page') return ['page']; if(key==='linkedin_profile') return ['profile']; if(key==='tumblr') return ['blog']; if(key==='google_business_profile') return ['location']; return [];}
function desiredProvider(key){if(key==='linkedin_page'||key==='linkedin_profile') return 'linkedin'; return key;}
function resolveIntegrationId(key, configuredId, accountMap, accountBuckets){if(configuredId && accountMap.has(configuredId)) return configuredId; const provider=desiredProvider(key); const categories=desiredCategories(key); for(const category of categories){const match=(accountBuckets[provider+'::'+category]||[])[0]; if(match && match.id) return match.id;} return '';}
function choose(row,cfg,type,accountMap,accounts){const req=list(rv(row,['channels','channel','social channels','networks'])).map(alias); const conf=configured(cfg); const keys=req.length?Object.keys(conf).filter(k=>req.includes(alias(k))||req.includes(alias(k.replace('_profile','').replace('_page','')))):defaultKeys(type); const out=[]; const usedIds=new Set(); const accountBuckets=bucketAccounts(accounts); for(const key of keys){const integrationId=resolveIntegrationId(key, conf[key], accountMap, accountBuckets); if(!integrationId||!accountMap.has(integrationId)||usedIds.has(integrationId)) continue; usedIds.add(integrationId); out.push({key,integrationId,account:accountMap.get(integrationId)});} return out;}
function promoMode(targetKey,row,cfg){const fromRow=rv(row,[targetKey+' promo link mode',targetKey.replace('_',' ')+' promo link mode','promo link mode']); if(fromRow) return fromRow.toLowerCase(); if(targetKey==='facebook') return String(cfg.facebook_promo_link_mode||'comment').toLowerCase(); if(targetKey==='instagram') return String(cfg.instagram_promo_link_mode||'comment').toLowerCase(); return String(cfg.default_promo_link_mode||'caption').toLowerCase();}
function caption(base,link,mode){const c=String(base||'').trim(); const l=String(link||'').trim(); if(mode!=='caption'||!l) return c; if(c.includes(l)) return c; return c?c+'\\n\\n'+l:l;}
function settingsFor(target,row,type,link,title,content,cfg){const l=String(link||'').trim(); const mode=promoMode(target.key,row,cfg); const settings={};
  if(target.key==='facebook'){settings.post_type=type; settings.fb_type=type==='video'?'reels':'feed'; if(mode==='comment'&&l) settings.fb_comment=l; return settings;}
  if(target.key==='instagram'){if(type==='text') return null; settings.post_type=type; settings.ig_type=type==='video'?'reels':'feed'; if(mode==='comment'&&l) settings.ig_comment=l; return settings;}
  if(target.key==='linkedin_page'||target.key==='linkedin_profile'){settings.post_type=type; return settings;}
  if(target.key==='telegram'){if(type==='carousel') return null; settings.post_type=type; return settings;}
  if(target.key==='tiktok'){if(type==='text'||type==='carousel') return null; settings.post_type=type; settings.tt_privacy=ttPrivacy(rv(row,['tiktok privacy','privacy','privacy level'])); settings.tt_consent=yes(rv(row,['tiktok consent','music usage confirmation','consent']),true)?1:0; settings.tt_allow_comment=yes(rv(row,['tiktok allow comment','allow comment']),true)?1:0; settings.tt_allow_duet=yes(rv(row,['tiktok allow duet','allow duet']),false)?1:0; settings.tt_allow_stitch=yes(rv(row,['tiktok allow stitch','allow stitch']),false)?1:0; return settings;}
  if(target.key==='youtube'){if(type!=='video') return null; settings.post_type='video'; settings.youtube_title=rv(row,['youtube title'])||title||String(content||'').slice(0,95)||'POST.devad.io upload'; settings.youtube_privacy=ytPrivacy(rv(row,['youtube privacy','privacy'])); settings.youtube_category=Number(rv(row,['youtube category','category'])||22); return settings;}
  if(target.key==='pinterest'){if(type!=='image') return null; settings.post_type='image'; settings.pinterest_title=rv(row,['pinterest title'])||title||'POST.devad.io pin'; settings.pinterest_link=l||''; const board=rv(row,['pinterest board id','board id'])||cfg.pinterest_board_id; settings.pinterest_board=board; settings.pinterest_board_id=board; return settings;}
  if(target.key==='google_business_profile'){if(type==='video'||type==='carousel') return null; settings.post_type=type==='text'?'text':'image'; if(l){settings.gbp_action='LEARN_MORE'; settings.gbp_link=l;} return settings;}
  if(target.key==='tumblr'){if(type==='carousel') return null; settings.post_type=type; return settings;}
  settings.post_type=type; return settings;
}
function addStory(key,type,cfg){if(type!=='image'&&type!=='video') return false; if(key==='facebook') return yes(cfg.facebook_plus_story,false); if(key==='instagram') return yes(cfg.instagram_plus_story,false); return false;}
const cfg=$('add-HERE-your-token-and-ids').item.json; const raw=$('Fetch PostApi Accounts').item.json||{}; const accounts=Array.isArray(raw.data)?raw.data:(Array.isArray(raw.body?.data)?raw.body.data:[]); const accountMap=new Map(accounts.map(a=>[a.id,a]));
const row=$input.first().json; const src=row.sourceRow||{}; const mediaUrls=Array.isArray(row.mediaUrls)?row.mediaUrls.filter(Boolean):[]; const type=row.postType||row.postTypeHint||(mediaUrls.length?'image':'text'); const title=row.title||rv(src,['title']); const promo=row.promoLink||rv(src,['promotional link','link']); const base=row.captionBase||rv(src,['social media summary (caption)','caption','summary']);
const targets=choose(src,cfg,type,accountMap,accounts); const feedPosts=[]; const storyPosts=[]; const selectedTargets=[];
for(const target of targets){const content=caption(base,promo,promoMode(target.key,src,cfg)); const settings=settingsFor(target,src,type,promo,title,content,cfg); if(!settings) continue; const post={integration:{id:target.integrationId},value:[{content}],media:mediaUrls,settings}; feedPosts.push(post); selectedTargets.push({key:target.key,id:target.integrationId,provider:target.account.provider,category:target.account.category}); if(addStory(target.key,type,cfg)){const story=JSON.parse(JSON.stringify(post)); story.settings.post_type='story'; if(target.key==='facebook') story.settings.fb_type='story'; if(target.key==='instagram') story.settings.ig_type='story'; storyPosts.push(story);}}
if(!feedPosts.length) return [];
const feedPostApiBody=row.scheduleAt?{type:'schedule',date:row.scheduleAt,posts:feedPosts}:{posts:feedPosts};
const storyPostApiBody=storyPosts.length?(row.scheduleAt?{type:'schedule',date:row.scheduleAt,posts:storyPosts}:{posts:storyPosts}):null;
return [{json:{...row,postType:type,mediaUrls,selectedTargets,feedPostApiBody,storyPostApiBody,webhookBody:{source:'n8n-post-devad-sheet',row_number:row.rowNumber,title,caption:base,promotional_link:promo,media:mediaUrls,post_type:type,channels:selectedTargets,feed_post_api_body:feedPostApiBody,story_post_api_body:storyPostApiBody}}}];`,
    },
  },
  output: [{
    rowNumber: 2,
    title: 'Example post title',
    postType: 'image',
    mediaUrls: ['https://drive.google.com/uc?export=download&id=ADD_HERE_YOUR_DRIVE_FILE_ID'],
    selectedTargets: [{ key: 'facebook', id: 'ADD_HERE_YOUR_FACEBOOK_ID', provider: 'facebook', category: 'page' }],
    feedPostApiBody: { type: 'now', posts: [{ integration: { id: 'ADD_HERE_YOUR_FACEBOOK_ID' } }] },
    storyPostApiBody: null,
    webhookBody: { source: 'n8n-post-devad-sheet' },
    webhookUrl: '',
    webhookMethod: 'POST',
  }],
});

const webhookRouteNode = switchCase({
  version: 3.4,
  config: {
    name: 'Route Optional Webhook',
    position: [1720, 40],
    parameters: { mode: 'expression', numberOutputs: 2, output: expr('{{ $json.webhookUrl ? 0 : 1 }}') },
  },
});

const sendWebhookNode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Send Optional Webhook',
    position: [1980, -40],
    parameters: {
      method: expr('{{ $json.webhookMethod || "POST" }}'),
      url: expr('{{ $json.webhookUrl }}'),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ $("Build PostApi Payload").item.json.webhookBody }}'),
      options: { response: { response: { responseFormat: 'json' } } },
    },
  },
  output: [{ ok: true }],
});

const postFeedNode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Post Feed To POST.devad.io',
    position: [2240, 40],
    parameters: {
      method: 'POST',
      url: expr('{{ $("add-HERE-your-token-and-ids").item.json.base_url + "/posts" }}'),
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'api_token', value: expr('{{ $("add-HERE-your-token-and-ids").item.json.post_devad_io_token }}') }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ $("Build PostApi Payload").item.json.feedPostApiBody }}'),
      options: { response: { response: { responseFormat: 'json' } } },
    },
  },
  output: [{ success: true, data: { posts: [{ status: 'queued' }] } }],
});

const storyRouteNode = switchCase({
  version: 3.4,
  config: {
    name: 'Route Story Request',
    position: [2500, 40],
    parameters: {
      mode: 'expression',
      numberOutputs: 2,
      output: expr('{{ Array.isArray($("Build PostApi Payload").item.json.storyPostApiBody?.posts) && $("Build PostApi Payload").item.json.storyPostApiBody.posts.length ? 0 : 1 }}'),
    },
  },
});

const postStoryNode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Post Story To POST.devad.io',
    position: [2760, -40],
    parameters: {
      method: 'POST',
      url: expr('{{ $("add-HERE-your-token-and-ids").item.json.base_url + "/posts" }}'),
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'api_token', value: expr('{{ $("add-HERE-your-token-and-ids").item.json.post_devad_io_token }}') }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ $("Build PostApi Payload").item.json.storyPostApiBody }}'),
      options: { response: { response: { responseFormat: 'json' } } },
    },
  },
  output: [{ success: true, data: { posts: [{ status: 'queued' }] } }],
});

const noStoryNode = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'No Story Needed', position: [2760, 140], parameters: {} },
  output: [{}],
});

const buildSheetUpdateNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Sheet Update Data',
    position: [3020, 40],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `function compact(v){const t=typeof v==='string'?v:JSON.stringify(v||{}); return t.replace(/\\s+/g,' ').trim();}
const row=$('Build PostApi Payload').item.json; const feed=$('Post Feed To POST.devad.io').item.json; let story=null; try{story=$('Post Story To POST.devad.io').item.json;}catch(e){story=null;}
let log='âœ… Posted successfully: '+new Date().toLocaleString(); log+=' | Channels: '+(Array.isArray(row.selectedTargets)?row.selectedTargets.map(t=>t.key).join(', '):''); log+=' | Feed response: '+compact(feed); if(story) log+=' | Story response: '+compact(story);
return [{json:{row_number:String(row.rowNumber),'Action?':'ðŸŸ¢ Done',log}}];`,
    },
  },
  output: [{ row_number: '2', 'Action?': 'ðŸŸ¢ Done', log: 'âœ… Posted successfully' }],
});

const updateSheetNode = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets OAuth2') },
  config: {
    name: 'Update Sheet Status',
    position: [3280, 40],
    parameters: {
      resource: 'sheet',
      operation: 'update',
      authentication: 'oAuth2',
      documentId: { __rl: true, mode: 'url', value: expr('{{ $("add-HERE-your-token-and-ids").item.json.spreadsheet_url }}') },
      sheetName: { __rl: true, mode: 'name', value: expr('{{ $("add-HERE-your-token-and-ids").item.json.sheet_name }}') },
      columns: {
        value: {
          'Action?': expr('{{ $json["Action?"] }}'),
          log: expr('{{ $json.log }}'),
          row_number: expr('{{ $json.row_number }}'),
        },
        schema: [
          { id: 'Action?', type: 'string', display: true, required: false, displayName: 'Action?', defaultMatch: false, canBeUsedToMatch: true },
          { id: 'log', type: 'string', display: true, required: false, displayName: 'log', defaultMatch: false, canBeUsedToMatch: true },
          { id: 'row_number', type: 'string', display: true, removed: false, readOnly: true, required: false, displayName: 'row_number', defaultMatch: false, canBeUsedToMatch: true },
        ],
        mappingMode: 'defineBelow',
        matchingColumns: ['row_number'],
        attemptToConvertTypes: false,
        convertFieldsToString: false,
      },
      options: {},
    },
  },
  output: [{ success: true }],
});

const afterFeedChain = postFeedNode.to(storyRouteNode
  .onCase(0, postStoryNode.to(buildSheetUpdateNode.to(updateSheetNode.to(nextBatch(rowBatchNode)))))
  .onCase(1, noStoryNode.to(buildSheetUpdateNode.to(updateSheetNode.to(nextBatch(rowBatchNode)))))
);

const afterWebhookChain = webhookRouteNode
  .onCase(0, sendWebhookNode.to(afterFeedChain))
  .onCase(1, afterFeedChain);

const folderChain = folderSearchNode.to(buildFolderMediaNode.to(buildPayloadNode.to(afterWebhookChain)));
const fileChain = buildFileMediaNode.to(buildPayloadNode.to(afterWebhookChain));
const directChain = buildDirectMediaNode.to(buildPayloadNode.to(afterWebhookChain));

export default workflow('KSP2fJsRJkghbBnX', 'CODEX - POST.devad.io - Sheet To Social Full')
  .add(overviewNote)
  .add(credentialsNote)
  .add(manualTriggerNode)
  .to(setupNode)
  .to(fetchAccountsNode)
  .to(readSheetNode)
  .to(normalizeRowsNode)
  .to(rowBatchNode
    .onDone(finishNode)
    .onEachBatch(mediaRouteNode
      .onCase(0, folderChain)
      .onCase(1, fileChain)
      .onCase(2, directChain)
    )
  );


