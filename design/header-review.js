// Pending review copy only; published result data is unchanged.
DESIGN.cards.find(card => card.code === 'BG').os = '「我没说话，但这桌饭已经在脑子里剪成连续剧了。」';
// Visual review rendering only. Product interactions follow design approval.
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const question = DESIGN.questions[0];
document.querySelector('#q-title').textContent = question.title;
document.querySelector('#options').innerHTML = question.options.map((option, index) => `
  <div class="option ${index === 0 ? 'selected' : ''}">
    <span class="letter">${option.letter}</span><span class="option-copy">${escapeHtml(option.text)}</span>
    ${index === 0 ? '<b class="check">✓</b>' : ''}
  </div>`).join('');
document.querySelector('#home-tags').innerHTML = DESIGN.homeTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');

const themeFor = (card) => ({ A1: 'blue', A2: 'yellow', A3: 'green' })[card.key.slice(0, 2)];
const nameLine = (card) => `<h2 class="personality-name"><span>${escapeHtml(card.name)}</span><span class="name-divider">·</span><small>${card.code}</small></h2>`;
const title = (card) => `
  <div class="result-title">
    
    ${nameLine(card)}
    <p>${escapeHtml(card.dimensions)}</p>
  </div>`;
const tips = (card, className = 'tips') => `
  <section class="${className}"><h3>好友使用说明</h3>
    ${card.tips.map((tip, index) => `<p><span>0${index + 1}</span><span>${escapeHtml(tip)}</span></p>`).join('')}
  </section>`;
const metrics = (fixture) => ['社交电量', '计划力', '直球度'].map((label, index) => `
  <div class="metric"><div><span>${label}</span><b>${fixture.bars[index]}<small>%</small></b></div>
    <div class="track"><i style="width:${fixture.bars[index]}%"></i></div>
  </div>`).join('');

function renderCard(key) {
  const card = DESIGN.cards.find((entry) => entry.key === key);
  const fixture = DESIGN.fixtures[key];
  const number = String(DESIGN.cards.indexOf(card) + 1).padStart(2, '0');
  const result = document.querySelector('#result-screen');
  result.className = `screen result ${themeFor(card)}`;
  result.innerHTML = `
    <div class="appbar"><b><svg class="manual-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15"/><path d="M5 8h4M5 12h4M15 8h4M15 12h4"/></svg> 我的社交人格是：</b></div>
    ${title(card)}
    <blockquote class="result-quote">${escapeHtml(card.os)}</blockquote>
    <div class="character"><img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}角色主视觉"></div>
    <div class="result-body">
      <p class="description">${escapeHtml(card.description)}</p>
      <div class="metrics">${metrics(fixture)}</div>
      ${tips(card)}
      <div class="status"><span class="dot"></span>${escapeHtml(card.footer)}</div>
      <section class="self-tips"><h3>给自己的 Tips</h3><p>${escapeHtml(card.selfTips)}</p></section>
    </div>
    <div class="result-actions">
      <button class="primary">分享我的说明书 <span>↗</span></button>
      <button class="secondary">复制说明书链接</button>
      <button class="text-button">重新测试</button>
      <p class="fine">娱乐向自我观察。</p>
    </div>`;

  const poster = document.querySelector('#poster');
  poster.className = `poster ${themeFor(card)}`;
  poster.innerHTML = `
    <div class="poster-brand"><svg class="manual-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15"/><path d="M5 8h4M5 12h4M15 8h4M15 12h4"/></svg> 我的社交人格是： <span>你的呢？</span></div>
    <div class="poster-title">${nameLine(card)}</div>
    <div class="poster-main">
      <blockquote>${escapeHtml(card.os)}</blockquote>
      <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}角色主视觉">
    </div>
    <p class="poster-description">${escapeHtml(card.description.replace(/\n/g, ''))}</p>
    ${tips(card, 'poster-tips')}
    <div class="poster-footer">
      <div><b>扫一下，生成你的说明书</b><small>约我之前，建议先读一下。</small></div>
      <div class="qr-placeholder">二维码<small>正式版生成</small></div>
    </div>`;
  document.querySelector('#fixture-note').textContent = `当前结果页使用固定答案示例：${card.name} · ${card.code}，A = ${fixture.scores[0]} / B = ${fixture.scores[1]} / C = ${fixture.scores[2]} → ${fixture.bars.join('% / ')}%。`;
}

const selector = document.querySelector('#card-select');
selector.innerHTML = DESIGN.cards.map((card, index) => `<option value="${card.key}">${String(index + 1).padStart(2, '0')} ${escapeHtml(card.name)} · ${card.code}</option>`).join('');
selector.value = 'A1-B2-C2';
selector.addEventListener('change', () => renderCard(selector.value));
renderCard(selector.value);

document.querySelector('#theme-grid').innerHTML = [1, 8, 13].map((index) => {
  const card = DESIGN.cards[index];
  return `<article class="theme-card ${themeFor(card)}">
    <div class="theme-color"><span></span><span></span><span></span></div>
    ${title(card)}<blockquote class="result-quote">${escapeHtml(card.os)}</blockquote>
    <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}">
    <div class="status">${escapeHtml(card.footer)}</div>
  </article>`;
}).join('');

const questionSelector=document.querySelector('#question-select');
questionSelector.innerHTML=DESIGN.questions.map((q,i)=>`<option value="${i}">第 ${i+1} 题</option>`).join('');
questionSelector.addEventListener('change',()=>{
 const q=DESIGN.questions[Number(questionSelector.value)];
 document.querySelector('#q-title').textContent=q.title;
 document.querySelector('#options').innerHTML=q.options.map(o=>`<div class="option"><span class="letter">${o.letter}</span><span class="option-copy">${escapeHtml(o.text)}</span></div>`).join('');
 document.querySelector('#question .art-title').innerHTML=`02 / 答题页 <span>Q${q.id} · 更新文案预览</span>`;
});
