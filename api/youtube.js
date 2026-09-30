const YOUTUBE_HANDLE = '@SHAZ_playz';

function extractChannelId(html) {
  const patterns = [
    /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]{20,})["']/i,
    /["']channelId["']\s*:\s*["'](UC[a-zA-Z0-9_-]{20,})["']/i,
    /["']externalId["']\s*:\s*["'](UC[a-zA-Z0-9_-]{20,})["']/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function decodeXml(value='') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function tag(entry, name) {
  const re = new RegExp(`<${name}[^>]*>([\s\S]*?)</${name}>`, 'i');
  const match = entry.match(re);
  return match ? decodeXml(match[1].trim()) : '';
}

export default async function handler(req, res) {
  try {
    const page = await fetch(`https://www.youtube.com/${YOUTUBE_HANDLE}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36' }
    });
    if (!page.ok) throw new Error(`YouTube channel page returned ${page.status}`);
    const html = await page.text();
    const channelId = extractChannelId(html);
    if (!channelId) throw new Error('Could not resolve the YouTube channel ID');

    const feed = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!feed.ok) throw new Error(`YouTube RSS returned ${feed.status}`);
    const xml = await feed.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0, 3);

    const items = entries.map(m => {
      const entry = m[1];
      const videoId = tag(entry, 'yt:videoId');
      const title = tag(entry, 'title');
      const published = tag(entry, 'published');
      const thumbnailMatch = entry.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
      const thumbnail = thumbnailMatch ? decodeXml(thumbnailMatch[1]) : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      return {
        videoId,
        title,
        published,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    }).filter(item => item.videoId && item.title);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ channelId, items });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Unable to load YouTube videos right now.' });
  }
}
