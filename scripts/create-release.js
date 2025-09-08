const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Create release packages for different platforms and upload sources
 */
async function createRelease() {
  const version = require('../package.json').version;
  const appName = 'IGI2-MEF-Viewer';
  
  console.log(`🚀 Creating release packages for ${appName} v${version}`);
  
  // Build for all platforms
  console.log('🔨 Building desktop applications...');
  try {
    execSync('node scripts/build-desktop.js --all', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return;
  }
  
  const electronDistPath = './electron-dist';
  const releasePath = './release';
  
  // Create release directory
  if (!fs.existsSync(releasePath)) {
    fs.mkdirSync(releasePath, { recursive: true });
  }
  
  // Copy and organize files for different download sources
  console.log('📦 Organizing release files...');
  
  const releaseFiles = [];
  
  if (fs.existsSync(electronDistPath)) {
    const files = fs.readdirSync(electronDistPath);
    
    files.forEach(file => {
      const sourcePath = path.join(electronDistPath, file);
      const stats = fs.statSync(sourcePath);
      
      if (stats.isFile()) {
        const destPath = path.join(releasePath, file);
        fs.copyFileSync(sourcePath, destPath);
        
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        releaseFiles.push({
          name: file,
          size: `${sizeMB} MB`,
          platform: detectPlatform(file)
        });
        
        console.log(`   ✅ ${file} (${sizeMB} MB)`);
      }
    });
  }
  
  // Create release information
  const releaseInfo = {
    version: version,
    date: new Date().toISOString().split('T')[0],
    files: releaseFiles,
    downloadSources: [
      {
        name: 'GitHub Releases',
        url: `https://github.com/igi2-tools/mef-viewer/releases/tag/v${version}`,
        description: 'Official releases with automatic updates'
      },
      {
        name: 'MediaFire',
        url: 'https://mediafire.com/igi2tools',
        description: 'Fast download mirrors'
      },
      {
        name: 'Direct Download',
        url: 'https://igi2tools.com/downloads',
        description: 'Direct download links'
      }
    ],
    features: [
      'Complete 3D MEF model viewer',
      'RES archive manager (extract/create)',
      'OBJ to MEF converter',
      'Native desktop performance',
      'Full WebGL support',
      'Batch file processing',
      'Arabic language support'
    ],
    systemRequirements: {
      windows: {
        os: 'Windows 7 SP1 / Windows 10 / Windows 11',
        memory: '4 GB RAM minimum, 8 GB recommended',
        graphics: 'DirectX 11 compatible graphics card',
        storage: '500 MB available space'
      },
      mac: {
        os: 'macOS 10.13 High Sierra or later',
        memory: '4 GB RAM minimum, 8 GB recommended', 
        graphics: 'Metal-compatible graphics card',
        storage: '500 MB available space'
      },
      linux: {
        os: 'Ubuntu 18.04+ / Debian 9+ / Fedora 28+ or equivalent',
        memory: '4 GB RAM minimum, 8 GB recommended',
        graphics: 'OpenGL 3.3+ compatible graphics card',
        storage: '500 MB available space'
      }
    }
  };
  
  // Save release info
  fs.writeFileSync(
    path.join(releasePath, 'release-info.json'), 
    JSON.stringify(releaseInfo, null, 2)
  );
  
  // Create README for release
  const readmeContent = createReleaseReadme(releaseInfo);
  fs.writeFileSync(path.join(releasePath, 'README.md'), readmeContent);
  
  // Create checksums
  console.log('🔒 Creating checksums...');
  createChecksums(releasePath, releaseFiles);
  
  console.log(`\n🎉 Release v${version} created successfully!`);
  console.log(`📂 Release files are in: ${releasePath}`);
  console.log('\n📋 Release summary:');
  releaseFiles.forEach(file => {
    console.log(`   • ${file.name} - ${file.platform} (${file.size})`);
  });
}

function detectPlatform(filename) {
  if (filename.includes('win') || filename.includes('Setup')) return 'Windows';
  if (filename.includes('mac') || filename.includes('dmg')) return 'macOS';
  if (filename.includes('linux') || filename.includes('AppImage') || filename.includes('deb')) return 'Linux';
  return 'Unknown';
}

function createChecksums(releasePath, files) {
  const crypto = require('crypto');
  const checksums = [];
  
  files.forEach(file => {
    const filePath = path.join(releasePath, file.name);
    const data = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    checksums.push(`${hash}  ${file.name}`);
  });
  
  fs.writeFileSync(path.join(releasePath, 'SHA256SUMS'), checksums.join('\n'));
  console.log('   ✅ SHA256 checksums created');
}

function createReleaseReadme(releaseInfo) {
  return `# IGI2 MEF Viewer v${releaseInfo.version}

🎮 **Complete 3D Model Viewer for IGI2: Covert Strike**

Release Date: ${releaseInfo.date}

## 📥 Download

Choose your platform:

${releaseInfo.files.map(file => 
  `- **${file.platform}**: [${file.name}](${file.name}) (${file.size})`
).join('\n')}

## 🌐 Download Sources

${releaseInfo.downloadSources.map(source => 
  `- **${source.name}**: ${source.description}`
).join('\n')}

## ✨ Features

${releaseInfo.features.map(feature => `- ${feature}`).join('\n')}

## 💻 System Requirements

### Windows
- **OS**: ${releaseInfo.systemRequirements.windows.os}
- **Memory**: ${releaseInfo.systemRequirements.windows.memory}
- **Graphics**: ${releaseInfo.systemRequirements.windows.graphics}
- **Storage**: ${releaseInfo.systemRequirements.windows.storage}

### macOS  
- **OS**: ${releaseInfo.systemRequirements.mac.os}
- **Memory**: ${releaseInfo.systemRequirements.mac.memory}
- **Graphics**: ${releaseInfo.systemRequirements.mac.graphics}
- **Storage**: ${releaseInfo.systemRequirements.mac.storage}

### Linux
- **OS**: ${releaseInfo.systemRequirements.linux.os}
- **Memory**: ${releaseInfo.systemRequirements.linux.memory}
- **Graphics**: ${releaseInfo.systemRequirements.linux.graphics}
- **Storage**: ${releaseInfo.systemRequirements.linux.storage}

## 🛡️ Security

All files include SHA256 checksums for verification. See \`SHA256SUMS\` file.

## 🔧 Installation

### Windows
1. Download the Setup file
2. Run as administrator
3. Follow the installation wizard

### macOS
1. Download the DMG file
2. Open and drag to Applications folder
3. Right-click and "Open" for first launch

### Linux  
1. Download AppImage for portable use or DEB for system installation
2. Make executable: \`chmod +x IGI2-MEF-Viewer-*.AppImage\`
3. Run directly or install DEB package

## 🆘 Support

- **Issues**: https://github.com/igi2-tools/mef-viewer/issues
- **Community**: https://discord.gg/igi2tools
- **Documentation**: https://docs.igi2tools.com

---

Made with ❤️ for the IGI2 community
`;
}

if (require.main === module) {
  createRelease().catch(console.error);
}

module.exports = { createRelease };