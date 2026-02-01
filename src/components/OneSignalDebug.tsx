const forceSync = async () => {
    // 1. Check if we are actually in the app
    const isMedian = navigator.userAgent.includes('wv') || window.location.href.includes('median');
    if (!isMedian) {
        addLog("⚠️ Not in Median App (Browser Mode)");
        return;
    }

    addLog("🚀 Requesting Info via Promise...");

    try {
        // 2. WAIT for the bridge to be ready (Critical Step)
        if (typeof (window as any).median === 'undefined') {
             addLog("⏳ Waiting for Median Bridge...");
             await new Promise(resolve => setTimeout(resolve, 2000)); // Give it 2 seconds
        }

        // 3. Call the Native Bridge directly using await
        // This halts code execution until the phone responds
        const data = await (window as any).median.onesignal.onesignalInfo();
        
        addLog(`✅ DATA RECEIVED: ${JSON.stringify(data)}`);

        if (data?.oneSignalUserId) {
            await saveToAppwrite(data.oneSignalUserId);
        } else {
            addLog("❌ oneSignalUserId is missing in response");
        }

    } catch (error: any) {
        addLog(`💥 BRIDGE ERROR: ${error.message || JSON.stringify(error)}`);
        
        // Fallback: Older Median versions might not support promises
        // Try the legacy callback trigger manually
        addLog("🔄 Trying Legacy Callback...");
        (window as any).median.onesignal.info(); 
    }
  };