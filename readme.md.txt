# QR Code Scanner (CHROME EXTENSION)

A responsive, and 💜PURPLE💜 Chrome Extension that identifies multiple QR codes on your screen simultaneously and overlays an interactive **Heads-Up Display (HUD)** for quick access.

Chrome Extension Link: https://chromewebstore.google.com/detail/qr-scanner-by-lau/pfpekalpjjfelplgmoamhmkmdkpaejgg

![Screenshot of the extension in action](demo.png)

## 🚀 Features

- **Multi-Code Detection:** Scans the entire visible tab and finds every QR code at once.
- **AR Overlay:** Draws a purple sci-fi HUD directly over the webpage with glowing crosshairs.
- **Responsive Scanning:** Uses a "Multi-Pass" system to detect codes on both small laptop screens and massive 4K monitors.
- **Smart Positioning:** UI panels automatically flip (Top/Bottom/Left/Right) so they never bleed off the edge of your screen.
- **Privacy First:** Reveals the raw URL hidden in the QR code before you click it, protecting you from unwanted redirects.
- **One-Click Actions:** Open links in a new tab or copy the raw data to your clipboard.

## 🛠️ Built With

- **JavaScript (ES6+)**
- **Chrome Extension API (Manifest V3)**
- **jsQR Library:** For universal, high-performance decoding.
- **Native BarcodeDetector API:** For hardware-accelerated scanning on supported systems.

## 📦 How to Install Locally (Developer Mode)

If you want to run this code directly from this repository:

1. **Download** or clone this repository to your computer.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** using the toggle in the top right corner.
4. Click the **"Load unpacked"** button.
5. Select the folder containing these files.
6. The **Purple QR Icon** will appear in your extensions menu!

## 📄 Privacy & Permissions

This extension is built with privacy in mind:
- `activeTab`: Used only to "see" the current page when you click scan.
- `scripting`: Used to draw the HUD on the page.
- **No Data Collection:** This extension does not track your history or send data to any external servers. All scanning happens locally on your machine.

---
*Vibe coded by Lau*