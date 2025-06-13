// Debug script for Add Button
console.log('=== DEBUG ADD BUTTON ===');

function debugAddButton() {
    console.log('--- Checking Add Button State ---');
    
    // Check if timer footer exists
    const timerFooter = document.querySelector('.timer-footer');
    console.log('Timer Footer:', timerFooter);
    if (timerFooter) {
        console.log('Timer Footer styles:', {
            display: getComputedStyle(timerFooter).display,
            transform: getComputedStyle(timerFooter).transform,
            opacity: getComputedStyle(timerFooter).opacity,
            pointerEvents: getComputedStyle(timerFooter).pointerEvents,
            visibility: getComputedStyle(timerFooter).visibility
        });
    }
    
    // Check if add button exists
    const addButton = document.querySelector('.add-timer-compact');
    console.log('Add Button:', addButton);
    if (addButton) {
        console.log('Add Button styles:', {
            display: getComputedStyle(addButton).display,
            cursor: getComputedStyle(addButton).cursor,
            pointerEvents: getComputedStyle(addButton).pointerEvents,
            background: getComputedStyle(addButton).background,
            visibility: getComputedStyle(addButton).visibility
        });
        console.log('Add Button attributes:', {
            'data-initialized': addButton.getAttribute('data-initialized'),
            title: addButton.getAttribute('title'),
            className: addButton.className
        });
    }
    
    // Check sliders
    const minutesSlider = document.querySelector('.minutes-slider');
    const secondsSlider = document.querySelector('.seconds-slider');
    console.log('Minutes Slider:', minutesSlider);
    console.log('Seconds Slider:', secondsSlider);
    
    // Check toggle button
    const toggleButton = document.querySelector('.toggle-add-section');
    console.log('Toggle Button:', toggleButton);
    if (toggleButton) {
        console.log('Toggle Button classes:', toggleButton.className);
    }
    
    // Test add button click manually
    if (addButton) {
        console.log('Testing manual click...');
        addButton.addEventListener('click', function() {
            console.log('MANUAL CLICK DETECTED!');
        });
    }
}

// Run debug immediately
debugAddButton();

// Run debug when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugAddButton);
} else {
    setTimeout(debugAddButton, 1000);
}

// Add to window for manual testing
window.debugAddButton = debugAddButton;

console.log('Debug script loaded. Run debugAddButton() in console to check state.'); 