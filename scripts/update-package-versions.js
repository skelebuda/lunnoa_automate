const fs = require('fs');
const path = require('path');

// Get the new version from command line arguments
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('No version provided');
  process.exit(1);
}

// List of package.json files to update
const packagePaths = [
  'package.json',
];

// Update each package.json
packagePaths.forEach((packagePath) => {
  const fullPath = path.join(__dirname, '..', packagePath);

  try {
    // Read the package.json
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    // Update the version
    packageJson.version = newVersion;

    // Update @lunnoa-automate dependencies if they exist
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach((dep) => {
        if (dep.startsWith('@lunnoa-automate/')) {
          packageJson.dependencies[dep] = newVersion;
        }
      });
    }

    // Write back to file
    fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.info(`Updated ${packagePath} to version ${newVersion}`);
  } catch (error) {
    console.error(`Error updating ${packagePath}:`, error);
    process.exit(1);
  }
});
