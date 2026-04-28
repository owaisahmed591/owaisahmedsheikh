# GitHub + Cloudflare Pages + Sveltia CMS Setup

This site is ready for daily blog publishing from `/admin/`.

## What Is Already Built

- `/admin/` loads Sveltia CMS.
- Blog posts are stored in `content/blog/*.md`.
- Approved comments are stored in `content/comments/*.md`.
- `npm run build` regenerates the blog index, blog detail pages, homepage recent articles, and sitemap.
- `npm run build:cloudflare` creates a clean `dist/` folder for Cloudflare Pages.
- `/api/ai-assistant` is available as a Cloudflare Pages Function in `functions/api/ai-assistant.ts`.
- Each blog post has editable SEO fields, featured image URL/path, category, tags, FAQ items, related posts, newsletter copy, CTA, and Markdown body.

## GitHub Setup

Create a GitHub repository for this site, then update `admin/config.yml`:

```yaml
backend:
  name: github
  repo: owaisahmed591/owaisahmedsheikh
  branch: main
```

Keep the content folders in the repository:

```text
content/blog/
content/comments/
uploads/blog/
admin/
```

## Cloudflare Pages Setup

Connect the GitHub repository to Cloudflare Pages.

Use these build settings:

```text
Framework preset: None
Build command: npm run build:cloudflare
Build output directory: dist
Root directory: /
Node version: 20 or newer
```

Add these environment variables in Cloudflare Pages if you want the AI assistant to use OpenAI:

```text
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-nano
```

If `OPENAI_API_KEY` is missing, the chatbot still works with a safe fallback answer.

## Cloudflare Direct Upload Preview

If you want to upload a temporary preview from this machine instead of connecting GitHub first, run:

```powershell
npm run build:cloudflare
$env:CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
npx wrangler pages deploy dist --project-name owaisahmedsheikh-preview --branch preview
```

In this desktop environment, `wrangler` cannot open an interactive login page, so it needs `CLOUDFLARE_API_TOKEN`.

## Admin Login

After the site is deployed, open:

```text
https://yourdomain.com/admin/
```

Sveltia CMS will authenticate with GitHub and edit the Markdown files in the repository.

On Cloudflare, use the `Sign In with Token` option unless a separate Sveltia CMS Authenticator worker has been configured. The regular GitHub OAuth popup falls back to Netlify's OAuth service and can show `Not Found` on Cloudflare-hosted sites.

For the token method, create a fine-grained GitHub personal access token limited to:

```text
Repository: owaisahmed591/owaisahmedsheikh
Permission: Contents read and write
```

The admin config is already set for:

```text
owaisahmed591/owaisahmedsheikh
```

## Daily Publishing Workflow

1. Open `/admin/`.
2. Create a new Blog Post.
3. Fill title, slug, category, tags, SEO title, meta description, featured image, FAQ items, related posts, and body.
4. Save or publish.
5. Cloudflare Pages rebuilds the site from GitHub.
6. The blog index, homepage recent articles, article page, and sitemap update automatically.

## Commands To Check Before Deploy

```powershell
npm run audit:cms
npm run audit:content
npm run build:cloudflare
```

## Notes

- Keep featured images at least 1200x630.
- Keep slugs lowercase with hyphens.
- Use one clear H1 through the title field.
- Use H2 and H3 headings in the article body.
- Add FAQ items only when the questions are answered on the page.
- Pick related posts for internal links.
