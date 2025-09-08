const { build } = require('vite');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildDesktopApp() {
  console.log('🚀 Building IGI2 MEF Viewer Desktop Application...');
  
  try {
    // Step 1: Build the Vite app
    console.log('📦 Building React application...');
    await build({
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              three: ['three', '@react-three/fiber', '@react-three/drei'],
              ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-tabs']
            }
          }
        }
      }
    });
    
    console.log('✅ React build completed!');
    
    // Step 2: Prepare Electron files
    console.log('⚡ Preparing Electron files...');
    
    if (!fs.existsSync('dist/electron')) {
      fs.mkdirSync('dist/electron', { recursive: true });
    }
    
    // Copy Electron files
    fs.copyFileSync('electron/main.js', 'dist/electron/main.js');
    fs.copyFileSync('electron/preload.js', 'dist/electron/preload.js');
    
    // Copy package.json for Electron
    if (fs.existsSync('electron/package.json')) {
      fs.copyFileSync('electron/package.json', 'dist/package.json');
    } else {
      // Create a minimal package.json for Electron
      const electronPackageJson = {
        name: 'igi2-mef-viewer',
        version: '2.0.0',
        description: 'IGI2 MEF Model Viewer - Desktop Application',
        main: 'electron/main.js',
        author: 'IGI2 Tools Community',
        license: 'MIT',
        scripts: {
          start: 'electron .'
        }
      };
      
      fs.writeFileSync('dist/package.json', JSON.stringify(electronPackageJson, null, 2));
    }
    
    console.log('✅ Electron files prepared!');
    
    // Step 3: Build desktop executables
    console.log('🔨 Building desktop executables...');
    
    try {
      // Install electron-builder if not present
      try {
        require('electron-builder');
      } catch (e) {
        console.log('📥 Installing electron-builder...');
        execSync('npm install electron-builder --save-dev', { stdio: 'inherit' });
      }
      
      // Build for current platform by default
      const platform = process.platform;
      let buildCommand = 'npx electron-builder';
      
      if (process.argv.includes('--all')) {
        buildCommand += ' --win --mac --linux';
        console.log('🌍 Building for all platforms...');
      } else if (process.argv.includes('--win')) {
        buildCommand += ' --win';
        console.log('🪟 Building for Windows...');
      } else if (process.argv.includes('--mac')) {
        buildCommand += ' --mac';
        console.log('🍎 Building for macOS...');
      } else if (process.argv.includes('--linux')) {
        buildCommand += ' --linux';
        console.log('🐧 Building for Linux...');
      } else {
        // Auto-detect platform
        if (platform === 'win32') buildCommand += ' --win';
        else if (platform === 'darwin') buildCommand += ' --mac';
        else buildCommand += ' --linux';
        console.log(`🖥️ Building for ${platform}...`);
      }
      
      buildCommand += ' --config electron-builder.json';
      
      execSync(buildCommand, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('🎉 Desktop application built successfully!');
      console.log('📂 Check the electron-dist folder for your executable files');
      
      // Display build information
      const electronDistPath = path.join(process.cwd(), 'electron-dist');
      if (fs.existsSync(electronDistPath)) {
        const files = fs.readdirSync(electronDistPath);
        console.log('\n📋 Built files:');
        files.forEach(file => {
          const filePath = path.join(electronDistPath, file);
          const stats = fs.statSync(filePath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`   • ${file} (${sizeMB} MB)`);
        });
      }
      
    } catch (error) {
      console.error('❌ Electron build failed:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('wine')) {
        console.log('\n💡 Tip: To build Windows apps on macOS/Linux, install wine:');
        console.log('   brew install wine (macOS)');
        console.log('   sudo apt install wine (Ubuntu/Debian)');
      }
      
      if (error.message.includes('fpm')) {
        console.log('\n💡 Tip: To build Linux packages, install fpm:');
        console.log('   gem install fpm');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  buildDesktopApp().catch(console.error);
}

module.exports = { buildDesktopApp };