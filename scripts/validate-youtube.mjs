import fs from 'node:fs/promises';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await fs.readFile(path.join(repo, 'source-notes', 'YOUTUBE-LEARNING-MANIFEST.json'), 'utf8'));
const output = path.resolve(repo, '..', '..', 'outputs', 'youtube-validation-report.json');
const normalise = (value) => String(value || '').replace(/\s*\|\s*/g, '|').replace(/\s+/g, ' ').trim();
const results = [];

for (const clip of manifest.clips) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(clip.url)}&format=json`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${clip.videoId}`;
  const [oembedResponse, embedResponse] = await Promise.all([
    fetch(oembedUrl, { redirect: 'follow' }),
    fetch(embedUrl, { redirect: 'follow' }),
  ]);
  const oembed = oembedResponse.ok ? await oembedResponse.json() : {};
  const titleMatch = normalise(oembed.title) === normalise(clip.title);
  const channelMatch = normalise(oembed.author_name) === normalise(clip.channel);
  results.push({
    videoId: clip.videoId,
    title: clip.title,
    oEmbedStatus: oembedResponse.status,
    embedStatus: embedResponse.status,
    returnedTitle: oembed.title || null,
    returnedChannel: oembed.author_name || null,
    titleMatch,
    channelMatch,
    passed: oembedResponse.ok && embedResponse.ok && titleMatch && channelMatch,
  });
}

const report = {
  validatedAt: new Date().toISOString(),
  validation: 'YouTube oEmbed identity and youtube-nocookie embed availability',
  passed: results.every((result) => result.passed),
  clipCount: results.length,
  results,
};
await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.passed) {
  console.error(JSON.stringify(results.filter((result) => !result.passed), null, 2));
  process.exit(1);
}
console.log(`YouTube validation passed: ${results.length} clips matched and all embed fallbacks resolved.`);
