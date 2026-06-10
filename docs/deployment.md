# Deployment

## WeChat Mini Program

Use the `WeChat Mini Program Deploy` GitHub Actions workflow to upload a version
to the WeChat Mini Program admin backend.

Required environment or repository secrets:

- `WECHAT_PRIVATE_KEY` or `WECHAT_PRIVATE_KEY_BASE64`: upload private key from
  the WeChat Mini Program admin console.

Optional secrets:

- `WECHAT_APP_ID`: overrides `project.config.json` when present.

Workflow inputs:

- `version`: version string shown in WeChat Mini Program admin.
- `description`: upload description.
- `robot`: WeChat upload robot number, defaults to `1`.

The workflow runs lint, formatting checks, tests, and smoke checks before
uploading. It installs `miniprogram-ci@2.1.31` only inside the deployment job so
the development dependency tree stays small.
