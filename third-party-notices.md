# Third-Party Notices

This project is licensed under the Apache License, Version 2.0 (see [LICENSE](LICENSE) and [NOTICE](NOTICE)).

## Mini Program Runtime

No third-party npm packages are bundled into the WeChat Mini Program runtime.
The runtime bundles the following vendored third-party stylesheet:

| Component | Version | Copyright | License | Source |
| --- | --- | --- | --- | --- |
| WeUI (`common/lib/weui.wxss`) | v1.1.1 | Copyright 2017 Tencent, Inc. | MIT | `https://github.com/weui/weui-wxss` |

## Development Tooling

The following development-only packages (`devDependencies` in `package.json`, pinned in `package-lock.json`) are used for linting and formatting and are excluded from the Mini Program runtime package:

| Package | License | Purpose |
| --- | --- | --- |
| `eslint` | MIT | JavaScript static analysis and lint checks |
| `prettier` | MIT | Code formatting verification |

Full license texts and transitive dependency metadata for development tooling are resolved via `package-lock.json` during `npm ci`.
