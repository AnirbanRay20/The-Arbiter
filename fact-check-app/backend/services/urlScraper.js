require('dotenv').config();
const axios   = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes a URL and returns:
 * - text: article body text
 * - images: array of absolute image URLs found in the article
 * - title: page title
 * - domain: hostname
 */
async function scrapeUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxContentLength: 5 * 1024 * 1024, // 5MB max
    });

    const $ = cheerio.load(response.data);
    const domain = new URL(url).hostname;

    // ── Remove noise elements ──
    $('script, style, nav, footer, header, aside, .ad, .advertisement, .cookie-banner, .popup').remove();

    // ── Extract title ──
    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  'Untitled Article';

    // ── Extract main text ──
    const contentSelectors = [
      'article', '[role="main"]', '.article-body',
      '.post-content', '.entry-content', '.story-body',
      'main', '.content', '#content',
    ];

    let text = '';
    for (const sel of contentSelectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 200) {
        text = el.text().trim();
        break;
      }
    }

    // Fallback: grab all paragraph text
    if (!text || text.length < 200) {
      text = $('p').map((_, el) => $(el).text().trim())
                   .get()
                   .filter(t => t.length > 40)
                   .join(' ');
    }

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim().slice(0, 8000);

    // ── Extract images ── NEW
    const images = [];
    const seenUrls = new Set();

    // Look in article/main content areas first for relevance
    const imgSelectors = [
      'article img', 'main img', '.article-body img',
      '.post-content img', '.entry-content img',
      'figure img', '.story-body img',
      'img', // fallback: all images
    ];

    for (const sel of imgSelectors) {
      $(sel).each((_, el) => {
        // Get src — try multiple attributes
        const src = $(el).attr('src') ||
                    $(el).attr('data-src') ||
                    $(el).attr('data-lazy-src') ||
                    $(el).attr('data-original');

        if (!src) return;

        // Convert relative URLs to absolute
        let absUrl;
        try {
          absUrl = new URL(src, url).href;
        } catch {
          return;
        }

        // Filter out tiny icons, logos, tracking pixels, SVGs
        if (seenUrls.has(absUrl)) return;
        if (absUrl.includes('logo') || absUrl.includes('icon') ||
            absUrl.includes('pixel') || absUrl.includes('tracking') ||
            absUrl.includes('avatar') || absUrl.includes('emoji') ||
            absUrl.endsWith('.svg') || absUrl.endsWith('.gif')) return;

        // Filter by size attributes if available
        const width  = parseInt($(el).attr('width')  || '999');
        const height = parseInt($(el).attr('height') || '999');
        if (width < 100 || height < 100) return;

        seenUrls.add(absUrl);
        images.push({
          url: absUrl,
          alt: $(el).attr('alt') || '',
          width, height,
        });

        // Max 3 images per article
        if (images.length >= 3) return false;
      });

      if (images.length >= 3) break;
    }

    console.log(`[Scraper] ${domain} → ${text.length} chars, ${images.length} images found`);

    return { text, title, domain, images, error: null };

  } catch (err) {
    console.error('[Scraper] Error:', err.message);
    return { text: '', title: '', domain: '', images: [], error: err.message };
  }
}

module.exports = { scrapeUrl };
