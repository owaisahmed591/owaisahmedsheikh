# Production Deployment

This project is ready to build for Cloudflare Pages. The public site can deploy from `dist`.

Current Cloudflare Pages project:

```text
owaisahmedsheikh-preview
```

## Required Cloudflare Pages settings

Add these environment variables in Cloudflare Pages:

- `SITE_URL`: final production URL, for canonical URLs and schema.
- `GITHUB_REPO`: repository in `owner/repo` format.
- `GITHUB_BRANCH`: production branch, usually `main`.
- `GITHUB_TOKEN`: GitHub token with permission to read/write repository contents.
- `CLOUDFLARE_API_TOKEN`: only needed if deploying from a non-logged-in CI shell. Local Wrangler OAuth login is enough on this machine.

Add these bindings in Cloudflare Pages:

- `ADMIN_KV`: required KV namespace for admin users, sessions, media index, and audit events.
- `MEDIA_BUCKET`: optional R2 bucket for production media uploads. If omitted, media upload falls back to GitHub repository storage.

Optional:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Commands

Run the full deploy readiness suite:

```bash
npm run check:deploy
```

Deploy with Wrangler after logging in:

```bash
npx wrangler login
npm run deploy:cloudflare
```

## Automatic deploys from admin edits

The repository includes `.github/workflows/deploy-cloudflare-pages.yml`.

When the admin panel saves a post, the production backend writes the Markdown file to GitHub. A push to `main` then starts GitHub Actions, runs the deploy checks, builds the site, and deploys the `dist` folder to Cloudflare Pages.

Required GitHub repository secret:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Pages write access for the `owaisahmedsheikh-preview` project/account.

The workflow already includes the Cloudflare account ID and project name.

## First production admin test

After deployment:

1. Open `/admin/`.
2. Sign in with the configured admin account, or create the first admin if production KV is empty.
3. Open one post.
4. Run Schema Preview.
5. Upload one image.
6. Save a draft.
7. Confirm the post file changes in GitHub.

Do not promote the deployment to production until those checks pass.
