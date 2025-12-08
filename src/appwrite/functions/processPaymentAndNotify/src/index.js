const sdk = require('node-appwrite');

module.exports = async function (req, res) {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const users = new sdk.Users(client);

  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.APPWRITE_TRANSACTIONS_COLLECTION_ID;
  const APPWRITE_PRODUCTS_COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID;
  const APPWRITE_USER_PROFILES_COLLECTION_ID = process.env.APPWRITE_USER_PROFILES_COLLECTION_ID;

  if (req.method === 'POST' && req.body) {
    const transactionData = JSON.parse(req.body);
    console.log('Processing new transaction:', transactionData.$id);

    try {
      let sellerLevel = 1;
      try {
        const sellerProfileResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          [sdk.Query.equal('userId', transactionData.sellerId), sdk.Query.limit(1)] // Consistently use sellerId
        );
        if (sellerProfileResponse.documents.length > 0) {
          sellerLevel = sellerProfileResponse.documents[0].level || 1;
        }
      } catch (profileError) {
        console.warn(`Could not fetch seller profile for user ${transactionData.sellerId}:`, profileError); // Consistently use sellerId
      }

      const calculateCommissionRate = (level) => {
        const START_RATE = 0.1132;
        const MIN_RATE = 0.0537;
        const MAX_LEVEL_FOR_MIN_RATE = 25;

        if (level <= 1) return START_RATE;
        if (level >= MAX_LEVEL_FOR_MIN_RATE) return MIN_RATE;

        const levelRange = MAX_LEVEL_FOR_MIN_RATE - 1;
        const rateRange = START_RATE - MIN_RATE;
        const reductionPerLevel = rateRange / levelRange;
        return START_RATE - (level - 1) * reductionPerLevel;
      };

      const COMMISSION_RATE = calculateCommissionRate(sellerLevel);

      if (transactionData.status === 'payment_confirmed_to_developer') {
        const amount = transactionData.amount;
        const commissionAmount = amount * COMMISSION_RATE;
        const netSellerAmount = amount - commissionAmount;

        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transactionData.$id,
          {
            status: 'commission_deducted',
            commissionAmount: commissionAmount,
            netSellerAmount: netSellerAmount,
            utrId: transactionData.utrId || null,
          }
        );
        console.log(`Transaction ${transactionData.$id} updated with commission and status 'commission_deducted'.`);
        console.log(`Developer Notification: New Payment Claim: Order ${transactionData.$id} by ${transactionData.buyerName}. TR ID: ${transactionData.utrId}. Amount: ${amount}. Commission: ${commissionAmount}. Net to Seller: ${netSellerAmount}.`);


        const product = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          transactionData.productId
        );

        if (product.type === 'sell') {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            transactionData.productId,
            { status: 'sold' }
          );
          console.log(`Product ${transactionData.productId} marked as sold.`);
        } else if (product.type === 'rent') {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            transactionData.productId,
            { status: 'rented' } 
          );
          console.log(`Product ${transactionData.productId} marked as rented.`);
        }

        console.log(`Provider Notification (Simulated): Upon manual verification and payment, seller ${transactionData.sellerName} will be notified: "Order Confirmed! Prepare ${transactionData.productTitle} for ${transactionData.buyerName}."`);

        res.json({ success: true, message: 'Transaction processed, commission deducted, and product status updated.' });

      } else if (transactionData.status === 'initiated') {
        console.log(`Transaction ${transactionData.$id} initiated. Awaiting payment confirmation from buyer.`);
        res.json({ success: true, message: 'Transaction initiated, awaiting buyer payment confirmation.' });
      } else {
        console.log(`Transaction ${transactionData.$id} has status ${transactionData.status}. No further automatic processing.`);
        res.json({ success: true, message: 'Transaction status already processed or not applicable for this function.' });
      }

    } catch (error) {
      console.error('Function execution failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(400).json({ success: false, error: 'Invalid request method or body.' });
  }
};