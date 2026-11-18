# Third-Party Notices

This project is licensed under the Apache License, Version 2.0 (see [LICENSE](LICENSE) and [NOTICE](NOTICE)).

## Mini Program Runtime

No third-party npm packages are bundled into the WeChat Mini Program runtime.
The client relies on standard WeChat Mini Program APIs and custom WXSS styles (`app.wxss`, `styles/theme.wxss`) inspired by WeUI design conventions.

## Development Tooling

The following development-only packages (`devDependencies` in `package.json`, pinned in `package-lock.json`) are used for linting and formatting and are excluded from the Mini Program runtime package:

| Package | License | Purpose |
| --- | --- | --- |
| `eslint` | MIT | JavaScript static analysis and lint checks |
| `prettier` | MIT | Code formatting verification |

Full license texts and transitive dependency metadata for development tooling are resolved via `package-lock.json` during `npm ci`.
