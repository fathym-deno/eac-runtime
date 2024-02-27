---
title: 'EaC Runtime - Installation'
slug: './'
description: 'Get started installing the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Microfrontends']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime - Configuration

The configuration system is built on top of the <a target="_blank">EaC Model</a>, specifically centered around the <a target="_blank">EverythingAsCodeApplications</a> spec.

There are two ways to configure the EaC Runtime:

- **Local Configuration**: Configure proxy settings to forward incoming requests to backend services or other external resources.
- **Generative AI**: Enable generative AI capabilities to add interactive and intelligent conversation and agent capabilities to your applications without writing any code.

## Deploy

Now that our project is configured and running, let's deploy it. There are many ways to deploy your runtime application, from local Docker, to the cloud, or at the edge. 

Make sure that you have <a>installed</a>docker for this next part. Run the following command to build your docker image and start it:

```
deno task build:docker
deno task deploy:docker
```

The output of the command should provide you with a URL to start accessing your deployed application.

For more details on other ways to deploy, visit <a>here</a>.

