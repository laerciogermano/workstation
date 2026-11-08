---
source_url: https://docs.nestjs.com/modules
fetched_at: 2026-11-08
title: "Modules | NestJS"
---

# Modules

A module is a class annotated with `@Module()`. Every Nest app has a root module; most apps use multiple feature modules that encapsulate related capabilities.

`@Module()` metadata:

| Property | Meaning |
| --- | --- |
| `providers` | DI-instantiated providers shared at least within the module |
| `controllers` | Controllers to instantiate |
| `imports` | Modules whose **exported** providers this module needs |
| `exports` | Public API of the module (subset of providers) |

Providers are encapsulated by default. Exported providers form the module's public interface.

## Feature modules

Group closely related controller+service by domain (e.g. `CatsModule`). Aligns with SOLID; boundaries matter as teams/apps grow.

## Shared modules

Modules are singletons by default. Export a provider once; importing modules share the same instance. Re-registering the provider in every module creates separate instances (memory + inconsistent state risk).

## Module re-exporting

Modules can re-export imported modules so consumers get transitive access via one import.

## Global modules

`@Global()` makes providers available everywhere after one registration. Nest docs warn: **making everything global is not recommended** — prefer explicit `imports` for maintainable APIs and less coupling.

## Dynamic modules

`forRoot()` / async variants configure providers at import time (plugin-style modules). Configure once and re-export to share a single instance.
