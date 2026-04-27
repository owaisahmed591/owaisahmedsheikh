# Blog Admin Workflow

This local copy now has a Git-based blog workflow using Sveltia CMS.

## Public Pages

- Blog hub: `/blog/`
- Example article: `/blog/seo-content-writing-for-business-pages/`
- Write for Us page: `/write-for-us/`
- Admin panel: `/admin/`

## Daily Blog Publishing

1. Open `/admin/`.
2. Create a new item in `Blog Posts`.
3. Fill the SEO fields: title, slug, category, tags, focus keyword, excerpt, meta title, meta description, dates, featured image, FAQ items, related posts, newsletter, CTA, and body.
4. Keep `Draft` enabled until the article is ready.
5. Publish the post in the CMS.
6. Run `npm run build` before deployment so the static blog pages, homepage recent articles, and sitemap are regenerated.

## Comment Moderation

Visitor comments are collected through the public comment form on each article.

Approved public comments live in `content/comments`.

To publish a comment:

1. Open `/admin/`.
2. Create or edit an item in `Blog Comments`.
3. Set the correct blog post in `Blog Post`.
4. Review name, business, email, phone, website, type, rating, and comment body.
5. Set `Approved` to true.
6. Run `npm run build`.

Only approved comment files are rendered on public article pages. Email and phone fields are for moderation only and are not shown publicly.

## Commands

```powershell
npm run audit:content
npm run audit:cms
npm run build
npm run preview
```

Open `http://127.0.0.1:4174/` for the local preview.

## AI Assistant

The chat widget calls `/api/ai-assistant` on Netlify. The OpenAI key stays server-side and is never exposed in browser JavaScript.

Required Netlify environment variable:

```powershell
OPENAI_API_KEY=your_openai_api_key
```

Optional model override:

```powershell
OPENAI_MODEL=gpt-5.4-nano
```

If the key is missing or the API is unavailable, the widget falls back to the built-in SEO assistant replies so the site still works locally.

## GitHub Setup Needed Before Live Admin Use

`admin/config.yml` is currently set to:

```yaml
backend:
  name: github
  repo: owaisahmed591/owaisahmedsheikh
  branch: main
```

After the site is connected to GitHub and deployed, the admin panel can edit Markdown content in the repository.

For the Cloudflare Pages setup, see `CLOUDFLARE_SVELTIA_CMS_SETUP.md`.
