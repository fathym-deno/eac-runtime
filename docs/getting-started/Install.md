---
title: 'EaC Runtime - Installation'
path: './install'
description: 'Get started installing the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Microfrontends']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime - Installation

Once you have <a href="https://docs.deno.com/runtime/manual/getting_started/installation" target="_blank">DenoJS installed</a>, the next thing you need to do is install the EaC Runtime in a project. To do that, create/open the directory where you want the project to live (we do most of our development in <a href="https://code.visualstudio.com/download" target="_blank">VSCode</a>), then in a command prompt for that directory run the EaC Runtime install script with Deno:

```
deno run -A -r https://eac-runtime.fathym.com/deno/install --docker --vscode --preact
```

This will scaffold a new project with some default configurations already in place. Once installed, we can start the runtime with the following command:

```
deno task dev
```

This will start your new project on `http://localhost:8000`. If that port is already in use, it will pick the first available port in the range 8000 - 8020.

If you would like to start a production instance of your site, use the following command:

```
deno task start
```

After the runtime is running, you can navigate to <a href="http://localhost:8000/" target="_blank">`http://localhost:8000/`</a> to view the new project readme file.

See <a href="Configure.md">here</a> for docs on getting started with configuring your EaC.

## Deploy

Now that our project is configured and running, let's deploy it. There are many ways to deploy your runtime application, from local Docker, to the cloud, or at the edge. 

Make sure that you have <a href="https://docs.docker.com/engine/install/" target="_blank">installed docker desktop</a> for this next part. If you want to use a unique image name, update the `build:docker` and `deploy:docker` commands and replace 'eac-runtime' with your image name, you can also update the ports. Run the following command to build your docker image and start it:

```
deno task build:docker
deno task deploy:docker
```

The output of the command should provide you with a URL to start accessing your deployed application. By default, we have it setup to start at <a href="http://localhost:3000/">`http://localhost:3000/`</a>.

For more details on other ways to deploy, visit <a>here</a>.

## Next steps

Next let's take a look at how to [configure](Configure.md) our EaC Runtime.

