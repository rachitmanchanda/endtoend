// Inject Tailwind CSS into the page
const tailwindLink = document.createElement('link');
tailwindLink.rel = 'stylesheet';
tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
document.head.appendChild(tailwindLink);

// Mode state
let isInspectMode = false;

// Create a bottom floating panel for controls
const bottomPanel = document.createElement('div');
bottomPanel.id = 'inspectPluginElements';
bottomPanel.classList.add('fixed', 'bottom-0', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-white', 'text-black', 'shadow-lg', 'p-3', 'rounded-full', 'flex', 'justify-center', 'items-center', 'space-x-4');
bottomPanel.style.zIndex = '10000';
document.body.appendChild(bottomPanel);

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
        const boundingBox = document.getElementById('inspect-bounding-box');
        if (boundingBox) boundingBox.remove();
    }
}

// Function to handle element hover
function handleHover(event) {
    if (event.target.closest('#inspectPluginElements')) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;
    const rect = element.getBoundingClientRect();

    // Create or update bounding box
    let boundingBox = document.getElementById('inspect-bounding-box');
    if (!boundingBox) {
        boundingBox = document.createElement('div');
        boundingBox.id = 'inspect-bounding-box';
        document.body.appendChild(boundingBox);
    }
    boundingBox.style.position = 'absolute';
    boundingBox.style.border = '2px solid red';
    boundingBox.style.pointerEvents = 'none';
    boundingBox.style.zIndex = '10000';
    boundingBox.style.left = `${rect.left + window.scrollX}px`;
    boundingBox.style.top = `${rect.top + window.scrollY}px`;
    boundingBox.style.width = `${rect.width}px`;
    boundingBox.style.height = `${rect.height}px`;
}

// Function to handle element click
function handleElementClick(event) {
    if (event.target.closest('#inspectPluginElements')) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target;
    const rect = element.getBoundingClientRect();
    updateFlyoutMenu(element, rect);
}

// Function to update flyout menu
function updateFlyoutMenu(element, rect) {
    const computedStyles = window.getComputedStyle(element);
    
    dropdown.innerHTML = `
        <h3 class="text-lg font-bold mb-2">Element: ${element.tagName.toLowerCase()}</h3>
        <div class="max-h-60 overflow-y-auto">
            <pre class="text-sm bg-gray-100 p-2 rounded font-medium"><code>${getFormattedCSS(computedStyles)}</code></pre>
        </div>
        <textarea id="feedbackText" class="w-full mt-4 p-2 border rounded font-medium" placeholder="Write feedback..."></textarea>
        <button id="screenshotBtn" class="mt-4 bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 font-medium">Take Screenshot</button>
    `;

    dropdown.style.left = `${rect.right + window.scrollX + 10}px`;
    dropdown.style.top = `${rect.top + window.scrollY}px`;
    dropdown.classList.remove('hidden');

    document.getElementById('screenshotBtn').addEventListener('click', () => takeScreenshot(element));
}

// Function to handle mouse out
function handleMouseOut(event) {
    if (!event.target.closest('#inspectPluginElements')) {
        const boundingBox = document.getElementById('inspect-bounding-box');
        if (boundingBox) boundingBox.remove();
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

// Add styles for highlight
const style = document.createElement('style');
style.textContent = `
    .highlight-element {
        outline: 2px solid red !important;
    }
`;
document.head.appendChild(style);