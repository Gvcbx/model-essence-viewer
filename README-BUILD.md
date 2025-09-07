# IGI2 MEF Model Viewer - Standalone Desktop Application

## Building for Desktop (Electron)

This application can be built as a standalone desktop executable for Windows, Mac, and Linux.

### Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. For Windows builds: Windows SDK
4. For Mac builds: macOS with Xcode
5. For Linux builds: Linux with AppImage dependencies

### Development

```bash
# Install dependencies
npm install

# Run in development mode (web)
npm run dev

# Run electron in development mode
npm run dev:electron
```

### Building Standalone Executable

1. **Build the web application first:**
   ```bash
   npm run build
   ```

2. **Build Electron executable:**
   ```bash
   npm run build:electron
   ```

3. **Create distributable packages:**
   ```bash
   # For Windows
   npm run package:win

   # For macOS
   npm run package:mac

   # For Linux
   npm run package:linux

   # For all platforms
   npm run package:all
   ```

### Output Files

The built executables will be available in:
- **Web version**: `dist/` folder
- **Electron executables**: `electron-dist/` folder

### Features

- **Standalone desktop application** - No browser required
- **Native file system access** - Direct file operations
- **MEF file viewer** - View Project IGI 2: Covert Strike model files
- **OBJ to MEF converter** - Convert Wavefront OBJ files to MEF format
- **3D visualization** - Interactive 3D model viewing
- **Performance optimized** - Hardware accelerated rendering

### File Formats Supported

- **Input**: MEF, OBJ
- **Output**: MEF (converted from OBJ)

### System Requirements

- **Windows**: Windows 7 or later
- **macOS**: macOS 10.10 or later  
- **Linux**: Most modern distributions with X11 or Wayland

### Packaging Configuration

The application uses electron-builder with the following configurations:
- **Windows**: NSIS installer with desktop shortcut
- **macOS**: DMG package
- **Linux**: AppImage format

All executables are code-signed and optimized for distribution.