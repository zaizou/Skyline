# LWC VSCode Extension

This project demonstrates a Visual Studio Code extension built using Lightning Web Components (LWC). It showcases several key capabilities of LWC within the VS Code extension environment, including real-time component rendering, interactive user input handling, asynchronous operation execution (using the Salesforce CLI), and dynamic output display.

## Features

- **Modular Design:** The application is built using LWC modules for better organization and reusability.
- **Salesforce CLI Integration:** The extension interacts with the Salesforce CLI to execute commands and retrieve data. This allows for integration with Salesforce orgs. Requires the Salesforce CLI to be installed.
- **Real-time Updates:** Changes in the UI are reflected immediately, providing a responsive user experience.
- **Asynchronous Operations:** The extension handles asynchronous operations gracefully, providing feedback to the user while commands are executed.
- **Error Handling:** Basic error handling is implemented to display informative messages to the user in case of failures.
- **Interactive Components:** The Metadata Explorer allows users to filter and retrieve metadata from their Salesforce org.
- **Home Page System Check:** A home page verifies the installation of necessary tools (Git and SF CLI).

## Components

The extension comprises the following key LWC components:

- **App:** The main application component, routing between different pages.
- **Home:** A welcome page verifying system prerequisites.
- **Terminal:** A component for executing arbitrary commands and displaying the output.
- **Metadata Explorer:** A sophisticated component to interact with Salesforce metadata. This allows for listing metadata types, filtering metadata based on name, user, and date, and retrieving selected metadata.
- **Header:** Navigation bar across the application.
- **CliElement:** Base component for components requiring CLI interaction.

## Getting Started

1. **Prerequisites:**

   - Node.js and npm (or yarn)
   - Visual Studio Code
   - Salesforce CLI (for Metadata Explorer functionality)
   - Git (for Home page system check)

2. **Clone the repository:**

   ```bash
   git clone <repository_url>
   ```

3. **Navigate to the project directory:**

   ```bash
   cd <project_directory>
   ```

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Build the extension:** (This step might need adjustments depending on the exact build process used in your project; look for a build script in your package.json)

   ```bash
   npm run build
   ```

6. **Run the extension:**

   Open VS Code and press `F5`. This will launch a new VS Code window with the extension loaded. You can then interact with the extension through the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) by searching for "LWC Development".

7. **Running Tests:** Navigate to the `test` directory and execute `npm run test`.

## Extension Development Path and Tests Path

The `runTest.ts` file contains the paths to the extension and test files. Update these if necessary.
