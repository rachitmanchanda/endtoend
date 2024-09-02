// Inject Tailwind CSS into the page
if (!document.getElementById('tailwind-css')) {
    const tailwindLink = document.createElement('link');
    tailwindLink.id = 'tailwind-css';
    tailwindLink.rel = 'stylesheet';
    tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    document.head.appendChild(tailwindLink);
}

// Mode state
let isInspectMode = false;

// Create a bottom floating panel for controls
const bottomPanel = document.createElement('div');
bottomPanel.classList.add('fixed', 'bottom-0', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-white', 'text-black', 'shadow-lg', 'p-3', 'rounded-full', 'flex', 'justify-center', 'items-center', 'space-x-4', 'font-medium');
bottomPanel.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    color: black;
    padding: 0.75rem;
    border-radius: 9999px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-weight: 500;
`;
document.body.appendChild(bottomPanel);

// Helper function to check if an element is part of the plugin
function isPartOfPlugin(element) {
    return element === bottomPanel || bottomPanel.contains(element) || 
           element === dropdown || dropdown.contains(element);
}

// Toggle Inspect Mode Button
const inspectToggleButton = document.createElement('button');
inspectToggleButton.innerText = 'Enable Inspect';
inspectToggleButton.classList.add('text-white', 'bg-blue-600', 'rounded', 'px-4', 'py-2', 'hover:bg-blue-700', 'focus:outline-none');
inspectToggleButton.onclick = toggleInspectMode;
bottomPanel.appendChild(inspectToggleButton);

// Close Plugin Button
const closePluginButton = document.createElement('button');
closePluginButton.innerText = 'Close Plugin';
closePluginButton.classList.add('text-white', 'bg-red-600', 'rounded', 'px-4', 'py-2', 'hover:bg-red-700', 'focus:outline-none');
closePluginButton.onclick = closePlugin;
bottomPanel.appendChild(closePluginButton);

// Create dropdown for feedback input
const dropdown = document.createElement('div');
dropdown.style.position = 'absolute';
dropdown.style.zIndex = '10001';
dropdown.style.backgroundColor = 'white';
dropdown.style.border = '1px solid black';
dropdown.style.borderRadius = '5px';
dropdown.style.padding = '10px';
dropdown.style.display = 'none';
document.body.appendChild(dropdown);

// Add light mode styles
const lightModeStyles = `
    .plugin-ui {
        background-color: #ffffff;
        color: #000000;
        border: 1px solid #cccccc;
    }
    .plugin-ui button {
        background-color: #f0f0f0;
        color: #000000;
        border: 1px solid #cccccc;
    }
    .plugin-ui button:hover {
        background-color: #e0e0e0;
    }
`;

const pluginStyle = document.createElement('style');
pluginStyle.textContent = lightModeStyles;
document.head.appendChild(pluginStyle);

// Update handleHover function
function handleHover(event) {
    const element = event.target;
    if (isPartOfPlugin(element)) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const computedStyles = window.getComputedStyle(element);
    const cssProperties = getFormattedCSS(computedStyles);
    
    // Update and show the dropdown
    dropdown.innerHTML = `
        <h3 style="margin-bottom: 5px;">Element: ${element.tagName.toLowerCase()}</h3>
        <div style="max-height: 100px; overflow-y: auto; margin-bottom: 10px;">
            <pre style="font-size: 12px;">${cssProperties}</pre>
        </div>
        <h3 style="margin-bottom: 5px;">Design Feedback</h3>
        <textarea id="feedbackInput" style="width: 200px; height: 60px; margin-bottom: 10px;"></textarea>
        <button id="screenshotBtn" style="background-color: #4CAF50; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">Take Screenshot</button>
    `;
    dropdown.style.left = `${event.clientX + 10}px`;
    dropdown.style.top = `${event.clientY + 10}px`;
    dropdown.style.display = 'block';
    
    // Add red bounding box
    const rect = element.getBoundingClientRect();
    const boundingBox = document.createElement('div');
    boundingBox.id = 'inspect-bounding-box';
    boundingBox.style.position = 'absolute';
    boundingBox.style.border = '2px solid red';
    boundingBox.style.pointerEvents = 'none';
    boundingBox.style.zIndex = '10000';
    boundingBox.style.left = `${rect.left + window.scrollX}px`;
    boundingBox.style.top = `${rect.top + window.scrollY}px`;
    boundingBox.style.width = `${rect.width}px`;
    boundingBox.style.height = `${rect.height}px`;
    document.body.appendChild(boundingBox);
    
    const screenshotBtn = document.getElementById('screenshotBtn');
    screenshotBtn.onclick = () => takeScreenshot(element, event.clientX, event.clientY);
}

// Function to handle mouse out
function handleMouseOut(event) {
    if (!dropdown.contains(event.relatedTarget)) {
        dropdown.style.display = 'none';
        const boundingBox = document.getElementById('inspect-bounding-box');
        if (boundingBox) boundingBox.remove();
    }
}

// Update takeScreenshot function
function takeScreenshot(element, x, y) {
    const feedbackInput = document.getElementById('feedbackInput');
    const feedback = feedbackInput ? feedbackInput.value : '';
    const rect = element.getBoundingClientRect();

    // Hide the plugin UI, dropdown, and bounding box
    bottomPanel.style.display = 'none';
    dropdown.style.display = 'none';
    const boundingBox = document.getElementById('inspect-bounding-box');
    if (boundingBox) boundingBox.style.display = 'none';

    // Send a message to the background script to take a screenshot
    window.postMessage(
        { 
            type: 'TAKE_SCREENSHOT',
            elementInfo: {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            },
            feedback: feedback,
            x: x,
            y: y
        },
        '*'
    );
}

// Listen for messages from the background script
window.addEventListener('message', (event) => {
    if (event.data.type === 'SCREENSHOT_TAKEN') {
        const { screenshotUrl, feedback, x, y } = event.data;
        
        // Show the plugin UI and bounding box again
        bottomPanel.style.display = '';
        const boundingBox = document.getElementById('inspect-bounding-box');
        if (boundingBox) boundingBox.style.display = '';

        if (screenshotUrl) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const padding = 20;
                canvas.width = img.width + padding * 2;
                canvas.height = img.height + padding * 2;
                const ctx = canvas.getContext('2d');

                // Draw the screenshot
                ctx.drawImage(img, padding, padding);

                if (feedback) {
                    // Draw the annotation pill
                    const pillWidth = Math.min(feedback.length * 10 + 40, 300);
                    const pillHeight = 30;
                    const pillX = x - window.scrollX + padding;
                    const pillY = y - window.scrollY + padding;

                    // Pill background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 15);
                    ctx.fill();

                    // Pill border
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Red dot
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(pillX + 15, pillY + pillHeight / 2, 5, 0, 2 * Math.PI);
                    ctx.fill();

                    // Feedback text
                    ctx.fillStyle = 'black';
                    ctx.font = '16px Arial';
                    ctx.fillText(feedback, pillX + 30, pillY + 20);
                }

                // Convert canvas to image and copy to clipboard
                canvas.toBlob(blob => {
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]);
                    alert('Annotated screenshot copied to clipboard!');
                });
            };
            img.src = screenshotUrl;
        }
    }
});

// Helper function to get formatted CSS
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

// Update toggleInspectMode function
function toggleInspectMode() {
    isInspectMode = !isInspectMode;
    inspectToggleButton.innerText = isInspectMode ? 'Disable Inspect' : 'Enable Inspect';
    document.body.style.cursor = isInspectMode ? 'crosshair' : 'default';

    if (isInspectMode) {
        document.addEventListener('mouseover', handleHover);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('click', handleClick, true);
    } else {
        document.removeEventListener('mouseover', handleHover);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('click', handleClick, true);
        dropdown.style.display = 'none';
        const boundingBox = document.getElementById('inspect-bounding-box');
        if (boundingBox) boundingBox.remove();
    }
}

// Add handleClick function to prevent default link behavior
function handleClick(event) {
    if (isInspectMode) {
        event.preventDefault();
        event.stopPropagation();
    }
}

// Function to close the plugin
function closePlugin() {
    document.body.removeChild(bottomPanel);
    document.body.removeChild(dropdown);
    document.removeEventListener('mouseover', handleHover);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleClick, true);
    const boundingBox = document.getElementById('inspect-bounding-box');
    if (boundingBox) boundingBox.remove();
}

// Apply light mode classes to plugin elements
bottomPanel.classList.add('plugin-ui');
dropdown.classList.add('plugin-ui');
inspectToggleButton.classList.add('plugin-ui');
closePluginButton.classList.add('plugin-ui');

// Add styles for highlight
const highlightStyle = document.createElement('style');
highlightStyle.textContent = `
    .highlight-element {
        outline: 2px solid red !important;
        outline-offset: -2px !important;
    }
`;
document.head.appendChild(highlightStyle);
