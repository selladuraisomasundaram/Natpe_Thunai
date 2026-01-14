const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // 1. Initialize Client
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);

  // 2. Environment Variables
  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.APPWRITE_TRANSACTIONS_COLLECTION_ID;
  const APPWRITE_PRODUCTS_COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID;
  const APPWRITE_USER_PROFILES_COLLECTION_ID = process.env.APPWRITE_USER_PROFILES_COLLECTION_ID;

  // 3. Request Validation
  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  if (!req.body) {
    return res.json({ success: false, error: 'Missing request body' }, 400);
  }

  let transactionData;
  try {
    // Handle cases where body is already an object or a string
    transactionData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    error('Failed to parse JSON body: ' + e.message);
    return res.json({ success: false, error: 'Invalid JSON' }, 400);
  }

  log(`Processing transaction: ${transactionData.$id} | Status: ${transactionData.status}`);

  try {
    // --- SCENARIO A: Payment Confirmed (Calculate Commission) ---
    if (transactionData.status === 'payment_confirmed_to_developer') {
      
      // A1. Get Seller Level
      let sellerLevel = 1;
      try {
        const sellerProfileResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          [
            sdk.Query.equal('userId', transactionData.sellerId),
            sdk.Query.limit(1)
          ]
        );
        if (sellerProfileResponse.documents.length > 0) {
          sellerLevel = sellerProfileResponse.documents[0].level || 1;
        }
      } catch (profileError) {
        log(`Warning: Could not fetch profile for ${transactionData.sellerId}. Using Level 1.`);
      }

      // A2. Calculate Commission
      const calculateCommissionRate = (level) => {
        const START_RATE = 0.1132; 
        const MIN_RATE = 0.0537; 
        const MAX_LEVEL = 25;

        if (level <= 1) return START_RATE;
        if (level >= MAX_LEVEL) return MIN_RATE;

        const levelRange = MAX_LEVEL - 1;
        const rateRange = START_RATE - MIN_RATE;
        const reductionPerLevel = rateRange / levelRange;
        return START_RATE - (level - 1) * reductionPerLevel;
      };

      const COMMISSION_RATE = calculateCommissionRate(sellerLevel);
      const amount = parseFloat(transactionData.amount);
      const commissionAmount = amount * COMMISSION_RATE;
      const netSellerAmount = amount - commissionAmount;

      // A3. Update Transaction
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionData.$id,
        {
          status: 'commission_deducted',
          commissionAmount: commissionAmount,
          netSellerAmount: netSellerAmount,
          // Only update UTR if it exists in the incoming data
          ...(transactionData.utrId && { utrId: transactionData.utrId }),
        }
      );

      // A4. Update Product Status (if productId exists)
      if (transactionData.productId) {
        try {
          const product = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            transactionData.productId
          );

          let newStatus = null;
          if (product.type === 'sell') newStatus = 'sold';
          else if (product.type === 'rent') newStatus = 'rented';

          if (newStatus) {
            await databases.updateDocument(
              APPWRITE_DATABASE_ID,
              APPWRITE_PRODUCTS_COLLECTION_ID,
              transactionData.productId,
              { status: newStatus }
            );
            log(`Product ${transactionData.productId} marked as ${newStatus}`);
          }
        } catch (prodErr) {
          error(`Failed to update product status: ${prodErr.message}`);
          // Don't fail the whole function if product update fails
        }
      }

      return res.json({ success: true, message: 'Commission calculated and product updated.' });

    // --- SCENARIO B: Seller Confirmed Delivery ---
    } else if (transactionData.status === 'seller_confirmed_delivery') {
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionData.$id,
        { status: 'paid_to_seller' }
      );
      
      log(`Transaction ${transactionData.$id} closed. Seller confirmed delivery.`);
      return res.json({ success: true, message: 'Marked as paid_to_seller.' });

    // --- SCENARIO C: Initiated ---
    } else if (transactionData.status === 'initiated') {
      return res.json({ success: true, message: 'Transaction initiated.' });
    
    // --- DEFAULT ---
    } else {
      return res.json({ success: true, message: 'No action required for this status.' });
    }

  } catch (err) {
    error('Execution Error: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};