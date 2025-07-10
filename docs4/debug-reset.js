// Debug script to reset state and fix judge issues
// Execute this in the browser console

// Clear localStorage and reset state
localStorage.removeItem('debateAppState');

// Reload the page to reinitialize with fresh state
window.location.reload();

// Alternative: If you want to reset programmatically without reload
/*
import { resetState } from './js/common/state.js';
resetState();
*/

console.log('State has been reset. The page will reload to apply changes.'); 