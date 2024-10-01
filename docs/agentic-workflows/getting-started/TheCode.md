# Getting Started with Agentic Workflows - Golden Path

This guide walks you through setting up repositories and initial code for building **Agentic Workflows** using **Fathym Everything as Code (EaC)** and **Synaptic AI**. It follows the **Golden Path** configuration—a streamlined, best-practice approach to building intelligent, automated workflows that scale across enterprise environments. By following this guide, you’ll set up the core components required to create agentic workflows using Fathym's open-source technology.

---

## Prerequisites

### Step 1: Environment Setup
Before proceeding, ensure you have completed the [general getting started documentation](https://www.fathym.com/eac) to set up and configure your environment. Make sure you have the following tools installed:

- **Node.js** (required for `npm` and `npx` package managers)
- **Deno** (for running Deno scripts)
- **Git** (for repository management)

### Step 2: Install the Fathym CLI
The **Fathym CLI** will be used throughout this guide to manage repositories and workflows. Install it globally using **npm**:

```bash
npm i @fathym/cli@latest -g
```

Once installed, authenticate the CLI with the following command:

```bash
fathym auth
```

Alternatively, you can use the shorter form:

```bash
ftm auth
```

> **Note**: Both `fathym` and `ftm` can be used interchangeably in CLI commands.

---

## Setting Up Repositories

As part of the **Golden Path** configuration, you will set up several repositories that serve as the foundation for building agentic workflows. Follow these steps to establish your repositories and get started.

### Step 3: Create a Directory for Your Organization
Create a directory for your GitHub organization in your preferred location for source control:

```bash
mkdir {org-name}
cd {org-name}
```

### Step 4: Configure and Clone the Reference Architecture Repository
Now, use the Fathym CLI to configure and clone your **reference architecture** repository:

```bash
ftm git configure -s {org-name} reference-architecture
```

You can customize the repository name, but for this guide, we’ll refer to it as `reference-architecture`. Next, clone it:

```bash
ftm git clone {org-name} reference-architecture
```

Ensure that **Git** is installed before running the clone command.

### Step 5: Repeat for Additional Repositories
Following the **Golden Path**, you will configure and clone five additional repositories. Repeat the `configure` and `clone` steps for each of these:

- **atomic-design-kit**:
  ```bash
  ftm git configure -s {org-name} atomic-design-kit
  ftm git clone {org-name} atomic-design-kit
  ```

- **core-runtime**:
  ```bash
  ftm git configure -s {org-name} core-runtime
  ftm git clone {org-name} core-runtime
  ```

- **web-runtime**:
  ```bash
  ftm git configure -s {org-name} web-runtime
  ftm git clone {org-name} web-runtime
  ```

- **api-runtime**:
  ```bash
  ftm git configure -s {org-name} api-runtime
  ftm git clone {org-name} api-runtime
  ```

- **synaptic-runtime**:
  ```bash
  ftm git configure -s {org-name} synaptic-runtime
  ftm git clone {org-name} synaptic-runtime
  ```

These repositories serve as the building blocks for your agentic workflows, with each repository playing a key role in defining infrastructure, runtime, and AI components.

---

## Setting Up JSR.io Organization

Once the repositories are cloned, you will need to create an **organization** on [JSR.io](https://www.jsr.io). This organization will host your **reference architecture** and **atomic-design-kit** projects, allowing you to manage your package hosting and deployment workflows. To create an organization, go [here](https://jsr.io/new) and createa a new scope. Try to use the same name you used for your github org-name, though this is not required.

---

## Seeding Repositories with EaC Runtime Instances

To align with the **Golden Path**, the next step is to seed your repositories with the correct **EaC runtime templates**. This process will provide the foundational code and structure for each repository. Follow these steps:

### Step 6: Seed the Reference Architecture Repository
Navigate to the **reference-architecture** directory and run the following command to seed it with the **library template**:

```bash
deno run -A -r https://eac2.fathym.com/deno/install --template=library
```

After seeding, perform a **find and replace** on the string `aaa_bbb_ccc` with your **organization name** to ensure correct package management in **JSR.io**. For `www_xxx_yyy_zzz`, replace it with your package name, which is typically the same as the repository name. For the **reference-architecture**, we recommend using `common`.

In order to get the package ready to publish, you will want to follow the built in JSR flow.  To do this, run the command:

```bash
deno publish --allow-dirty
```

This will open a web browser flow, with fields properly filled out. Simply click create. Then, approve the request and wait for the process to complete. Now that it is completed, go to versions, and 'yank' the only version there (0.0.0). Then we can complete the final settings on the Settings tab. Start by giving a description to your package, then turn on Deno and Browsers for the Runtime Compat (save changes), and finally we can connect our GitHub repository (filling in the appropriate org/repo).

> **Note**: You only need to run the `deno publish` command for the reference-architecture and atomic-design-kit. Skip for all *-runtime repositories

Now you can push your code to generate your first automatic package or runtime build. This will build it, check for any publish errors and then commit the code. Once committed, an automatic build will be kicked off that pushes your package or builds your runtime.

```bash
deno task deploy
```

You'll notice that this deploys a version with -integration on the end, which is a pre-release package. To deploy the latest version of the package, merge or PR changes from integration to main.

### Step 7: Seed the Remaining Repositories
Repeat the process for the remaining repositories, adjusting the template for each one. Here are the specific templates to use:

- **atomic-design-kit** (with publish):
  ```bash
  deno run -A -r https://eac2.fathym.com/deno/install --template=atomic
  ```

- **core-runtime**:
  ```bash
  deno run -A -r https://eac2.fathym.com/deno/install --template=core
  ```

- **web-runtime**:
  ```bash
  deno run -A -r https://eac2.fathym.com/deno/install --template=preact
  ```

- **api-runtime**:
  ```bash
  deno run -A -r https://eac2.fathym.com/deno/install --template=api
  ```

- **synaptic-runtime**:
  ```bash
  deno run -A -r https://eac2.fathym.com/deno/install --template=synaptic
  ```

Once seeded, follow the same **find and replace** steps for each repository to correctly name your organization and packages.

---

## Next Steps: Building Agentic Workflows

At this point, you’ve laid the foundation for building **agentic workflows**. Each repository contains the core runtime instances necessary for implementing the **Golden Path** configuration. You can now proceed with customizing these repositories to fit your organization's specific needs, including:

- **Customizing Workflows**: Extend the EaC runtime to define your agentic workflows, integrating AI agents with infrastructure and data.
- **Automation and Scaling**: Use **Synaptic AI** to deploy multi-agent systems capable of dynamically automating processes and scaling based on workload or system demand.
- **Orchestrating End-to-End Solutions**: Integrate infrastructure, data, and applications into a seamless workflow that can be managed and monitored using **Everything as Code**.

For more detailed guidance, explore the individual module documentation for deeper customization and integration tips within the **Fathym ecosystem**.

---

This guide sets you on the **Golden Path** toward building agentic workflows, streamlining the setup process, and positioning you to leverage **Fathym’s open-source technology** to automate and orchestrate complex enterprise workflows.
