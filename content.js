console.log("content.js loaded");


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content received:", msg);

  if (msg.type === "PING") {
    sendResponse({ ready: true });
    return;
  }

  if (msg.action === "extract") {
    extractAnswers();
    sendResponse({ ok: true });
  }

  if (msg.action === "fill") {
    fillAnswers();
    sendResponse({ ok: true });
  }
  
  return true; 
});

function extractAnswers() {
  console.log("Extracting...");
  const answerMap = new Map();

  const headings = document.querySelectorAll('div[role="heading"][aria-level="3"]');

  headings.forEach((heading) => {
    const bold = heading.querySelector("b") || heading.querySelector("span"); // Added span fallback
    if (!bold) return;

    const questionText = bold.textContent.trim();
    const listItem = heading.closest('[role="listitem"]');
    if (!listItem) return;

    const inputContainer = listItem.querySelector('[data-input]'); // ts prob gon be outdated in like a month
    if (!inputContainer) return;

    let answerText = null;

    // Check for selected radio/checkbox
    const checked = inputContainer.querySelector('[aria-checked="true"]');
    if (checked) {
      answerText = checked.getAttribute("data-value") || checked.textContent?.trim();
    }

    // Check for text inputs
    if (!answerText) {
      const textInput = listItem.querySelector('input[type="text"], textarea, input[type="email"]');
      if (textInput && textInput.value) {
        answerText = textInput.value.trim();
      }
    }

    // Check for hidden inputs
    if (!answerText) {
      const hiddenInput = listItem.querySelector('input[type="hidden"][value]');
      if (hiddenInput) {
        answerText = hiddenInput.value.trim();
      }
    }

    if (answerText) {
      answerMap.set(questionText, answerText);
    }
  });

  console.log("Extracted Map:", answerMap);
  chrome.storage.local.set({
    extractedMap: Array.from(answerMap.entries())
  });
  
  alert("Extracted " + answerMap.size + " answers!");
}

function fillAnswers() {
  console.log("Filling...");

  chrome.storage.local.get("extractedMap", ({ extractedMap }) => {
    if (!extractedMap) {
      alert("No data found in storage. Click Extract first.");
      return;
    }

    const answerMap = new Map(extractedMap);
    const headings = document.querySelectorAll('div[role="heading"][aria-level="3"]');

    headings.forEach((heading) => {
      const bold = heading.querySelector("b") || heading.querySelector("span");
      if (!bold) return;

      const questionText = bold.textContent.trim();
      const expectedAnswer = answerMap.get(questionText);
      if (!expectedAnswer) return;

      const listItem = heading.closest('[role="listitem"]');
      if (!listItem) return;

      // 1. Try Clicking Options (Radio/Checkbox)
      const options = listItem.querySelectorAll('[data-value]');
      let foundOption = false;
      options.forEach((option) => {
        const value = option.getAttribute("data-value")?.trim();
        if (value === expectedAnswer) {
          option.click();
          foundOption = true;
        }
      });

      // 2. Try filling text fields
      if (!foundOption) {
        const inputs = listItem.querySelectorAll('input[type="text"], textarea');
        inputs.forEach(input => {
            input.value = expectedAnswer;
            // Dispatch input event so Google Forms "sees" the change
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    });

    console.log("Fill complete");
  });
}