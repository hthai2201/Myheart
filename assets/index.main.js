// =============================================================================
// HEART MESSAGE APPLICATION - MAIN ENTRY POINT
// Enhanced and deobfuscated version for better readability
// This file serves as the main bootstrap for the heart animation application
// =============================================================================

// =============================================================================
// APPLICATION STYLES
// =============================================================================
const appStyles = `
html, body {
  background: #000 !important;
  color-scheme: dark;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  font-family: Arial, sans-serif;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
}

body {
  background: #000;
  background: radial-gradient(circle, #111 0%, #000 100%);
}

canvas {
  display: block;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

@media screen and (max-width: 768px) {
  canvas {
    max-width: 100vw;
    max-height: 100vh;
  }
  * {
    touch-action: manipulation;
  }
}

@supports (-webkit-touch-callout: none) {
  body {
    -webkit-overflow-scrolling: touch;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}

#musicToggle {
  position: fixed;
  top: 16px;
  right: 16px;
  font-size: 22px;
  background: rgba(255, 255, 255, 0);
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: background 0.3s ease;
}

#musicToggle:hover {
  background: rgba(255, 255, 255, 0);
}
`;

// Inject styles into the document
const styleElement = document.createElement("style");
styleElement.type = "text/css";
styleElement.innerHTML = appStyles;
document.head.appendChild(styleElement);

// =============================================================================
// MAIN SCRIPT LOADING
// =============================================================================

// Load the main Three.js heart animation script
const mainScript = document.createElement("script");
mainScript.type = "module";
mainScript.src = "./assets/scripts.js?v=" + new Date().getTime();
document.head.appendChild(mainScript);

// =============================================================================
// SECURITY & ANTI-DEBUGGING FEATURES
// =============================================================================

// Prevent common developer tools shortcuts
document.addEventListener("keydown", function (event) {
  // Block F12 (DevTools)
  if (
    "F12" === event.key ||
    // Block Ctrl+Shift+I/J (Inspect Element/Console)
    (event.ctrlKey &&
      event.shiftKey &&
      ("I" === event.key || "J" === event.key)) ||
    // Block Ctrl+U (View Source)
    (event.ctrlKey && "U" === event.key)
  ) {
    event.preventDefault();
  }
});

// // Prevent right-click context menu
// document.addEventListener("contextmenu", function (event) {
//   event.preventDefault();
// });

// =============================================================================
// DEVELOPER TOOLS DETECTION
// =============================================================================

// let isDevToolsOpen = false;

// setInterval(() => {
//   const startTime = new Date().getTime();
//   eval("debugger;"); // This will pause if DevTools is open
//   const endTime = new Date().getTime();
//   const isDebuggerActive = endTime - startTime > 100;

//   // Show warning when DevTools is detected
//   if (isDebuggerActive && !isDevToolsOpen) {
//     isDevToolsOpen = true;
//     document.body.innerHTML = `
//       <h1 style="color:red; font-size: 28px; text-align: center; margin-top: 100px;"> 🚨 Đang mở DevTools!</h1>
//       <h1 style="color:red; font-size: 24px; text-align: center;">Nhấn F12 để đóng.</h1>
//     `;
//   }

//   // Reload page when DevTools is closed
//   if (!isDebuggerActive && isDevToolsOpen) {
//     location.reload();
//   }
// }, 1000);

// =============================================================================
// DOMAIN VALIDATION
// =============================================================================

// const authorizedDomain = "panbap.github.io";
// const currentDomain = window.location.hostname;

// // Check if running on authorized domain
// if (currentDomain !== authorizedDomain) {
//   // Clear page content if on unauthorized domain
//   document.body.innerHTML = "";

//   // Note: The original code references undefined variables 'texts', 'divs', etc.
//   // This appears to be additional obfuscation/error handling that would cause errors
//   // Keeping the domain check but removing the problematic undefined variable references
// }

// =============================================================================
// APPLICATION DATA PLACEHOLDER
// =============================================================================

// Note: The original code had some mathematical calculations with undefined variables
// These appear to be dummy calculations or additional obfuscation
// Removing them as they serve no functional purpose and would cause errors

console.log("Heart Message Application - Main entry point loaded successfully");
