# LWC Development Extension for VS Code

A Visual Studio Code extension that enhances the Lightning Web Component (LWC) development experience by providing a graphical interface for Salesforce metadata management and project configuration.

## Features

### 🏠 Home Dashboard

- System prerequisite verification
- Installation status checks for:
  - Git
  - Salesforce CLI
  - Git repository setup
- Visual progress indicators for setup status

### 🔍 Metadata Explorer

- Browse and search Salesforce metadata types
- Filter metadata by:
  - Component name
  - Last modified date
  - User
- Hierarchical view of metadata relationships
- Direct metadata retrieval to local project
- Time zone support for date filtering

### ⚙️ Repository Configuration

- Manage project configuration settings
- View and edit configuration files
- Validate repository setup

## Prerequisites

Before using this extension, ensure you have:

- Visual Studio Code 1.95.0 or later
- Git installed locally
- Salesforce CLI (sf) installed
- A Git repository initialized in your project
- Node.js and npm

## Installation

1. Download the VSIX file from the releases page
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
4. Click the "..." menu at the top of the Extensions view
5. Select "Install from VSIX..."
6. Choose the downloaded VSIX file

## Usage

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "LWC Extension" and select it
3. The extension interface will open in a new panel

### Metadata Explorer

1. Select a metadata type from the dropdown
2. Use filters to narrow down results:
   - Enter component names
   - Select date ranges
   - Filter by last modified user
3. Click the checkboxes to select metadata
4. Click "Retrieve" to download selected metadata to your project

### System Checks

The home page automatically verifies:

- Git installation
- Current directory Git repository status
- Salesforce CLI installation

## Development

### Setup

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch for changes during development
npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "test-name"
```

### Building

```bash
# Create production build
npm run package
```

### Project Structure

```
src/
├── extension.ts          # VS Code extension entry point
├── index.ts             # LWC application entry point
├── modules/             # LWC components
│   └── default/
│       ├── app/         # Main application component
│       ├── home/        # Home page component
│       ├── metadataExplorer/  # Metadata browser
│       └── repoConfig/  # Repository configuration
├── test/                # Test files
└── types/               # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Dependencies

- [@salesforce-ux/design-system](https://www.npmjs.com/package/@salesforce-ux/design-system) - ^2.25.3
- [lightning-base-components](https://www.npmjs.com/package/lightning-base-components) - ^1.22.1-alpha
- Various development dependencies for TypeScript, Webpack, and testing

## Acknowledgments

- Salesforce Lightning Design System team
- Lightning Web Components framework team
- VS Code extension development community

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
