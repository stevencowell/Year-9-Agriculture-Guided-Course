(() => {
  const activities = window.BUSY_WORK_DATA || [];
  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const stateKey = (id) => `year-9-agriculture:busy-work:${id}:v1`;
  const readState = (id) => { try { return JSON.parse(localStorage.getItem(stateKey(id)) || '{}'); } catch { return {}; } };
  const writeState = (id, state) => localStorage.setItem(stateKey(id), JSON.stringify(state));

  const grid = document.querySelector('#activity-grid');
  if (grid) {
    const filter = document.querySelector('#activity-filter');
    const render = () => {
      const term = filter.value.trim().toLowerCase();
      const visible = activities.filter((activity) => [activity.title,activity.summary,activity.mechanic,`term ${activity.term}`].join(' ').toLowerCase().includes(term));
      grid.innerHTML = visible.map((activity) => {
        const checked = Object.values(readState(activity.id).checked || {}).filter(Boolean).length;
        return `<article class="card busy-card"><p class="mechanic">Term ${activity.term} · ${esc(activity.mechanic)}</p><h2>${esc(activity.title)}</h2><p>${esc(activity.summary)}</p><p class="save-state">${checked} of ${activity.tasks.length} tasks checked on this device</p><a class="module-link" href="activity.html?id=${encodeURIComponent(activity.id)}">Open activity →</a></article>`;
      }).join('') || '<section class="card"><h2>No matching activity</h2><p>Clear the filter or use a broader topic word.</p></section>';
      const total = activities.reduce((sum, activity) => sum + Object.values(readState(activity.id).checked || {}).filter(Boolean).length, 0);
      document.querySelector('#library-progress').textContent = `${total} of ${activities.reduce((sum,activity)=>sum+activity.tasks.length,0)} tasks checked on this browser and device.`;
    };
    filter.addEventListener('input', render);
    render();
  }

  const host = document.querySelector('#task-host');
  if (!host) return;
  const activity = activities.find((item) => item.id === new URLSearchParams(location.search).get('id'));
  if (!activity) { host.innerHTML = '<section class="card pending"><h2>Activity not found</h2><a href="index.html">Return to Busy Work</a></section>'; return; }
  document.title = `${activity.title} | Year 9 Agriculture`;
  document.querySelector('#activity-title').textContent = activity.title;
  document.querySelector('#activity-summary').textContent = activity.summary;
  document.querySelector('#activity-kicker').textContent = `Term ${activity.term} · ${activity.mechanic}`;
  const state = readState(activity.id);
  state.responses ||= {};
  state.checked ||= {};

  const taskHtml = (task, index) => {
    const name = `task-${index}`;
    if (task.type === 'choice') return `<section class="card task-card" data-task="${index}"><fieldset><legend>${index+1}. ${esc(task.prompt)}</legend>${task.options.map((option,optionIndex)=>`<label class="option"><input type="radio" name="${name}" value="${optionIndex}" ${String(state.responses[name])===String(optionIndex)?'checked':''}> ${esc(option)}</label>`).join('')}</fieldset><div class="task-actions"><button class="btn" type="button" data-check>Check response</button></div><div class="task-feedback" aria-live="polite"></div></section>`;
    if (task.type === 'text') return `<section class="card task-card" data-task="${index}"><label>${index+1}. ${esc(task.prompt)}<textarea name="${name}" data-response placeholder="Write a complete response…">${esc(state.responses[name]||'')}</textarea></label><div class="task-actions"><button class="btn" type="button" data-check>Check response</button><button class="btn ghost" type="button" data-example>Appropriate response example</button></div><div class="model-feedback"><strong>Appropriate response example:</strong> ${esc(task.example)}</div><div class="task-feedback" aria-live="polite"></div></section>`;
    if (task.type === 'match') return `<section class="card task-card" data-task="${index}"><fieldset><legend>${index+1}. ${esc(task.prompt)}</legend>${task.pairs.map(([left],row)=>`<label class="match-row"><span>${esc(left)}</span><select name="${name}-${row}"><option value="">Choose…</option>${task.pairs.map(([,right])=>`<option value="${esc(right)}" ${state.responses[`${name}-${row}`]===right?'selected':''}>${esc(right)}</option>`).join('')}</select></label>`).join('')}</fieldset><div class="task-actions"><button class="btn" type="button" data-check>Check response</button></div><div class="task-feedback" aria-live="polite"></div></section>`;
    if (task.type === 'sequence') return `<section class="card task-card" data-task="${index}"><fieldset><legend>${index+1}. ${esc(task.prompt)}</legend>${task.answer.map((_,row)=>`<label class="sequence-row"><span>Position ${row+1}</span><select name="${name}-${row}"><option value="">Choose…</option>${task.items.map(item=>`<option value="${esc(item)}" ${state.responses[`${name}-${row}`]===item?'selected':''}>${esc(item)}</option>`).join('')}</select></label>`).join('')}</fieldset><div class="task-actions"><button class="btn" type="button" data-check>Check response</button></div><div class="task-feedback" aria-live="polite"></div></section>`;
    return '';
  };
  host.innerHTML = activity.tasks.map(taskHtml).join('');

  const collect = () => {
    host.querySelectorAll('input,textarea,select').forEach((field) => {
      if (field.type === 'radio') { if (field.checked) state.responses[field.name] = field.value; }
      else state.responses[field.name] = field.value;
    });
    writeState(activity.id,state);
    document.querySelector('#save-state').textContent = `Saved on this device at ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Not submitted.`;
    updateProgress();
  };
  const updateProgress = () => {
    const count = Object.values(state.checked).filter(Boolean).length;
    document.querySelector('#activity-progress').textContent = `${count} of ${activity.tasks.length} tasks checked`;
    document.querySelector('#activity-progress-fill').style.width = `${Math.round(count/activity.tasks.length*100)}%`;
  };
  host.addEventListener('input', collect);
  host.addEventListener('change', collect);
  host.querySelectorAll('[data-task]').forEach((card,index) => {
    const task = activity.tasks[index];
    card.querySelector('[data-check]').addEventListener('click', () => {
      collect();
      const feedback = card.querySelector('.task-feedback');
      let correct = false;
      if (task.type === 'choice') correct = Number(state.responses[`task-${index}`]) === task.answer;
      if (task.type === 'text') correct = task.keywords.some((keyword) => String(state.responses[`task-${index}`]||'').toLowerCase().includes(keyword.toLowerCase())) && String(state.responses[`task-${index}`]||'').trim().length >= 25;
      if (task.type === 'match') correct = task.pairs.every(([,right],row) => state.responses[`task-${index}-${row}`] === right);
      if (task.type === 'sequence') correct = task.answer.every((answer,row) => state.responses[`task-${index}-${row}`] === answer);
      state.checked[index] = correct;
      writeState(activity.id,state);
      feedback.className = `task-feedback ${correct?'good':'bad'}`;
      feedback.textContent = correct ? (task.feedback || 'Complete. Your response follows the taught evidence pathway.') : (task.type === 'text' ? 'Develop the response with a clear evidence link, then check again.' : 'Not yet. Revisit the activity prompt and check every selection.');
      updateProgress();
    });
    card.querySelector('[data-example]')?.addEventListener('click', (event) => {
      const panel = card.querySelector('.model-feedback');
      panel.classList.toggle('open');
      event.currentTarget.setAttribute('aria-expanded', String(panel.classList.contains('open')));
    });
  });
  updateProgress();
})();
