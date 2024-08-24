// Save state on input changes
document.getElementById('annotation').addEventListener('input', () => {
    const annotation = document.getElementById('annotation').value;
    chrome.storage.local.set({ annotation });
});

// Restore state when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['annotation'], (result) => {
        if (result.annotation) {
            document.getElementById('annotation').value = result.annotation;
        }
    });
});
