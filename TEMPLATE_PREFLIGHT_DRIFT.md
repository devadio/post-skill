# CORE Template Preflight Drift Gate

Use this note when editing CORE POST provider rules, Google Sheet templates, or n8n templates inside the CORE monorepo.

## Rule

The CORE Agent Kit provider-rule fixture is the automation-side authority:

```text
packages/devad-post-agent/fixtures/provider-rules.core-current.json
```

The Google Sheet and n8n templates may embed a small local preflight map so they can block known unsupported provider/media combinations before a live `/posts` call. Those embedded maps must stay aligned with the Agent Kit fixture and provider aliases.

## Required Command

From the CORE repo root:

```powershell
pnpm --filter @devad/post-agent verify:template-preflight
```

Run it after changing any of these:

- `packages/devad-post-agent/fixtures/provider-rules.core-current.json`
- `packages/devad-post-agent/src/validator.ts` provider aliases
- `integrations/post-agent-kit/google-sheet/Code.gs`
- `integrations/post-agent-kit/n8n/devad-post-xco-sheet-to-social.workflow.json`

The normal CORE package test command also runs the drift gate:

```powershell
pnpm --filter @devad/post-agent test
```

## Expected Result

The command should report that template provider preflight rules match the Agent Kit fixture and provider aliases.

If it fails, update the template preflight map or aliases before claiming Sheet/n8n automation is aligned with CORE provider rules.

## Boundary

This is a local dry verification gate only. It does not prove live provider OAuth, live publishing, external visibility, or production n8n/Sheet execution.
