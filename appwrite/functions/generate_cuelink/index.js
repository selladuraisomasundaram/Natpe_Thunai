const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // 1. Initialize Client
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_PRODUCTS_COLLECTION_ID = 'affiliate_listings'; 

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method must be POST' }, 400);
  }

  try {
    const payload = JSON.parse(req.body);
    const listingId = payload.listingId;
    const pubId = process.env.CUELINKS_PUB_ID; 

    if (!listingId) throw new Error("Missing listingId");
    if (!pubId) throw new Error("Missing CUELINKS_PUB_ID env variable");

    // 2. Fetch Original URL
    const product = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_PRODUCTS_COLLECTION_ID,
      listingId
    );

    let rawUrl = product.original_url;

    if (!rawUrl) {
      throw new Error(`Product ${listingId} has empty original_url in DB.`);
    }

    // --- FIX: URL CLEANING & VALIDATION ---
    // 1. Remove accidental spaces
    rawUrl = rawUrl.trim();

    // 2. Add https:// if missing
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
      log(`Auto-fixed URL to: ${rawUrl}`);
    }

    // 3. Validate it is a real URL (throws error if invalid)
    new URL(rawUrl); 

    // 3. Generate Deep Link
    const encodedUrl = encodeURIComponent(rawUrl);
    const affiliateUrl = `https://links.cuelinks.com/cu/${pubId}?url=${encodedUrl}`;

    log(`Success: ${affiliateUrl}`);

    return res.json({
      success: true,
      cueLink: affiliateUrl
    });

  } catch (err) {
    error("Error: " + err.message);
    return res.json({ success: false, error: "Invalid URL in database: " + err.message }, 500);
  }
};