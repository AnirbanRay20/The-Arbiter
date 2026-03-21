const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeUrlContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, footer, aside, header').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text || null;
  } catch (err) {
    console.error(`Error scraping URL ${url}:`, err.message);
    return null;
  }
}

module.exports = { scrapeUrlContent };
