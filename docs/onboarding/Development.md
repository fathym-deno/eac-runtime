---
title: 'Fathym Development Acceleration Program - Golden Path Setup'
path: './'
description: 'An introduction to local environment setup using Fathym'
tags: ['DenoJS', 'EaC Runtime', 'Microfrontends']
date: '2024-10-16'
params:
  author: 'Michael Gearhardt (CTO)'
---

# Steps for Local Development Setup

Follow these steps to set up your local environment and start working on Fathym projects:

1. **Register a user on Fathym Dashboard**  
   - Go to [https://www.fathym.com/dashboard/](https://www.fathym.com/dashboard/) and register your account.

2. **Create a folder for the GitHub repositories**  
   - On your local machine, create a blank folder where you will store all the necessary GitHub repositories.

3. **Open the folder in VS Code**  
   - Launch **Visual Studio Code (VS Code)** and click on `File > Open Folder`. Select the folder you just created.

4. **Open a terminal in VS Code**  
   - Once the folder is open, launch the terminal inside VS Code by selecting `Terminal > New Terminal` from the menu.

5. **Install the Fathym CLI**  
   - In the terminal, run the following command to install the Fathym CLI tool:
   
   ```bash
   npm i @fathym/cli@latest

6. **Authenticate with Fathym**
   - Run the following command to authenticate with Fathym:

   ```bash
   fathym auth

7. **Authenticate with GitHub**
   - Use the Fathym CLI to authenticate your GitHub account:

    ````bash
    fathym git auth

8. **Set your Fathym Enterprise**
   - Link your development environment with your Fathym Enterprise:

    ````bash
    fathym enterprises set

9. **Clone the GitHub Repositories**
    - Now you can clone the necessary repositories using the Fathym CLI. To clone all required repositories, run:

    ````bash
    fathym git clone
    ````

    **Note:** The CLI will prompt you to select the repository to clone each time.

Alternatively, you can manually clone the repositories by obtaining the clone URLs from GitHub and running:

````bash
git clone <repo-url>
````

## Additional Notes

- If you encounter any issues during authentication or repository cloning, ensure your access tokens and permissions for GitHub are properly configured.
- If you encounter issues during authentication, ensure that your CLI is up-to-date and that you have registered correctly on the Fathym Dashboard.
- If you face issues with the Fathym CLI, consider manually cloning the repositories using the GitHub URLs.
- For more information or troubleshooting, refer to the official [Fathym Documentation](https://raw.githubusercontent.com/fathym-deno/eac-runtime/refs/heads/integration/docs/Overview.md).

You are now ready to begin developing with Fathym’s tools and repositories! For any additional help, please refer to Fathym's support channels or documentation.
