---
title: 'EaC Runtime - Installation'
path: './'
description: 'Get started installing the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Microfrontends']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime - Installation

Once you have <a href="https://docs.deno.com/runtime/manual/getting_started/installation" target="_blank">DenoJS installed</a>, the next thing you need to do is install the EaC Runtime in a new project. To do that, create/open the directory where you want the project to live (We do most of our development in <a href="https://code.visualstudio.com/download" target="_blank">VSCode</a>), then in a command prompt for that directory run the Deno install script for the runtime:

```
deno run -A -r https://eac-runtime.fathym.com/deno/install --docker --vscode
```

This will scaffold a new project with some default configurations already in place. Once installed, we can start the runtime with the following command:

```
deno task dev
```

This will start your new project on `http://localhost:8000`. If that port is already in use, it will pick the first available port in the range 8000 - 8020. If a new port is selected, you will need to update the eac-runtime.config.ts file appropriately so that the initial project is set to this new port.

If you would like to start a production instance of your site, use the following command:

```
deno task start
```

After the runtime is running, you can navigate to `http://localhost:8000/api-reqres/users` to do a demo query for user data. This should return a block of JSON, with a list of users.

See <a href="./Configure.md">here</a> for docs on getting started with configuring your EaC.

## Deploy

Now that our project is configured and running, let's deploy it. There are many ways to deploy your runtime application, from local Docker, to the cloud, or at the edge. 

Make sure that you have <a>installed</a>docker for this next part. Run the following command to build your docker image and start it:

```
deno task build:docker
deno task deploy:docker
```

The output of the command should provide you with a URL to start accessing your deployed application.

For more details on other ways to deploy, visit <a>here</a>.

