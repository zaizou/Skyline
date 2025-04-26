const fs = require("fs");
const path = require("path");

// Create dist/templates directory if it doesn't exist
const templatesDir = path.join(__dirname, "../dist/templates");
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Copy template file
const sourceTemplate = path.join(
  __dirname,
  "../src/templates/skyline.config.json"
);
const targetTemplate = path.join(templatesDir, "skyline.config.json");
fs.copyFileSync(sourceTemplate, targetTemplate);
