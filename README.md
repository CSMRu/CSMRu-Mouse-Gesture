# CSMRu Mouse Gesture

![Icon](icons/icon128.png)

![Version](https://img.shields.io/badge/version-v0.3-blue.svg)

A lightweight, customizable mouse gesture extension for Google Chrome. Navigate the web faster and more efficiently with simple mouse movements.

## ✨ Features

*   **⚡ Intuitive Mouse Gestures**: Perform common browser actions (Back, Forward, New Tab, Reload, etc.) by drawing simple shapes on the screen.
*   **🎨 Visual Customization**:
    *   **Trace Color**: Choose any color for the gesture trail.
    *   **Trace Thickness**: Adjust the line width to your preference.
    *   **Font Size**: Customize the size of the gesture preview text.
    *   **Theme Support**: Fully responsive Light and Dark modes (Dark mode uses **Orange** accent).
*   **🛠️ Complete Configuration**:
    *   **Add/Remove Gestures**: Record your own custom gestures and assign actions to them.
    *   **Action Mapping**: Map specific gestures to a wide range of browser commands.
    *   **Gesture Preview**: See the visual representation (e.g., <img src="icons/arrow-right.svg" width="16" style="vertical-align: middle;" />) and action in real-time.
*   **🚀 Performance Optimized**:
    *   **Zero-Overhead Idle**: Uses no resources when not gesturing.
    *   **Smooth Rendering**: Utilizes `requestAnimationFrame` and Canvas API for fluid, lag-free trails.
*   **🔒 Privacy Focused**: Runs entirely locally. No data is collected or sent to external servers.

## 📦 Installation

Since this extension is not yet in the Chrome Web Store, you can install it manually:

1.  **Clone or Download** this repository.
    ```bash
    git clone https://github.com/CSMRu/CSMRu-Mouse-Gesture.git
    ```
2.  Open Google Chrome and go to `chrome://extensions/`.
3.  Enable **"Developer mode"** at the top right toggle.
4.  Click **"Load unpacked"** at the top left.
5.  Select the folder where you cloned/downloaded this repository.
6.  The extension should now be installed and active!

## 🖱️ Default Gestures

You can customize these in the Options page, but here are the defaults:

| Gesture | Movement | Action |
| :--- | :--- | :--- |
| <img src="icons/arrow-left.svg" width="20" style="vertical-align: middle;" /> | Left | Go Back |
| <img src="icons/arrow-right.svg" width="20" style="vertical-align: middle;" /> | Right | Go Forward |
| <img src="icons/arrow-left.svg" width="20" style="vertical-align: middle;" /><img src="icons/arrow-right.svg" width="20" style="vertical-align: middle;" /> | Left → Right | Reload Page |
| <img src="icons/arrow-right.svg" width="20" style="vertical-align: middle;" /><img src="icons/arrow-left.svg" width="20" style="vertical-align: middle;" /> | Right → Left | Reload (Bypass Cache) |
| <img src="icons/arrow-left.svg" width="20" style="vertical-align: middle;" /><img src="icons/arrow-up.svg" width="20" style="vertical-align: middle;" /><img src="icons/arrow-right.svg" width="20" style="vertical-align: middle;" /><img src="icons/arrow-down.svg" width="20" style="vertical-align: middle;" /><img src="icons/arrow-left.svg" width="20" style="vertical-align: middle;" /> | L → U → R → D → L | Reopen Closed Tab |

## ⚙️ Usage

1.  **Hold Right Mouse Button**: Anywhere on a webpage, press and hold the right mouse button.
2.  **Draw a Shape**: Move your mouse to draw a gesture (e.g., drag left for "Back").
3.  **Release**: Release the right mouse button to execute the action.
    *   *Tip: A preview trail and text will appear while you draw to guide you.*

## 🔧 Configuration

Click the extension icon in the browser toolbar or right-click the extension and select **"Options"** to open the settings page.
Here you can:
*   Change the visual style (color, thickness, dark mode).
*   Add new gestures by recording them interactively.
*   Delete or modify existing gestures.
*   Reset all settings to default.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the **Polyform Noncommercial License 1.0.0** - see the [LICENSE](LICENSE) file for details.
