const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
  // Read version from package.json
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );
  const version = packageJson.version || '0.0.0';

  // Get Git information
  let commitHash = 'unknown';
  let branch = 'unknown';
  
  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn('Could not get git commit hash:', e.message);
  }

  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn('Could not get git branch:', e.message);
  }

  const buildDate = new Date().toISOString();

  const versionInfo = {
    version,
    commitHash,
    branch,
    buildDate,
    env: process.env.NODE_ENV || 'development'
  };

  // Ensure lib directory exists
  const libDir = path.join(__dirname, '../src/lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  // Write version info
  const outputPath = path.join(libDir, 'version.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(versionInfo, null, 2)
  );

  console.log('✅ Version info generated:', versionInfo);
} catch (error) {
  console.error('❌ Error generating version info:', error);
  process.exit(1);
}
