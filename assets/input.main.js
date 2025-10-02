// =============================================================================
// SECURITY TOKEN
// =============================================================================
// This variable is used as a security check by the application
// It must be set to "hi" for the application to function properly
var hihi = "hi";

// =============================================================================
// APPLICATION STYLES - Inline CSS for the heart message application
// =============================================================================
const applicationStyles = `
    body,
    html {
      overflow-x: hidden;
      font-family: "Mali", cursive;
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff0f4;
      border-radius: 10px;
      color: #333;
    }

    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(214, 51, 108, 0.1);
      border: 1px solid #ffc2d1;
    }

    h1 {
      text-align: center;
      color: #ff6e75;
      margin-top: 0;
    }

    label {
      display: block;
      margin: 15px 0 5px;
      font-weight: bold;
      color: #555;
    }

    textarea,
    input,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 15px;
      transition: border 0.3s, box-shadow 0.3s;
    }

    textarea:focus,
    input:focus,
    select:focus {
      border-color: #d6336c;
      box-shadow: 0 0 5px rgba(214, 51, 108, 0.2);
      outline: none;
    }

    #music {
      display: block;
      margin: 10px auto 0;
      width: 60%;
      background-color: #fff;
      border: 1px solid #ddd;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 15px;
      font-family: "Mali", cursive;
      font-weight: 600;
      color: #ff6262;
      appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg fill='%237a003c' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 20px;
      cursor: pointer;
      transition: border-color 0.3s, box-shadow 0.3s;
      text-align: center;
      text-align-last: center;
    }

    #music:focus {
      border-color: #d6336c;
      box-shadow: 0 0 5px rgba(255, 127, 127, 0.2);
      outline: none;
      font-weight: 600;
    }

    button {
      padding: 12px 25px;
      font-size: 16px;
      background-color: #ff6e75;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s;
      font-family: "Mali", cursive;
    }

    button:hover {
      background-color: #ff9196;
    }

    #messagesContainer {
      margin: 10px auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      padding: 10px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    #messagesContainer div {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #messagesContainer input[type="text"] {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-family: "Mali", cursive;
      font-size: 14px;
      transition: border-color 0.2s;
      font-weight: 600;
    }

    #messagesContainer input[type="text"]:focus {
      border-color: #ff6e75;
      outline: none;
    }

    #messagesContainer button {
      background: #ff6e75;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      transition: background 0.2s;
    }

    #messagesContainer button:hover {
      background: #ff4b5c;
    }

    .add-btn-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 12px;
    }

    #addMessage {
      background: #ff6e75;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 12px 18px;
      cursor: pointer;
      font-size: 14px;
      font-family: "Mali", cursive;
      font-weight: 600;
      transition: background 0.2s, transform 0.2s;
    }

    #addMessage:hover {
      background: #f3868b;
      transform: scale(1.05);
    }

    #createLink {
      background: #ff6e75;
      border: none;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: bold;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 95, 141, 0.3);
      display: block;
      margin: 30px auto 0;
    }

    #createLink:hover {
      background: #ff9196;
      transform: scale(1.02);
      box-shadow: 0 6px 20px rgba(255, 95, 141, 0.4);
    }

    #colorPickerContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background-color: #fff;
      box-sizing: border-box;
      height: 44px;
      width: 40%;
      margin: 10px auto 0;
    }

    #colorPickerContainer input[type="color"] {
      appearance: none;
      width: 32px;
      height: 32px;
      border: none;
      padding: 0;
      background: none;
      cursor: pointer;
    }

    #colorPickerContainer input[type="color"]::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    #colorPickerContainer input[type="color"]::-webkit-color-swatch {
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    #colorValue {
      font-family: monospace;
      color: #ff6e75;
      font-size: 14px;
    }

    #resultContainer {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      border-radius: 6px;
      margin-top: 25px;
      gap: 10px;
    }

    #copyButton {
      background-color: #ff6e75;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      flex-shrink: 0;
      height: 40px;
      transition: background-color 0.3s;
      font-family: "Mali", cursive;
    }

    #copyButton:hover {
      background-color: #ff9196;
    }

    #resultLink {
      flex-grow: 1;
      font-size: 15px;
      color: #ff6e75;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px 12px;
      height: 40px;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background-color: #fff;
    }

    @media (max-width: 640px) {
      body {
        margin: 20px;
      }
    }
`;

// DevTools detection warning message
const devToolsWarningHTML = `
    <h1 style="color:red; font-size: 28px; text-align: center; margin-top: 100px;"> 🚨 Đang mở DevTools!</h1>
    <h1 style="color:red; font-size: 24px; text-align: center;">Nhấn F12 để đóng.</h1>
`;

// =============================================================================
// LOADING ANIMATION
// =============================================================================
const loadingTextElement = document.getElementById("loading-text");
// Animated loading dots
let dotCount = 0;
const loadingInterval = setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingTextElement.textContent = "Loading" + ".".repeat(dotCount);
}, 250);

// Hide loading screen when page is loaded
window.addEventListener("load", () => {
  setTimeout(() => {
    clearInterval(loadingInterval);
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
    // document.getElementById("main-content").style.display = "block";
  }, 300);
});

