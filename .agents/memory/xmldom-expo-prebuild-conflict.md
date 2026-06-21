---
name: xmldom override breaks Expo prebuild
description: Pinning @xmldom/xmldom to the 0.9.x line breaks `expo prebuild`; use the 0.8.x line instead.
---

# @xmldom/xmldom security override must stay on the 0.8.x line

Security scans flag `@xmldom/xmldom` and want it bumped. Do NOT pin it to a `0.9.x`
version in `pnpm-workspace.yaml` overrides.

**Why:** xmldom 0.9.0 made `DOMParser.parseFromString(source, mimeType)` require a
valid `mimeType`. Expo's `@expo/plist` / `@expo/config-plugins` call it WITHOUT a
mimeType during `expo prebuild`, so 0.9.x throws
`DOMParser.parseFromString: the provided mimeType "undefined" is not valid` and
prebuild (and EAS iOS builds) fail. The 0.8.x line keeps the lenient signature.

**How to apply:** Pin the override to the latest `0.8.x` (e.g. `0.8.13`), not `0.9.x`.
The maintainers backport the same advisories to both lines — `0.8.13` already
contains GHSA-j759-j44w-7fr8, GHSA-x6wf-f3px-wcqx, GHSA-f6ww-3ggp-fr8h, and
GHSA-2v35-w6hq-6mfw — so security and Expo compatibility are both satisfied.
Verify with: `@expo/plist` build+parse round-trip succeeds after `pnpm install`.
