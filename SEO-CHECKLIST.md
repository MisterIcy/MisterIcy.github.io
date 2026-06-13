# SEO Discoverability Checklist — Binary Brew

Generated from the 8-engine SEO research audit (2026-06-13).
Code changes have already been applied. These are the remaining **manual steps**.

---

## Phase 1 — Fix Broken Things ✅ (already applied)

- [x] Strip duplicate `<title>`, `<meta name="description">`, and `<link rel="canonical">` from `BaseHead.astro`
- [x] Fix `og:type` hardcoded as `website` on all pages — blog posts now correctly emit `article`
- [x] Fix RSS `<guid>` to use full absolute URL instead of bare post slug
- [x] Add `max-image-preview:large` to robots meta — enables Google Discover large thumbnails
- [x] Remove redundant `Article` JSON-LD schema — keep `BlogPosting` only
- [x] Add `og:image:type` meta tag (declares MIME type for Bing, Yandex, Baidu, Naver)
- [x] Guard `og:image` emission to images ≥ 1200px only (Google Discover eligibility)
- [x] Update `robots.txt` with `DuckDuckBot`, `DuckAssistBot`, `Yeti` (Naver), Yandex `Clean-param` stanzas, and Baidu leaf sitemap pointer
- [x] Create `public/site.webmanifest` (required for Bing compliance, Edge PWA, Android)
- [x] Add `favicon-32x32.png` and `apple-touch-icon.png` link tags to `BaseHead.astro`
- [x] Create `.github/workflows/indexnow.yml` — post-deploy IndexNow submission for Bing/Yandex/Naver

---

## Phase 2 — Quick Wins (manual steps required)

### Favicons — PNG files missing
- [ ] Generate `public/favicon-32x32.png` (32×32px) from `public/favicon.svg`
- [ ] Generate `public/apple-touch-icon.png` (180×180px) from `public/favicon.svg`
  ```bash
  # Using ImageMagick:
  convert -background none public/favicon.svg -resize 32x32 public/favicon-32x32.png
  convert -background none public/favicon.svg -resize 180x180 public/apple-touch-icon.png
  # Or use https://favicon.io/favicon-converter/ for a browser-based option
  ```

### IndexNow Key
- [ ] Generate a 32-char hex key:
  ```bash
  openssl rand -hex 16
  # Example output: a1b2c3d4e5f67890a1b2c3d4e5f67890
  ```
- [ ] Create the key verification file: `public/<YOUR_KEY>.txt` containing only the key string (no newline)
- [ ] Add `INDEXNOW_KEY` as a GitHub Actions secret at:
  `https://github.com/MisterIcy/mistericy.github.io/settings/secrets/actions`

### Bing Webmaster Tools _(covers Yahoo!, DuckDuckGo, Ecosia automatically)_
- [ ] Register at <https://www.bing.com/webmasters>
- [ ] Import via Google Search Console (fastest path — avoids manual verification)
- [ ] Submit sitemap: `https://mistericy.github.io/sitemap-index.xml`
- [ ] Copy the `msvalidate.01` verification code
- [ ] Uncomment and fill in `src/components/BaseHead.astro`:
  ```html
  <meta name="msvalidate.01" content="YOUR_BING_CODE" />
  ```

### Yandex Webmaster
- [X] Register at <https://webmaster.yandex.com>
- [X] Add site: `https://mistericy.github.io`
- [X] Complete verification (HTML meta tag method)
- [X] Submit sitemap
- [X] Copy the `yandex-verification` code
- [X] Uncomment and fill in `src/components/BaseHead.astro`:
  ```html
  <meta name="yandex-verification" content="YOUR_YANDEX_CODE" />
  ```

### Naver Search Advisor _(low ROI — English-only content, Korean audience minimal)_
- [ ] Register at <https://searchadvisor.naver.com>
- [ ] Verify site ownership
- [ ] Submit sitemap
- [ ] Uncomment and fill in `src/components/BaseHead.astro`:
  ```html
  <meta name="naver-site-verification" content="YOUR_NAVER_CODE" />
  ```

### Self-host JetBrains Mono _(eliminates Google Fonts external request — improves Core Web Vitals and Baidu crawlability)_
- [ ] Download WOFF2 files from <https://fonts.google.com/specimen/JetBrains+Mono>
  (click "Download family", extract the variable or individual weight WOFF2 files)
- [ ] Place files in `public/fonts/` as:
  - `jetbrains-mono-400.woff2`
  - `jetbrains-mono-500.woff2`
  - `jetbrains-mono-600.woff2`
  - `jetbrains-mono-700.woff2`
- [ ] Uncomment the `@font-face` block in `src/styles/global.css`
- [ ] Remove the Google Fonts `<link>` tags from `src/components/BaseHead.astro` (the three lines for preconnect + stylesheet)

### Baidu Ziyuan _(low priority — Baiduspider has limited access to GitHub Pages from outside China)_
- [ ] Register at <https://ziyuan.baidu.com>
- [ ] Add baidu-site-verification meta tag to `src/components/BaseHead.astro`:
  ```html
  <meta name="baidu-site-verification" content="YOUR_BAIDU_CODE" />
  ```
- [ ] Submit sitemap `https://mistericy.github.io/sitemap-0.xml` (Baidu rejects index files)

---

## Phase 3 — Ongoing Monitoring

- [ ] **Google Rich Results Test** — run on a post URL after deploying:
  <https://search.google.com/test/rich-results>
  Confirm `BlogPosting` schema is detected with no errors.
- [ ] **Google Search Console** — check _Enhancements → Breadcrumbs_ and _Articles_ for rich result detection
- [ ] **Bing Webmaster Tools** — monitor _Search Performance_ and _AI Performance_ (Copilot citations) after verification
- [ ] **RSS feed validator** — validate feed after the guid fix:
  <https://validator.w3.org/feed/check.cgi?url=https://mistericy.github.io/rss.xml>
- [ ] **Yandex Webmaster** — check _Indexing → Indexed Pages_ growth over 4–6 weeks after sitemap submission
- [ ] **PageSpeed Insights** — run on homepage and a blog post URL to baseline Core Web Vitals:
  <https://pagespeed.web.dev/>
- [ ] Validate `site.webmanifest` once PNG favicons are in place:
  <https://manifest-validator.appspot.com/>
- [ ] Consider adding `FAQPage` JSON-LD to posts with Q&A sections (effective on Bing and Yandex for expanded rich results)
