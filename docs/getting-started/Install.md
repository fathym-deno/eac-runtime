---
title: 'EaC Runtime - Installation'
slug: './'
description: 'Get started installing the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Microfrontends']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime - Installation

Once you have <a href="https://docs.deno.com/runtime/manual/getting_started/installation" target="_blank">DenoJS installed</a>, the next thing you need to do is install the EaC Runtime in a new project. To do that, we'll run the Deno install script for the runtime:

```
deno run -A -r https://eac-runtime.fathym.com/deno/install --docker
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

