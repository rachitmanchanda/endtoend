// Inject Tailwind CSS into the page
const tailwindLink = document.createElement('link');
tailwindLink.rel = 'stylesheet';
tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
document.head.appendChild(tailwindLink);

// Mode state
let isInspectMode = false;
let selectedElement = null;

// Create a bottom floating panel for controls
const bottomPanel = document.createElement('div');
bottomPanel.classList.add('fixed', 'bottom-0', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-white', 'text-black', 'shadow-lg', 'p-3', 'rounded-full', 'flex', 'justify-center', 'items-center', 'space-x-4');
bottomPanel.style.zIndex = '10000';
document.body.appendChild(bottomPanel);

// Toggle Inspect Mode Button
const inspectToggleButton = document.createElement('button');
inspectToggleButton.innerText = 'Enable Inspect Mode';
inspectToggleButton.classList.add('text-white', 'bg-blue-600', 'rounded', 'px-4', 'py-2', 'hover:bg-blue-700', 'focus:outline-none');
inspectToggleButton.onclick = toggleInspectMode;
bottomPanel.appendChild(inspectToggleButton);

// Create a close button for the plugin
const closePluginButton = document.createElement('button');
closePluginButton.innerText = 'Close Plugin';
closePluginButton.classList.add('text-white', 'bg-red-600', 'rounded', 'px-4', 'py-2', 'hover:bg-red-700', 'focus:outline-none');
closePluginButton.onclick = closePlugin;
bottomPanel.appendChild(closePluginButton);

// Create a flyout menu element
const flyoutMenu = document.createElement('div');
flyoutMenu.classList.add('fixed', 'bg-white', 'text-black', 'shadow-lg', 'p-4', 'rounded-lg', 'flex', 'flex-col', 'space-y-3');
flyoutMenu.style.display = 'none';
flyoutMenu.style.zIndex = '10001';
document.body.appendChild(flyoutMenu);

// Add a close button to the flyout menu
const flyoutCloseButton = document.createElement('button');
flyoutCloseButton.innerText = 'Close';
flyoutCloseButton.classList.add('self-end', 'bg-gray-300', 'text-black', 'rounded', 'px-4', 'py-2', 'hover:bg-gray-400', 'focus:outline-none');
flyoutCloseButton.onclick = () => {
    flyoutMenu.style.display = 'none'; // Hide the flyout menu
    boundingBox.style.display = 'none'; // Hide the bounding box
    selectedElement = null; // Clear the selected element
};
flyoutMenu.appendChild(flyoutCloseButton);

// Add a container for CSS properties
const cssPropertiesContainer = document.createElement('div');
cssPropertiesContainer.classList.add('flex', 'flex-col', 'space-y-2');
flyoutMenu.appendChild(cssPropertiesContainer);

// Highlight bounding box for hovered elements
const boundingBox = document.createElement('div');
boundingBox.style.position = 'absolute';
boundingBox.style.border = '2px solid red';
boundingBox.style.pointerEvents = 'none'; // Allow interactions to pass through
boundingBox.style.zIndex = '9998';
boundingBox.style.display = 'none';
document.body.appendChild(boundingBox);

// Listen for hover events to update the bounding box
document.addEventListener('mousemove', function(event) {
    if (!isInspectMode) return;

    const isMouseOverFlyoutMenu = flyoutMenu.contains(event.target) || bottomPanel.contains(event.target);
    if (!selectedElement && isInspectMode && !isMouseOverFlyoutMenu) {
        const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
        if (hoveredElement && !flyoutMenu.contains(hoveredElement) && !bottomPanel.contains(hoveredElement)) {
            const rect = hoveredElement.getBoundingClientRect();

            // Update bounding box position and size
            boundingBox.style.left = `${rect.left + window.scrollX}px`;
            boundingBox.style.top = `${rect.top + window.scrollY}px`;
            boundingBox.style.width = `${rect.width}px`;
            boundingBox.style.height = `${rect.height}px`;
            boundingBox.style.display = 'block';
        } else {
            boundingBox.style.display = 'none';
        }
    }
});

// Function to toggle inspect mode
function toggleInspectMode() {
    isInspectMode = !isInspectMode;
    inspectToggleButton.innerText = isInspectMode ? 'Disable Inspect Mode' : 'Enable Inspect Mode';

    if (isInspectMode) {
        document.addEventListener('click', handleElementSelection, true);
    } else {
        document.removeEventListener('click', handleElementSelection, true);
        boundingBox.style.display = 'none';
        flyoutMenu.style.display = 'none';
    }
}

// Function to handle element selection
function handleElementSelection(event) {
    if (!isInspectMode) return;

    event.preventDefault();
    event.stopPropagation();

    if (flyoutMenu.contains(event.target) || bottomPanel.contains(event.target)) return; // Prevent interaction with plugin buttons

    selectedElement = event.target;

    const rect = selectedElement.getBoundingClientRect();

    // Positioning the flyout menu to prevent clipping
    let flyoutLeft = rect.left + window.scrollX + rect.width / 2 - flyoutMenu.offsetWidth / 2;
    let flyoutTop = rect.top + window.scrollY - flyoutMenu.offsetHeight;

    if (flyoutLeft < 0) flyoutLeft = 10;
    if (flyoutLeft + flyoutMenu.offsetWidth > window.innerWidth) flyoutLeft = window.innerWidth - flyoutMenu.offsetWidth - 10;
    if (flyoutTop < 0) flyoutTop = rect.bottom + window.scrollY + 10;

    flyoutMenu.style.left = `${flyoutLeft}px`;
    flyoutMenu.style.top = `${flyoutTop}px`;
    flyoutMenu.style.display = 'block';

    const elementName = selectedElement.tagName.toLowerCase() + (selectedElement.className ? '.' + selectedElement.className.split(' ').join('.') : '');
    const elementNameDisplay = document.createElement('div');
    elementNameDisplay.innerText = elementName;
    elementNameDisplay.classList.add('text-lg', 'font-semibold', 'mb-2');
    cssPropertiesContainer.innerHTML = ''; // Clear previous content
    cssPropertiesContainer.appendChild(elementNameDisplay);

    const computedStyles = window.getComputedStyle(selectedElement);
    const cssCodeElement = document.createElement('div');
    cssCodeElement.classList.add('text-sm', 'bg-gray-100', 'p-2', 'rounded-lg', 'overflow-auto', 'whitespace-pre-wrap');
    cssCodeElement.innerText = `element {
  width: ${computedStyles.width};
  height: ${computedStyles.height};
  color: ${computedStyles.color};
  font-size: ${computedStyles.fontSize};
  margin: ${computedStyles.margin};
  padding: ${computedStyles.padding};
  background-color: ${computedStyles.backgroundColor};
  border: ${computedStyles.border};
}`;
    cssPropertiesContainer.appendChild(cssCodeElement);

    const feedbackBox = document.createElement('textarea');
    feedbackBox.placeholder = 'Write feedback...';
    feedbackBox.classList.add('w-full', 'border', 'px-2', 'py-1', 'rounded', 'focus:outline-none', 'mt-2');
    cssPropertiesContainer.appendChild(feedbackBox);
}

// Function to close the plugin and remove all elements
function closePlugin() {
    document.body.removeChild(flyoutMenu);
    document.body.removeChild(boundingBox);
    document.body.removeChild(bottomPanel);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleElementSelection, true);
}
