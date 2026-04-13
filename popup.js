document.getElementById('scanBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.style.display = 'block';
  status.innerText = "Scanning screen...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    // Inject jsQR for the universal fallback
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['jsQR.js']
    });

    // Inject the HUD-style overlay UI
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: buildActionHUDOverlay,
      args: [dataUrl]
    });

    window.close(); 
  } catch (err) {
    status.innerText = "Error: " + err.message;
  }
});

// --- EVERYTHING BELOW THIS LINE RUNS DIRECTLY INSIDE THE WEBPAGE --- //
function buildActionHUDOverlay(screenshotUrl) {
  const existingOverlay = document.getElementById('qr-scanner-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'qr-scanner-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: '9999999', fontFamily: 'monospace'
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close QR Code Scanner by Lau';
  Object.assign(closeBtn.style, {
    position: 'absolute', top: '20px', right: '20px', padding: '10px 15px',
    backgroundColor: '#ff4444', color: 'white', border: 'none', 
    borderRadius: '2px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold'
  });
  closeBtn.onclick = () => overlay.remove();
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  const img = new Image();
  img.onload = async () => {
    let foundCodes = [];

    // --- ATTEMPT 1: Native BarcodeDetector ---
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        foundCodes = barcodes.map(b => ({
          rawValue: b.rawValue,
          boundingBox: b.boundingBox
        }));
      } catch (e) {
        console.warn("Native scanner failed. Switching to jsQR Fallback.");
      }
    }

    // --- ATTEMPT 2: jsQR Fallback (MULTI-PASS) ---
    if (foundCodes.length === 0 && typeof jsQR !== 'undefined') {
      const scalesToTry = [1, 2, 0.5]; 

      for (let scale of scalesToTry) {
        if (foundCodes.length > 0) break; 

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        if (canvas.width > 6000 || canvas.height > 6000) continue; 

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let searching = true;
        let loopSafety = 0; 
        
        while (searching && loopSafety < 15) {
          loopSafety++;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            const xMin = Math.min(code.location.topLeftCorner.x, code.location.bottomLeftCorner.x);
            const yMin = Math.min(code.location.topLeftCorner.y, code.location.bottomLeftCorner.y);
            const xMax = Math.max(code.location.topRightCorner.x, code.location.bottomRightCorner.x);
            const yMax = Math.max(code.location.bottomLeftCorner.y, code.location.bottomRightCorner.y);

            foundCodes.push({
              rawValue: code.data,
              boundingBox: {
                x: xMin / scale, y: yMin / scale,
                width: (xMax - xMin) / scale, height: (yMax - yMin) / scale
              }
            });

            ctx.fillStyle = 'black';
            ctx.fillRect(xMin - 15, yMin - 15, (xMax - xMin) + 30, (yMax - yMin) + 30);
          } else {
            searching = false; 
          }
        }
      }
    }

    // --- UI RENDERING ---
    const statusText = document.createElement('div');
    Object.assign(statusText.style, {
      position: 'absolute', top: '20px', left: '20px', color: '#a200ff', 
      fontSize: '16px', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.8)', 
      padding: '10px 15px', borderRadius: '8px'
    });
    
    if (foundCodes.length === 0) {
      statusText.innerText = "No QR Codes found on screen; sorry :<";
      statusText.style.top = '50%'; statusText.style.left = '50%';
      statusText.style.transform = 'translate(-50%, -50%)';
      overlay.appendChild(statusText);
      return;
    } else {
      statusText.innerText = `Found ${foundCodes.length} QR Code(s) ^-^`;
      overlay.appendChild(statusText);
    }

    const scaleX = window.innerWidth / img.width;
    const scaleY = window.innerHeight / img.height;

    foundCodes.forEach((barcode, index) => {
      const boxLeft = barcode.boundingBox.x * scaleX;
      const boxTop = barcode.boundingBox.y * scaleY;
      const boxWidth = barcode.boundingBox.width * scaleX;
      const boxHeight = barcode.boundingBox.height * scaleY;

      // 1. The HUD-style bounding box
      const boundingBox = document.createElement('div');
      Object.assign(boundingBox.style, {
        position: 'absolute', left: `${boxLeft}px`, top: `${boxTop}px`,
        width: `${boxWidth}px`, height: `${boxHeight}px`,
        border: '3px solid #a200ff', boxShadow: '0 0 15px rgba(162, 0, 255, 0.5)',
        borderRadius: '2px', pointerEvents: 'none'
      });
      boundingBox.innerHTML = `
        <div style="position:absolute; top:-4px; left:-4px; width:15px; height:15px; border-top:3px solid #a200ff; border-left:3px solid #a200ff;"></div>
        <div style="position:absolute; top:-4px; right:-4px; width:15px; height:15px; border-top:3px solid #a200ff; border-right:3px solid #a200ff;"></div>
        <div style="position:absolute; bottom:-4px; left:-4px; width:15px; height:15px; border-bottom:3px solid #a200ff; border-left:3px solid #a200ff;"></div>
        <div style="position:absolute; bottom:-4px; right:-4px; width:15px; height:15px; border-bottom:3px solid #a200ff; border-right:3px solid #a200ff;"></div>
      `;
      overlay.appendChild(boundingBox);

      // --- 2. BOTTOM-DEFAULT POSITIONING MATH ---
      const panelWidth = 220;
      const estimatedPanelHeight = 110; 
      
      // Default: Align with the left edge of the QR code, place 15px BELOW it
      let panelLeft = boxLeft; 
      let panelTop = boxTop + boxHeight + 15; 

      // Screen-Aware Failsafe 1: If it bleeds off the right side of the screen
      if (panelLeft + panelWidth > window.innerWidth) {
        panelLeft = window.innerWidth - panelWidth - 15; 
      }
      
      // Screen-Aware Failsafe 2: If the QR code is at the bottom and the panel bleeds off the bottom edge
      if (panelTop + estimatedPanelHeight > window.innerHeight) {
        panelTop = boxTop - estimatedPanelHeight - 15; // Flip it to sit ABOVE the QR code
      }

      // The Action Panel
      const actionPanel = document.createElement('div');
      Object.assign(actionPanel.style, {
        position: 'absolute', left: `${panelLeft}px`, top: `${panelTop}px`, 
        backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #a200ff',
        color: '#fff', padding: '12px', width: `${panelWidth}px`, boxSizing: 'border-box',
        boxShadow: '0 5px 15px rgba(0,0,0,0.5), 0 0 10px rgba(162, 0, 255, 0.2)',
        pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
      });

      // Action Panel HTML
      actionPanel.innerHTML = `
        <div title="${barcode.rawValue}" style="color: #a200ff; font-weight: bold; font-size: 12px; border-bottom: 1px solid #a200ff; padding-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${barcode.rawValue}
        </div>
        <a href="${barcode.rawValue}" target="_blank" style="background:#a200ff; color:#fff; text-decoration:none; padding:8px; text-align:center; font-weight:bold; font-size:12px; border-radius: 2px;">
          OPEN LINK
        </a>
        <button id="copyBtn-${index}" style="background:transparent; border:1px solid #a200ff; color:#a200ff; padding:6px; cursor:pointer; font-family:monospace; font-weight:bold; border-radius: 2px;">
          [COPY LINK]
        </button>
      `;
      overlay.appendChild(actionPanel);

      // Add functionality to the Copy Button
      document.getElementById(`copyBtn-${index}`).addEventListener('click', (e) => {
        navigator.clipboard.writeText(barcode.rawValue);
        e.target.innerText = "[COPIED!]";
        e.target.style.backgroundColor = "#a200ff";
        e.target.style.color = "#fff";
        setTimeout(() => {
          e.target.innerText = "[COPY LINK]";
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#a200ff";
        }, 2000);
      });
    });
  };
  
  img.src = screenshotUrl;
}