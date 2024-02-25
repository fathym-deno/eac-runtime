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