// Apply styles to the page
const styleElement = document.createElement("style");
styleElement.innerHTML = applicationStyles;
document.head.appendChild(styleElement);
// =============================================================================
// IMAGE PREVIEW FUNCTIONALITY
// =============================================================================
const imagesTextarea = document.getElementById("images");
const imagePreviewContainer = document.getElementById("imagePreview");

function renderImagePreview() {
  // Get valid image URLs from textarea
  const imageUrls = imagesTextarea.value
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  // Clear existing previews
  imagePreviewContainer.innerHTML = "";

  // Create preview for each image
  imageUrls.forEach((imageUrl) => {
    const imageContainer = document.createElement("div");
    imageContainer.style.position = "relative";
    imageContainer.style.display = "inline-block";

    // Create image element
    const imageElement = document.createElement("img");
    imageElement.src = imageUrl;
    imageElement.alt = "Image preview";
    imageElement.style.width = "120px";
    imageElement.style.height = "120px";
    imageElement.style.borderRadius = "6px";
    imageElement.style.objectFit = "cover";

    // Remove broken images
    imageElement.onerror = () => {
      imageContainer.remove();
    };

    // Create remove button
    const removeButton = document.createElement("button");
    removeButton.textContent = "✕";
    removeButton.style.position = "absolute";
    removeButton.style.top = "4px";
    removeButton.style.right = "4px";
    removeButton.style.background = "#ff6e75";
    removeButton.style.color = "white";
    removeButton.style.border = "none";
    removeButton.style.borderRadius = "50%";
    removeButton.style.width = "20px";
    removeButton.style.height = "20px";
    removeButton.style.cursor = "pointer";
    removeButton.style.fontSize = "12px";
    removeButton.style.lineHeight = "18px";
    removeButton.style.padding = "0";

    // Remove image when button is clicked
    removeButton.addEventListener("click", () => {
      const updatedUrls = imagesTextarea.value
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .filter((url) => url !== imageUrl);
      imagesTextarea.value = updatedUrls.join("\n");
      renderImagePreview();
    });

    imageContainer.appendChild(imageElement);
    imageContainer.appendChild(removeButton);
    imagePreviewContainer.appendChild(imageContainer);
  });
}

// Update preview when textarea content changes
imagesTextarea.addEventListener("input", renderImagePreview);
renderImagePreview();
// =============================================================================
// MESSAGE INPUT MANAGEMENT
// =============================================================================
const messagesContainer = document.getElementById("messagesContainer");
const addMessageButton = document.getElementById("addMessage");
const warningElement = document.getElementById("warning");

function createMessageInput(initialValue = "") {
  const messageDiv = document.createElement("div");
  messageDiv.style.display = "flex";
  messageDiv.style.alignItems = "center";
  messageDiv.style.marginBottom = "8px";

  // Create input field
  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.value = initialValue;
  inputField.placeholder = "Nhập lời nhắn...";
  inputField.style.flex = "1";
  inputField.style.padding = "8px 10px";
  inputField.style.border = "1px solid #ddd";
  inputField.style.borderRadius = "6px";
  inputField.style.fontFamily = "Mali, cursive";

  // Create remove button
  const removeButton = document.createElement("button");
  removeButton.textContent = "✕";
  removeButton.style.marginLeft = "8px";
  removeButton.style.background = "#ff6e75";
  removeButton.style.color = "white";
  removeButton.style.border = "none";
  removeButton.style.borderRadius = "6px";
  removeButton.style.cursor = "pointer";
  removeButton.style.padding = "6px 10px";
  removeButton.style.height = "36px";

  // Handle remove button click
  removeButton.addEventListener("click", () => {
    if (messagesContainer.querySelectorAll("input").length > 1) {
      messageDiv.remove();
      warningElement.style.display = "none";
    } else {
      warningElement.textContent = "Phải có ít nhất 1 thông điệp.";
      warningElement.style.display = "block";
    }
  });

  messageDiv.appendChild(inputField);
  messageDiv.appendChild(removeButton);
  messagesContainer.appendChild(messageDiv);
}

function getAllMessages() {
  return [...messagesContainer.querySelectorAll("input")]
    .map((input) => input.value.trim())
    .filter((message) => message.length > 0);
}

// Create initial message input
createMessageInput();

// Handle add message button click
addMessageButton.addEventListener("click", () => {
  if (messagesContainer.querySelectorAll("input").length < 4) {
    createMessageInput();
    warningElement.style.display = "none";
  } else {
    warningElement.textContent = "Chỉ được nhập tối đa 4 thông điệp.";
    warningElement.style.display = "block";
  }
});
// =============================================================================
// EXTERNAL SCRIPT LOADING
// =============================================================================
// Load additional functionality from external script
fetch("./assets/input.js?v=" + Date.now())
  .then((response) => response.text())
  .then((scriptCode) => {
    eval(scriptCode);
  });

// =============================================================================
// DEVELOPER TOOLS DETECTION (Anti-debugging)
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
//     document.body.innerHTML = devToolsWarningHTML;
//   }

//   // Reload page when DevTools is closed
//   if (!isDebuggerActive && isDevToolsOpen) {
//     location.reload();
//   }
// }, 1000);
