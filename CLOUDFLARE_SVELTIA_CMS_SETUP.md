# GitHub + Cloudflare Pages + Sveltia CMS Setup

This site is ready for daily blog publishing from `/admin/`.

## What Is Already Built

- `/admin/` loads Sveltia CMS.
- Blog posts are stored in `content/blog/*.md`.
- Approved comments are stored in `content/comments/*.md`.
- `npm run build` regenerates the blog index, blog detail pages, homepage recent articles, and sitemap.
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
Build command: npm run build
Build output directory: /
Root directory: /
Node version: 20 or newer
```

If Cloudflare asks for an output directory and does not accept `/`, use `.`.

## Admin Login

After the site is deployed, open:

```text
https://yourdomain.com/admin/
```

Sveltia CMS will authenticate with GitHub and edit the Markdown files in the repository.

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
npm run build
```

## Notes

- Keep featured images at least 1200x630.
- Keep slugs lowercase with hyphens.
- Use one clear H1 through the title field.
- Use H2 and H3 headings in the article body.
- Add FAQ items only when the questions are answered on the page.
- Pick related posts for internal links.
