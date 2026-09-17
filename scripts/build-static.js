const fs = require('fs');
const path = require('path');

const root = __dirname;
const projectRoot = path.resolve(root, '..');
const outputDir = path.join(projectRoot, 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  const items = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const item of items) {
    const srcPath = path.join(srcDir, item.name);
    const destPath = path.join(destDir, item.name);

    if (item.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

ensureDir(outputDir);
copyDir(path.join(projectRoot, 'files'), outputDir);

const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const buildInfo = {
  name: pkg.name,
  builtAt: new Date().toISOString(),
  staticSite: true,
  note: 'This static build is a compatibility artifact for Azure Static Web Apps.'
};

fs.writeFileSync(path.join(outputDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

console.log(`Static build completed. Files copied to ${outputDir}`);
