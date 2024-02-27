---
title: 'EaC Runtime - Configuration'
path: './configure'
description: 'Get started configuring the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Micro Applications']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime - Configuration

The configuration system is built on top of the <a target="_blank">EaC Model</a>, specifically centered around the <a target="_blank">EverythingAsCodeApplications</a> spec.

There are two ways to configure the EaC Runtime:

- **Local Config**: Configure a local EaC using the default `configs/eac-runtime.config.ts` file.
- **Fathym EaC Config**: Enable deployment free management of the EaC with Fathym's no code, AI assisted <a target="_blank">EaC Management Platform</a>.

## Local Configuration

The `eac-runtime.config` is where you can mange [EaC Runtime settings](../Configuration.md), like the port it starts on and the EaC used to configure your applications.

## Fathym EaC configuration

Local configuration is nice, but it requires a redeployment of the runtime with every change. When the only changes we want to make are to our EaC configuration, Fathym's <a target="_blank">EaC Management Platform</a> makes it simple. Providing UIs to easily manage all aspects of the EaC, and automatic renewal of the EaC to keep your runtime in sync with your EaC configuration changes. 

Both configuration techniques can be used [together](./). Provide a default configuration that all deployments use and override it with the configuration from Fathym. 