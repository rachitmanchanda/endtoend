// Check if Tailwind CSS is already loaded
if (!document.querySelector('link[href*="tailwindcss"]')) {
    // Inject Tailwind CSS into the page
    const tailwindLink = document.createElement('link');
    tailwindLink.rel = 'stylesheet';
    tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    document.head.appendChild(tailwindLink);
}

// Mode state
let isInspectMode = false;

// Create a bottom floating panel for controls
const bottomPanel = document.createElement('div');
bottomPanel.id = 'inspectPluginElements';
bottomPanel.classList.add('fixed', 'bottom-0', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-white', 'text-black', 'shadow-lg', 'p-3', 'rounded-full', 'flex', 'justify-center', 'items-center', 'space-x-4');
bottomPanel.style.zIndex = '10000';
document.body.appendChild(bottomPanel);

// Add these lines to set default light theme and improve font visibility
const style = document.createElement('style');
style.textContent = `
    #inspectPluginElements, #inspect-bounding-box, #feedbackText {
        font-weight: 500 !important;
        background-color: rgba(243, 244, 246, 0.8) !important;
        color: #000000 !important;
        backdrop-filter: blur(5px) !important;
        -webkit-backdrop-filter: blur(5px) !important;
    }
    .highlight-element {
        position: relative;
    }
    .highlight-element::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid red;
        pointer-events: none;
        z-index: 10000;
    }
    .selected-element::after {
        border: 2px solid blue;
    }
    #screenshotBtn {
        background: linear-gradient(to right, #000000, #333333) !important;
        color: white !important;
        transition: all 0.3s ease !important;
    }
    #screenshotBtn:hover {
        background: linear-gradient(to right, #333333, #000000) !important;
    }
`;
document.head.appendChild(style);

// Toggle Inspect Mode Button
const inspectToggleButton = document.createElement('button');
inspectToggleButton.innerText = 'Enable Inspect';
inspectToggleButton.classList.add('text-white', 'bg-blue-600', 'rounded', 'px-4', 'py-2', 'hover:bg-blue-700', 'focus:outline-none', 'font-medium');
inspectToggleButton.onclick = toggleInspectMode;
bottomPanel.appendChild(inspectToggleButton);

// Close Plugin Button
const closePluginButton = document.createElement('button');
closePluginButton.innerText = 'Close Plugin';
closePluginButton.classList.add('text-white', 'bg-red-600', 'rounded', 'px-4', 'py-2', 'hover:bg-red-700', 'focus:outline-none', 'font-medium');
closePluginButton.onclick = closePlugin;
bottomPanel.appendChild(closePluginButton);

// Create dropdown for CSS properties
const dropdown = document.createElement('div');
dropdown.id = 'inspectPluginElements';
dropdown.classList.add('fixed', 'bg-white', 'p-4', 'rounded', 'shadow-lg', 'z-50', 'hidden', 'font-medium');
document.body.appendChild(dropdown);

// Add a variable to keep track of the currently selected element
let selectedElement = null;

// Function to toggle inspect mode
function toggleInspectMode() {
    isInspectMode = !isInspectMode;
    inspectToggleButton.innerText = isInspectMode ? 'Disable Inspect' : 'Enable Inspect';
    document.body.style.cursor = isInspectMode ? 'crosshair' : 'default';

    if (isInspectMode) {
        document.addEventListener('mouseover', handleHover);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('click', handleElementClick, true);
    } else {
        document.removeEventListener('mouseover', handleHover);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('click', handleElementClick, true);
        dropdown.classList.add('hidden');
        // Remove highlight from all elements except the selected one
        document.querySelectorAll('.highlight-element:not(.selected-element)').forEach(el => {
            el.classList.remove('highlight-element');
        });
    }
}

// Function to handle element hover
function handleHover(event) {
    if (event.target.closest('#inspectPluginElements')) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;
    
    // Remove highlight from all elements except the selected one
    document.querySelectorAll('.highlight-element:not(.selected-element)').forEach(el => {
        el.classList.remove('highlight-element');
    });
    
    // Add highlight to current element if it's not the selected one
    if (element !== selectedElement) {
        element.classList.add('highlight-element');
    }
}

// Function to handle element click
function handleElementClick(event) {
    if (event.target.closest('#inspectPluginElements')) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;

    // Remove previous selection
    if (selectedElement) {
        selectedElement.classList.remove('selected-element');
    }

    // Set new selection
    selectedElement = element;
    element.classList.add('selected-element');

    const rect = element.getBoundingClientRect();
    updateFlyoutMenu(element, rect);
}

// Function to update flyout menu
function updateFlyoutMenu(element, rect) {
    const computedStyles = window.getComputedStyle(element);
    
    dropdown.innerHTML = `
        <h3 class="text-lg font-bold mb-2 text-black">Element: ${element.tagName.toLowerCase()}</h3>
        <div class="max-h-60 overflow-y-auto">
            <pre class="text-sm bg-gray-100 p-2 rounded font-medium text-black"><code>${getFormattedCSS(computedStyles)}</code></pre>
        </div>
        <textarea id="feedbackText" class="w-full mt-4 p-2 border rounded font-medium bg-gray-100 text-black" placeholder="Write feedback..."></textarea>
        <button id="screenshotBtn" class="w-full mt-4 text-white rounded px-4 py-2 font-medium">Take Screenshot</button>
    `;

    dropdown.classList.remove('hidden');
    dropdown.classList.add('bg-opacity-80', 'backdrop-filter', 'backdrop-blur-sm');

    // Calculate available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropdownWidth = dropdown.offsetWidth;
    const dropdownHeight = dropdown.offsetHeight;

    // Calculate initial position
    let left = rect.right + window.scrollX + 10;
    let top = rect.top + window.scrollY;

    // Adjust horizontal position if needed
    if (left + dropdownWidth > viewportWidth) {
        left = Math.max(0, viewportWidth - dropdownWidth - 10);
    }

    // Adjust vertical position if needed
    if (top + dropdownHeight > viewportHeight) {
        top = Math.max(0, viewportHeight - dropdownHeight - 10);
    }

    // Apply the calculated position
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;

    document.getElementById('screenshotBtn').addEventListener('click', () => takeScreenshot(element));
}

// Function to handle mouse out
function handleMouseOut(event) {
    if (!event.target.closest('#inspectPluginElements') && event.target !== selectedElement) {
        event.target.classList.remove('highlight-element');
    }
}

// Function to get formatted CSS
function getFormattedCSS(styles) {
    let result = '';
    const importantProperties = ['width', 'height', 'color', 'background-color', 'font-size', 'margin', 'padding', 'border'];
    
    for (let prop of importantProperties) {
        if (styles.getPropertyValue(prop)) {
            result += `${prop}: ${styles.getPropertyValue(prop)};\n`;
        }
    }
    return result;
}

// Function to take a screenshot
function takeScreenshot(element) {
    const feedback = document.getElementById('feedbackText').value;
    const rect = element.getBoundingClientRect();

    chrome.runtime.sendMessage({ 
        action: 'takeScreenshot',
        feedback: feedback,
        elementInfo: {
            tag: element.tagName.toLowerCase(),
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        }
    }, (response) => {
        if (response && response.screenshotUrl) {
            // Copy screenshot to clipboard
            fetch(response.screenshotUrl)
                .then(res => res.blob())
                .then(blob => {
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]);
                    alert('Screenshot copied to clipboard!');
                });
        }
    });
    // Keep the bounding box visible after taking the screenshot
    element.classList.add('selected-element');
}

// Function to close the plugin
function closePlugin() {
    document.body.removeChild(bottomPanel);
    document.body.removeChild(dropdown);
    document.removeEventListener('mouseover', handleHover);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleElementClick, true);
    const boundingBox = document.getElementById('inspect-bounding-box');
    if (boundingBox) boundingBox.remove();
}
