chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "toggle") {
            setAdBlockingEnabled(request.status);
        }
    }
);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "updateBlockingRules") {
            updateExtensionBlockingRules(request.rules);
            console.log("Updating blocking rules:", request.rules); // Corrected variable name to request.rules
        }
    }
);

function setAdBlockingEnabled(enable) {
    if (enable) {
        // Code to enable ad blocking
        console.log('Ad blocking enabled');
    } else {
        // Code to disable ad blocking
        console.log('Ad blocking disabled');
    }
}

// Listen for page navigation events
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
    // Check if the navigation is to a URL known to display interstitial ads
    if (isInterstitialAd(details.url)) {
        // Cancel the navigation to prevent the interstitial ad from being shown
        chrome.webNavigation.onBeforeNavigate.removeListener(cancelNavigation);
        chrome.webNavigation.onBeforeNavigate.addListener(cancelNavigation);
        console.log("Page navigation event:", details);
    }
});

// Function to cancel navigation
function cancelNavigation(details) {
    chrome.webNavigation.onBeforeNavigate.removeListener(cancelNavigation);
    return { cancel: true };
}

// Function to check if a URL leads to an interstitial ad page
function isInterstitialAd(url) {
    // Define patterns or keywords that indicate interstitial ads
    const interstitialPatterns = [
        'interstitial', // Example: Check for 'interstitial' in the URL
        'adserver',     // Example: Check for 'adserver' in the URL
        'popup',        // Example: Check for 'popup' in the URL
        // Add more patterns as needed
    ];

    // Check if the URL contains any of the interstitial patterns
    for (const pattern of interstitialPatterns) {
        if (url.includes(pattern)) {
            return true; // URL matches an interstitial ad pattern
        }
    }

    // Check for additional criteria such as specific domains or page content
    if (new URL(url).hostname === 'example.com') {

        const pageContent = document.body.innerHTML;
        if (pageContent.includes('interstitial-ad')) {
            return true; // Page content indicates an interstitial ad
        }
    }

    return false; // No interstitial ad detected
}


// Function to fetch blocking rules from Pi-hole
async function fetchPiHoleRules() {
    try {
        const response = await fetch('http://pihole.local/admin/api.php?action=getlist&list=black');
        if (response.ok) {
            const blocklist = await response.json();
            // Process the blocklist and update extension's blocking rules
            updateExtensionBlockingRules(blocklist);
        } else {
            console.error('Failed to fetch blocking rules from Pi-hole:', response.status);
        }
    } catch (error) {
        console.error('Error fetching blocking rules from Pi-hole:', error);
    }
}

// Function to sync extension's blocking rules with Pi-hole periodically
function syncWithPiHole() {
    setInterval(fetchPiHoleRules, 3600000); // Fetch every hour
}

// Function to update extension's blocking rules
function updateExtensionBlockingRules(blocklist) {
    // Extract domains from the blocklist
    const domains = blocklist.split('\n').filter(domain => domain.trim() !== '');
    
    // Convert domains to URL filter patterns
    const urlFilters = domains.map(domain => `*://*${domain}/*`);
    
    // Create blocking rules for each domain
    const blockingRules = urlFilters.map((urlFilter, index) => ({
        id: index + 1, // Unique identifier for the rule
        priority: 1,
        action: {
            type: "block"
        },
        condition: {
            urlFilter: urlFilter,
            resourceTypes: [
                "main_frame",
                "sub_frame",
                "script",
                "xmlhttprequest",
                "image",
                "stylesheet",
                "object",
                "other"
            ]
        }
    }));

    // Send a message to background script to update blocking rules
    chrome.runtime.sendMessage({ action: "updateBlockingRules", rules: blockingRules });
}
