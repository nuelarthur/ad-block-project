document.addEventListener('DOMContentLoaded', function() {
    // Retrieve the toggle status from storage
    chrome.storage.local.get(['adBlockEnabled'], function(result) {
        let currentStatus = result.adBlockEnabled !== undefined ? result.adBlockEnabled : true;
        updateToggleButton(currentStatus);
    });

    // Add click event listener to the toggle button
    document.getElementById('toggleButton').addEventListener('click', function() {
        // Toggle the current status
        chrome.storage.local.get(['adBlockEnabled'], function(result) {
            let currentStatus = !result.adBlockEnabled;
            updateToggleButton(currentStatus);

            // Save the updated status to storage
            chrome.storage.local.set({'adBlockEnabled': currentStatus});

            // Send a message to background.js to enable/disable ad blocking
            chrome.runtime.sendMessage({action: 'toggle', status: currentStatus});
        });
    });
});

// Function to update the toggle button text and color
function updateToggleButton(status) {
    let button = document.getElementById('toggleButton');
    button.textContent = status ? 'Toggle OFF' : 'Toggle ON';
    button.style.backgroundColor = status ? '#ff6347' : '#2ecc71'; // Red if enabled, green if disabled
}
