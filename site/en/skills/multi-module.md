# Multi-Module Topology Protocol

The Multi-Module Protocol (`skills/references/multi-module.md`) coordinates changes spanning multiple modules or repositories.

## Overview

When a feature affects multiple repositories or workspaces, Praxis switches to `multi-module` topology.

```
praxis: scope=complex, topology=multi-module, loading=design,plan,worktree,subagents,review,ship
```

## Protocol Fundamentals

1. **Coordinator Repository**: The user explicitly designates one existing repository as coordinator. It owns the cross-module spec, workspace plan, and change-set manifest.
2. **On-Disk Mode Marker**: Spec and plan files open with an explicit declaration block:
   ```yaml
   topology: multi-module
   change-set: <topic-id>
   coordinator: <repo path>
   repos: <repo paths>
   ```
   Downstream workflow skills inspect this block to re-anchor mode without relying on session memory.
3. **Shared vs Local Specs**: Shared contracts live solely in the coordinator spec. Owning repositories store module-local specs referencing shared contracts without duplication.
4. **Integration & Commit Order**: Modules build and test independently against shared acceptance tests. Commits proceed in dependency order with the coordinator committing last, sharing the change-set ID across commit messages.
