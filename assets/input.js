// =============================================================================
// HEART MESSAGE APPLICATION - INPUT HANDLER
// Enhanced and deobfuscated version for better readability
// =============================================================================

(function initializeHeartMessageApp() {
  // Security check - only run if properly loaded from inline.js
  if ("hi" !== hihi) return;

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

  //   // Prevent right-click context menu
  //   document.addEventListener("contextmenu", function (event) {
  //     event.preventDefault();
  //   });

  // =============================================================================
  // LINK CREATION FUNCTIONALITY
  // =============================================================================

  document.getElementById("createLink").addEventListener("click", function () {
    const messageInputs = messagesContainer.querySelectorAll("input");
    const messages = [];
    let hasEmptyMessage = false;

    // Collect all messages and check for empty ones
    messageInputs.forEach((input) => {
      const messageText = input.value.trim();
      if ("" === messageText) {
        hasEmptyMessage = true;
      } else {
        messages.push(messageText);
      }
    });

    // Get images from textarea
    const imagesText = document.getElementById("images").value.trim();
    let imageUrls = imagesText
      ? imagesText
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url.length > 0)
      : [];

    // Validate image count
    if (imageUrls.length > 4) {
      warning.textContent = "Chỉ được nhập tối đa 4 ảnh (mỗi dòng 1 link).";
      warning.style.display = "block";
      return;
    }

    // Get heart color and music
    const heartColor =
      document.getElementById("heartColor").value.trim() || "#ff9090";
    const musicSelection = document.getElementById("music").value.trim();

    // Validate messages
    if (hasEmptyMessage) {
      warning.textContent = "Không được để trống ô thông điệp nào.";
      warning.style.display = "block";
      return;
    }

    // Hide warning
    warning.style.display = "none";

    // Create data object
    const linkData = {
      messages: messages,
      images: imageUrls,
      heartColor: heartColor,
      music: musicSelection,
    };

    // Encode data to base64
    const jsonString = JSON.stringify(linkData);
    const encodedData = btoa(unescape(encodeURIComponent(jsonString)));

    // Generate final URL
    const generatedUrl =
      "" +
      location.origin +
      location.pathname.replace(/[^\/]*$/, "") +
      "index.html?data=" +
      encodedData;

    // Display result
    document.getElementById("resultLink").value = generatedUrl;
    document.getElementById("resultContainer").style.display = "flex";
  });

  // =============================================================================
  // COPY FUNCTIONALITY
  // =============================================================================

  document.getElementById("copyButton").addEventListener("click", function () {
    const resultUrl = document.getElementById("resultLink").value;

    navigator.clipboard.writeText(resultUrl).then(() => {
      const copyButton = document.getElementById("copyButton");
      copyButton.textContent = "Đã copy!";

      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1500);
    });
  });

  // =============================================================================
  // COLOR PICKER FUNCTIONALITY
  // =============================================================================

  document.getElementById("heartColor").addEventListener("input", function () {
    document.getElementById("colorValue").textContent = this.value;
  });

  // =============================================================================
  // DOMAIN VALIDATION
  // =============================================================================

  //   // Check if running on authorized domain
  //   if ("panbap.github.io" !== window.location.hostname) {
  //     // Clear page content if on unauthorized domain
  //     document.body.innerHTML = "";
  //     // Note: The original code references undefined variables 'texts', 'divs', etc.
  //     // This appears to be additional obfuscation/error handling
  //   }
})();

// =============================================================================
// SECURITY TOKEN
// =============================================================================
// This variable is used as a security check by inline.js
// It must be set to "hi" for the application to function properly
hihi = "hi";
