---
title: 'EaC Runtime - Configuration'
path: './'
description: 'Get started configuring the EaC Runtime'
tags: ['DenoJS', 'EaC Runtime', 'Micro Applications']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# EaC Runtime Configuration Overview

As previously mentioned, the configuration system is built on top of the <a target="_blank">EaC Model</a>, specifically centered around the <a target="_blank">EverythingAsCodeApplications</a> spec. This creates a JSON based configuration for managing releases of many different types of applications and various ways to process application requests.

## Key Concepts

Inside of the EverythingAsCodeApplications spec, are a number of features to help you define and host your micro applications. For complete information on the spec, visit <a target="_blank">Fathym</a>. Following is some information on the out-of-the-box features supported for configuring your micro applications.

### Projects

#### Project Lookup

### Applications

#### Application Lookup

### Processors

#### Generative AI

##### Chat

##### Agents

#### Proxies

#### User Authentication

#### Redirect

#### APIs

#### Preact Apps

#### Distributed File System

##### Local

##### NPM

### Modifiers

Modifiers work as middleware in the EaC Runtime, providing hooks to transform the Request and Response. Following are the built in modifiers, for more complete docs visit [here](modifiers/Overview.md)

#### Deno KV Cache

#### Keep Alive

#### User Authentication

#### Tracing
