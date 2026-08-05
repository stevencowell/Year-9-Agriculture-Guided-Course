(async () => {
  const host = document.querySelector('#video-grid');
  const dialog = document.querySelector('#video-dialog');
  const player = document.querySelector('#video-player');
  const dialogTitle = document.querySelector('#video-dialog-title');
  const direct = document.querySelector('#video-direct');
  const filter = document.querySelector('#video-filter');
  const escape = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const manifest = await fetch('../source-notes/YOUTUBE-LEARNING-MANIFEST.json').then((response) => {
    if (!response.ok) throw new Error(`Video manifest unavailable (${response.status})`);
    return response.json();
  });
  const render = (query = '') => {
    const term = query.trim().toLowerCase();
    const clips = manifest.clips.filter((clip) => [clip.title,clip.channel,clip.topic,clip.watchFor].join(' ').toLowerCase().includes(term));
    host.innerHTML = clips.length ? clips.map((clip) => `<article class="card video-card" data-video-id="${escape(clip.videoId)}"><button class="video-thumb" type="button" style="background-image:url('https://i.ytimg.com/vi/${encodeURIComponent(clip.videoId)}/hqdefault.jpg')" aria-label="Play ${escape(clip.title)} here"></button><div><p class="eyebrow">${escape(clip.topic)}</p><h2>${escape(clip.title)}</h2><p class="video-meta">${escape(clip.channel)} · checked ${escape(manifest.validationDate)}</p><h3>Watch for</h3><p>${escape(clip.watchFor)}</p><h3>Why this clip is here</h3><p>${escape(clip.rationale)}</p><h3>No video?</h3><p>${escape(clip.fallback)}</p><div class="callout"><strong>Boundary:</strong> ${escape(clip.disclaimer)}</div><div class="video-actions"><button class="btn" type="button" data-play>Play here</button><a class="btn ghost" href="${escape(clip.url)}" target="_blank" rel="noopener">Open in YouTube ↗</a><a class="btn ghost" href="${escape(clip.relatedSourceUrl)}" target="_blank" rel="noopener">Supporting source ↗</a></div></div></article>`).join('') : '<section class="card empty-state"><h2>No matching clip</h2><p>Clear the filter or try a broader project word.</p></section>';
    host.querySelectorAll('[data-play], .video-thumb').forEach((button) => button.addEventListener('click', () => openVideo(button.closest('[data-video-id]').dataset.videoId)));
  };
  const openVideo = (id) => {
    const clip = manifest.clips.find((item) => item.videoId === id);
    if (!clip) return;
    dialogTitle.textContent = clip.title;
    direct.href = clip.url;
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${escape(clip.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    dialog.showModal();
  };
  const closeVideo = () => { player.replaceChildren(); dialog.close(); };
  document.querySelector('#video-close').addEventListener('click', closeVideo);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeVideo(); });
  dialog.addEventListener('close', () => player.replaceChildren());
  filter.addEventListener('input', () => render(filter.value));
  render();
})().catch((error) => { document.querySelector('#video-grid').innerHTML = `<section class="card pending"><h2>Video library unavailable</h2><p>${error.message}</p><p>Use the course modules and authorised Drive lessons while this route is restored.</p></section>`; });
