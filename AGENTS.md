# AGENTS.md — Maintaining the Apple Silicon branch

This is a **fork** of [streamlink/streamlink-twitch-gui](https://github.com/streamlink/streamlink-twitch-gui)
at `github.com/uncleungie/streamlink-twitch-gui-apple-silicon`. It exists solely to
keep the arm64 macOS build working alongside upstream changes. **Do not add features
here.** It tracks `master` via rebase.

## Build commands

```bash
yarn install
yarn run grunt build:prod
yarn run grunt compile:osxArm64
yarn run grunt dist:archive_osxArm64   # compile + create tar.gz
```

To build all platforms (CI): `yarn run grunt clean:dist dist:all`

## Architecture

### NW.js version split

| Platform   | NW.js   | Chromium | Why |
|------------|---------|----------|-----|
| `osxArm64` | 0.112.0 | 149      | 0.83.0 arm64 has invalid code signature on modern macOS; kernel SIGKILLs it |
| All others | 0.83.0  | 120      | Original project version; unchanged |

Defined in `build/tasks/configs/nwjs.js`.

### nw-builder

Uses nw-builder v4 (^4.17.0). v4 natively supports `arch: "arm64"`.
Upstream master uses a forked v3; this branch has migrated to the official v4 package.

#### Helper renaming patch

nw-builder v4 renames NW.js helper apps (GPU, Renderer, etc.) to match the
app name. Renaming modifies the Mach-O binary (bundle paths, plist contents),
which invalidates the page hashes in the embedded `LC_CODE_SIGNATURE`. The
original linker-produced ad-hoc signature is valid and functional, so
re-signing the helpers is unnecessary — and would needlessly destroy their
`CS_LINKER_SIGNED` status (see below).

`codesign --sign -` strips the `CS_LINKER_SIGNED` flag (`0x00020000`) that
the linker sets, since Apple's `signer.cpp` deliberately does not preserve it
for linker-signed binaries; the result is plain `CS_ADHOC` (`0x2`). This flag
loss is cosmetic — the kernel accepts both flag combinations for child process
launch, so plain ad-hoc signatures are not rejected. (The combined value
`0x20002` reported by `codesign -dvv` is `CS_ADHOC | CS_LINKER_SIGNED`, not
the value of the single flag.)

`bin/patched-osx.js` is a copy of `node_modules/nw-builder/src/bld/osx.js`
with the helper rename block removed. The `postinstall` script copies it
into place after `yarn install`.

#### macOS code signing

The `compile.js` post-build steps include `shell:sign_osxArm64` which runs
`codesign --force --sign -` on the main `.app` bundle (without `--deep`).
Only the main executable needs re-signing because v4 renames it. The
helpers keep their original linker-signed signatures since they are not
renamed (the `osx.js` patch skips that). `--deep` is deliberately omitted
because it re-signs helpers and destroys their linker-signed signatures.

### Chromium-args per platform

The arm64 build strips `--disable-features=nw2` from chromium-args.
NW.js 0.112.0 is NW3-only; the flag blocks JavaScript execution.
Done in the `packagejson_osxArm64` shell task in `build/tasks/configs/shell.js`.
x64 (0.83.0) keeps the flag — it needs it.

### Ghost title fix

NW.js 0.112.0 renders `document.title` as the native window title even when
`frame: false`. Two changes suppress it:

1. `src/app/package.json` — manifest `"title"` set to `"\u200b"` (zero-width space)
2. `src/app/index.html` — `<title></title>` (empty)

The app's own title-bar component (`src/app/ui/components/title-bar/`) renders
the display name from config, so nothing is lost.

## Gotchas

### NW.js cache symlinks

When manually caching an NW.js runtime into `build/cache/<version>-<flavor>/`,
use `ditto` or `cp -a` (not `cp -r`). The NW.js framework uses symlinks
internally (`nwjs Framework -> Versions/Current/nwjs Framework`).
Following them produces a 3x bloated build.

### Code signing

NW.js 0.83.0 arm64 binaries from `dl.nwjs.io` have an invalid code signature.
macOS kills them on launch (SIGKILL, exit 137). That's why arm64 uses 0.112.0.

On Apple Silicon (macOS 11+), all executable code must carry at least an
ad-hoc code signature. The linker sets the `CS_LINKER_SIGNED` flag
(`0x00020000`) when auto-signing at link time. Re-signing with
`codesign --sign -` produces plain ad-hoc (flags=0x2) and strips
`CS_LINKER_SIGNED`, but the kernel accepts both — the flag loss itself does
not block execution. However, if a Mach-O binary is modified (e.g. via helper
renaming), its page hashes become stale and the kernel will SIGKILL it on
launch. This is why helpers must not be renamed (the `osx.js` patch) and
`--deep` must not be used when re-signing.

### Gitignored build artifacts

`build/cache/`, `build/releases/`, `build/tmp/`, `dist/`, and `node_modules/`
are gitignored. NW.js runtimes (~400 MB each) are downloaded at build time.

## Merging upstream changes

```bash
git checkout master
git pull upstream master
git checkout apple-silicon
git rebase master
```

Conflicts are likely in `build/tasks/configs/nwjs.js` and `build/tasks/custom/`
files — this branch uses nw-builder v4 while upstream uses a forked v3.
Manually resolve by keeping this branch's v4 code.

## Files changed on this branch (vs master)

### Source
- `build/tasks/common/platforms.js` — `osxArm64` platform + native detection + v4 platform/arch mappings
- `build/tasks/configs/nwjs.js` — `osxArm64` target (NW.js 0.112.0) + v4 API
- `build/tasks/configs/compile.js` — pre/post build steps
- `build/tasks/configs/shell.js` — permissions, manifest patching, archive
- `build/tasks/configs/compress.js` — archive paths
- `build/tasks/configs/dist.js` — dist target
- `build/tasks/configs/clean.js` — release cleanup
- `build/tasks/configs/run.js` — v4 API options
- `build/tasks/configs/runtest.js` — test-runner output path
- `build/tasks/custom/nwjs.js` — v4 nwbuild functional API
- `build/tasks/custom/run.js` — v4 nwbuild functional API
- `build/tasks/custom/runtest.js` — v4 nwbuild process-based API
- `build/tasks/webpack/plugins/nwjs.js` — v4 nwbuild functional API
- `build/tasks/webpack/configurators/dev.js` — v4 option names
- `package.json` — nw-builder v4 dependency + postinstall patch
- `bin/patched-osx.js` — v4 osx.js with helper rename disabled
- `src/app/package.json` — zero-width title
- `src/app/index.html` — empty `<title>`
- `src/app/utils/node/platform.js` — `is64bit` includes `arm64`
- `src/config/update.json` — update checks repointed to fork releases

### Docs
- `README.md` — Apple Silicon fork branding + attribution
- `AGENTS.md` — this file (maintenance docs)
