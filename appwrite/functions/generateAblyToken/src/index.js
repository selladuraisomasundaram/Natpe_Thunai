const Ably = require('ably');

module.exports = async function (req, res) {
  const ABLY_API_KEY = req.env.ABLY_API_KEY;

  if (!ABLY_API_KEY) {
    return res.json({
      success: false,
      error: 'Ably API key not configured for the function.',
    }, 500);
  }

  const { userId, channelName } = JSON.parse(req.body);

  if (!userId || !channelName) {
    return res.json({
      success: false,
      error: 'Missing userId or channelName in request body.',
    }, 400);
  }

  try {
    const ably = new Ably.Rest(ABLY_API_KEY);
    const tokenParams = {
      clientId: userId, // Use Appwrite userId as Ably clientId
      capability: {
        [`${channelName}`]: ['publish', 'subscribe', 'history'],
      },
      // Set a short TTL for tokens, e.g., 1 hour (3600 seconds)
      // This helps with security and token limit management.
      ttl: 3600 * 1000, // 1 hour in milliseconds
    };

    const tokenRequest = await ably.auth.createTokenRequest(tokenParams);

    return res.json({
      success: true,
      tokenRequest: tokenRequest,
    });
  } catch (error) {
    console.error('Error generating Ably token:', error);
    return res.json({
      success: false,
      error: error.message || 'Failed to generate Ably token.',
    }, 500);
  }
};