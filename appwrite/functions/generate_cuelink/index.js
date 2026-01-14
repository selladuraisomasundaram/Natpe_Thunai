const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID; 

  if (req.method !== 'POST') return res.json({ success: false, error: 'Method must be POST' }, 400);

  try {
    const payload = JSON.parse(req.body);
    const listingId = payload.listingId;
    const pubId = process.env.CUELINKS_PUB_ID; // Your ID: 256625

    const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [ sdk.Query.equal('$id', listingId) ]
    );

    if (response.total === 0) throw new Error(`Product ${listingId} not found.`);

    const product = response.documents[0];

    // Smart Attribute Search
    let rawUrl = product.originalUrl;

    if (!rawUrl) throw new Error(`Product found, but URL is missing.`);

    rawUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = 'https://' + rawUrl;

    const encodedUrl = encodeURIComponent(rawUrl);

    // --- CRITICAL FIX ---
    // Use the official redirect domain with 'source=linkkit' to ensure attribution.
    // We use 'pub_id' (common) but sometimes Cuelinks uses 'cid'. 
    // Try this format first:
    const affiliateUrl = `https://linksredirect.com/?cid=${pubId}&source=linkkit&url=${encodedUrl}`;

    return res.json({ success: true, cueLink: affiliateUrl });

  } catch (err) {
    error("Error: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};