'use strict';
const $ = s => document.querySelector(s);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  tree:'<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
  cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',
  network:'<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10 8-4 8m8-8 4 8M8 19h8"/>',
  chip:'<path d="m12 2 10 5-10 5L2 7l10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  layers:'<path d="m12 3 10 5-10 5L2 8l10-5ZM2 13l10 5 10-5M2 18l10 5 10-5"/>'
};
const icon = c => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[c.icon] || icons.chip}</svg>`;
const palette = ['#668259','#b28b5e','#72819d','#608b93','#9681a2','#759567','#ba826c'];
let chapters = [], questions = [], currentVisible = [], currentChapter = null, filter = '全部', timer;
let persistent = true;
function readStore(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
const storedCompleted = readStore('interview-completed', []), storedSaved = readStore('interview-saved', []);
let completed = new Set(Array.isArray(storedCompleted) ? storedCompleted : []);
let saved = new Set(Array.isArray(storedSaved) ? storedSaved : []);
let lastRead = readStore('interview-last', null);
function saveStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { persistent = false; toast('浏览器未允许保存，当前进度仅在本次访问有效。'); } }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(timer); timer = setTimeout(() => $('#toast').classList.remove('show'), 2800); }
const link = q => `#read/${q.id}`;
const minutes = qs => Math.max(1, Math.ceil(qs.reduce((n,q) => n + [q.summary,...q.points,q.followup,q.pitfall].join('').length, 0) / 350));
function updateProgress() {
  $('#saved-count').textContent = saved.size;
  $('#progress-count').textContent = `${completed.size} / ${questions.length}`;
  $('#progress-bar').style.width = `${completed.size / questions.length * 100}%`;
}
function row(q, index) {
  const c = chapters.find(c => c.id === q.chapterId);
  return `<a class="question-row" href="${link(q)}"><span class="row-index">${completed.has(q.id) ? '✓' : String(index + 1).padStart(2,'0')}</span><div class="row-text"><h3>${escapeHTML(q.title)}</h3><p>${escapeHTML(c.title)} <span>·</span> ${escapeHTML(q.group)} <span>·</span> ${minutes([q])} 分钟阅读${saved.has(q.id) ? ' · 已收藏' : ''}</p></div><span class="row-tag">${escapeHTML(q.level)}</span><span class="row-arrow" aria-hidden="true">↗</span></a>`;
}
function home() {
  currentVisible = questions; currentChapter = null;
  const next = questions.find(q => q.id === lastRead) || questions.find(q => !completed.has(q.id)) || questions[0];
  const featured = [/RAII/,/进程.*线程/,/三次握手/,/MVCC/,/持久化/,/缓存.*一致性/].map(re => questions.find(q => re.test(q.title))).filter(Boolean);
  return `<section class="hero"><div><span class="eyebrow">A LITTLE EVERY DAY. A LOT OVER TIME.</span><h1>把基础，<em>读成底气。</em></h1><p>从语言到系统，从数据结构到数据库。<br>把零散的面试问题，整理成一本可以慢慢读的手册。</p><div class="hero-note"><span><i></i>七个科目，系统整理</span><span><i></i>每题附回答、追问与易错点</span><span><i></i>支持离线 PDF</span></div></div><div class="hero-visual" aria-hidden="true"><div class="book-illustration"><span>基础</span><small>HANDBOOK / 01</small></div><div class="float-tag">&lt; keep learning /&gt;</div></div></section>
  <section class="stats" aria-label="手册概览"><div class="stat"><strong>07</strong><small>科</small><p>串起计算机知识体系</p></div><div class="stat"><strong>${questions.length}</strong><small>题</small><p>常见高频面试问题</p></div><div class="stat"><strong>${Math.round(minutes(questions)/60 * 10)/10}</strong><small>小时</small><p>预计完整阅读时间</p></div><div class="stat"><strong>${completed.size}</strong><small>题</small><p>已完成学习</p></div></section>
  <section><div class="section-head"><div><h2>从一个科目开始</h2><p>循着目录，建立自己的知识地图。</p></div><span>01 — 07 / KNOWLEDGE MAP</span></div><div class="chapter-grid">${chapters.map((c,i) => `<a class="chapter-card" href="#chapter/${c.id}" style="--accent:${palette[i]}"><div class="card-top"><span class="card-icon">${icon(c)}</span><span class="card-number">${String(i+1).padStart(2,'0')}</span></div><h3>${escapeHTML(c.title)}</h3><span class="subtitle">${escapeHTML(c.subtitle)}</span><p>${escapeHTML(c.description)}</p><div class="card-bottom"><span>${c.sections.length} 道问题 · 已读 ${c.sections.filter(q => completed.has(q.id)).length} 题</span><span class="arrow">↗</span></div></a>`).join('')}</div></section>
  <div class="reading-plan"><div><h3>${lastRead ? '接着上次的思路，继续读下去。' : '不用一次读完。今天，先读懂一个问题。'}</h3><p>${escapeHTML(next.title)} · ${escapeHTML(chapters.find(c => c.id === next.chapterId).title)}</p></div><a class="button" href="${link(next)}">${lastRead ? '继续阅读' : '开始阅读'} →</a></div>
  <section><div class="section-head"><div><h2>先读这些关键问题</h2><p>抓住原理，再应对追问。</p></div><a href="#chapter/cpp">浏览题目 →</a></div><div class="featured-list">${featured.map(row).join('')}</div></section>`;
}
function chapterPage(c) {
  currentChapter = c;
  const subset = c.sections.filter(q => filter === '全部' || (filter === '未读' ? !completed.has(q.id) : q.level === filter));
  currentVisible = subset;
  const groups = [...new Set(subset.map(q => q.group))];
  return `<div class="page-intro"><span class="eyebrow">${escapeHTML(c.subtitle)} / HANDBOOK</span><h1>${escapeHTML(c.title)}</h1><p>${escapeHTML(c.description)}</p><div class="page-meta"><span>${c.sections.length} 道问题</span><span>·</span><span>约 ${minutes(c.sections)} 分钟阅读</span><span>·</span><span>已读 ${c.sections.filter(q => completed.has(q.id)).length} 题</span></div></div><div class="chapter-toolbar"><div class="filter-tabs" aria-label="题目筛选">${['全部','基础','进阶','未读'].map(t => `<button class="filter-tab ${filter === t ? 'active' : ''}" data-filter="${t}" aria-pressed="${filter===t}">${t}</button>`).join('')}</div><a class="button" href="pdf/${c.id}.pdf" download>↓ 本科目 PDF</a></div>${subset.length ? groups.map(g => `<section class="question-group"><h2>${escapeHTML(g)}</h2><div class="featured-list">${subset.filter(q => q.group===g).map(q => row(q,c.sections.indexOf(q))).join('')}</div></section>`).join('') : empty('这一组已经读完了','换个筛选条件，继续看看其他问题。')}`;
}
function article(q) {
  const c = chapters.find(c => c.id === q.chapterId), n = c.sections.indexOf(q);
  currentChapter = c; currentVisible = [q]; lastRead = q.id; saveStore('interview-last',q.id);
  return `<div class="read-layout"><div><article class="reader"><div class="reader-top"><span class="eyebrow">${escapeHTML(c.title)} / ${String(n+1).padStart(2,'0')} · ${escapeHTML(q.level)}</span><div class="reader-actions"><button class="bookmark-button" data-bookmark="${q.id}" aria-label="${saved.has(q.id) ? '取消收藏' : '收藏这道题'}" aria-pressed="${saved.has(q.id)}">${saved.has(q.id) ? '★' : '☆'}</button><button class="icon-button" id="article-print" aria-label="打印或另存本题 PDF" title="打印本题" style="font-size:18px">↓</button></div></div><h1>${escapeHTML(q.title)}</h1><div class="answer-summary"><strong>先给出你的核心回答</strong>${escapeHTML(q.summary)}</div><h2>回答要点</h2><ol>${q.points.map(p => `<li>${escapeHTML(p)}</li>`).join('')}</ol>${q.code ? `<pre><code>${escapeHTML(q.code)}</code></pre>` : ''}<h2>面试官可能继续问</h2><div class="followup">${escapeHTML(q.followup)}</div><h2>别掉进这个误区</h2><div class="pitfall">${escapeHTML(q.pitfall)}</div><div class="reader-source"><p>延伸阅读 · 以下原始资料支持本题原理，题解为独立中文整理。</p>${q.sources.map(s => `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)} ↗</a>`).join('')}</div><div class="reader-bottom"><button class="check-button ${completed.has(q.id) ? 'is-read' : ''}" data-complete="${q.id}" aria-pressed="${completed.has(q.id)}">${completed.has(q.id) ? '✓ 已学会 · 点击撤销' : '✓ 标记为已学会'}</button><span class="read-time">约 ${minutes([q])} 分钟阅读 · 试着用自己的话复述</span></div></article><nav class="reader-pager" aria-label="上一题和下一题">${n>0 ? `<a href="${link(c.sections[n-1])}">← 上一题<br>${escapeHTML(c.sections[n-1].title)}</a>` : ''}${n<c.sections.length-1 ? `<a href="${link(c.sections[n+1])}">下一题 →<br>${escapeHTML(c.sections[n+1].title)}</a>` : `<a href="#chapter/${c.id}">已到本章最后一题 →<br>回到科目目录</a>`}</nav></div><aside class="toc" aria-label="本章目录"><div class="toc-heading">本章目录 / ${c.sections.length} 题</div>${c.sections.map((s,i) => `${i===0 || s.group!==c.sections[i-1].group ? `<div class="toc-group">${escapeHTML(s.group)}</div>` : ''}<a href="${link(s)}" class="${s.id===q.id ? 'active' : ''}" ${s.id===q.id ? 'aria-current="page"' : ''}>${completed.has(s.id) ? '✓' : String(i+1).padStart(2,'0')} ${escapeHTML(s.title)}</a>`).join('')}<small>答案只是起点。<br>把原理讲清楚，比背下来更有用。</small></aside></div>`;
}
function empty(title, description) { return `<div class="empty-state"><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p><a class="button" href="#home">回到学习总览 →</a></div>`; }
function listPage(mode, query='') {
  currentChapter = null;
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  currentVisible = mode === 'saved' ? questions.filter(q => saved.has(q.id)) : questions.filter(q => terms.every(term => `${q.title} ${q.group} ${q.summary} ${q.points.join(' ')} ${q.followup} ${q.pitfall} ${q.code || ''} ${chapters.find(c=>c.id===q.chapterId).title}`.toLocaleLowerCase().includes(term)));
  return `<div class="page-intro"><span class="eyebrow">${mode==='saved' ? 'YOUR PERSONAL COLLECTION' : 'FIND THE ANSWER'}</span><h1>${mode==='saved' ? '我的收藏' : '搜索结果'}</h1><p>${mode==='saved' ? '把想再读一遍的问题，留在这里。收藏仅保存在当前浏览器。' : `“${escapeHTML(query)}” · 找到 ${currentVisible.length} 道相关问题。多个关键词使用空格分隔。`}</p></div><div class="chapter-toolbar"><span class="notice">${currentVisible.length} 道问题${mode==='saved' ? ' · 阅读题目时点击 ☆ 即可收藏' : ' · 搜索覆盖题目与完整答案'}</span>${currentVisible.length ? '<button class="button" id="list-print">↓ 另存列表为 PDF</button>' : ''}</div>${currentVisible.length ? `<div class="featured-list">${currentVisible.map(row).join('')}</div>` : empty(mode==='saved'?'还没有收藏的问题':'没有找到相关问题',mode==='saved'?'打开任意题目，点击右上角的星星收藏。':'试试“TCP”“事务”“内存”或换一个更短的关键词。')}`;
}
function sourcesPage() {
  currentVisible = questions; currentChapter = null;
  return `<div class="page-intro"><span class="eyebrow">READ WITH CONTEXT</span><h1>有依据，也有边界。</h1><p>本手册是七科常见高频面试问题的独立中文整理，帮助理解与复述。</p></div><div class="sources-intro">覆盖 ${questions.length} 道核心问题，每题包含回答要点、一个带答案的追问和易错点。它不是对全网所有公司面经的穷举；“高频”指经典面试知识点，未使用真实招聘频次统计。<br>C++ 以 C++17/20 核心能力为主；MySQL 以 8.4 LTS 的 InnoDB 为主；Redis 以开源版常用功能为主，涉及版本差异时以题解和对应官方文档为准。计算机网络与组成原理区分协议规定和常见实现。</div><p class="notice">整理日期：2026-10-09。题解为原创总结，参考资料用于核查与延伸阅读，具体实现和新版本行为请查对应文档。估计阅读时长按每分钟约 350 字计算，不包含实践时间。</p>${chapters.map(c => { const refs = [...new Map(c.sections.flatMap(q=>q.sources).map(s=>[s.url,s])).values()]; return `<section class="source-chapter"><h2>${escapeHTML(c.title)}</h2><small>${refs.length} 项参考资料 · 题目内提供对应链接</small>${refs.map(s=>`<a target="_blank" rel="noopener noreferrer" href="${escapeHTML(s.url)}">${escapeHTML(s.title)} ↗</a>`).join('')}</section>`; }).join('')}<section class="source-chapter"><h2>你的阅读记录</h2><p class="notice">收藏、已学会题目和上次阅读位置通过浏览器本地存储保存，不上传到本手册的服务器，也不会跨浏览器同步。清理网站数据会删除记录；禁用本地存储时可继续阅读，但记录可能无法保存。重置学习进度只清空已学会标记，保留收藏。</p><h2>PDF 导出说明</h2><p class="notice">“导出 PDF”可直接下载整本或单科 PDF，含中文字体、目录、题解与可点击的参考链接。“打印当前阅读内容”使用浏览器原生打印，可另存单题、搜索结果、收藏或当前科目的 PDF。打印设置建议使用 A4、100% 缩放并关闭浏览器页眉页脚。</p></section>`;
}
function render(scroll=true) {
  let parts; try { parts = decodeURIComponent(location.hash.slice(1) || 'home').split('/'); } catch { parts=['home']; }
  const [route,id] = parts; let title = '学习总览', html;
  $('#search').value = route==='search' ? parts.slice(1).join('/') : '';
  if(route==='chapter') { const c=chapters.find(c=>c.id===id); if(c){title=c.title;html=chapterPage(c);} }
  else if(route==='read') { const q=questions.find(q=>q.id===id); if(q){title=chapters.find(c=>c.id===q.chapterId).title;html=article(q);} }
  else if(route==='saved') {title='我的收藏';html=listPage('saved');}
  else if(route==='search') {title='搜索';html=listPage('search',parts.slice(1).join('/'));}
  else if(route==='sources') {title='参考来源';html=sourcesPage();}
  else if(route==='home') html=home();
  if(!html) { currentVisible=[]; currentChapter=null; html=empty('这个阅读位置不存在','可以从学习总览或科目目录重新开始。');title='未找到题目'; }
  $('#main').innerHTML=html; $('#breadcrumb').innerHTML=`阅读空间 <span>/</span> ${escapeHTML(title)}`;
  document.title=`${title} · 面试手册`;
  document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(currentChapter?.id || route); a.classList.toggle('active',active); if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');});
  updateProgress(); $('#sidebar').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded','false');
  if(scroll) window.scrollTo({top:0,behavior:'instant'});
}
function exportDialog() {
  $('#export-scope').innerHTML=`<option value="all">整本手册 · ${questions.length} 题</option>${chapters.map(c=>`<option value="${c.id}">${escapeHTML(c.title)} · ${c.sections.length} 题</option>`).join('')}`;
  $('#export-scope').value=currentChapter?.id || 'all'; updateDownload(); $('#print-selection').disabled=!currentVisible.length;
  $('#export-dialog').showModal();
}
function updateDownload() { const scope=$('#export-scope').value;$('#download-pdf').href=`pdf/${scope}.pdf`;$('#download-pdf').download=`面试手册-${scope==='all'?'完整版':chapters.find(c=>c.id===scope).title}.pdf`; }
function printCurrent() {
  if(!currentVisible.length){toast('当前没有可打印的题目。');return;}
  const included=chapters.map(c=>({...c,sections:currentVisible.filter(q=>q.chapterId===c.id)})).filter(c=>c.sections.length);
  const title=currentVisible.length===1 ? currentVisible[0].title : currentChapter ? currentChapter.title : location.hash.startsWith('#saved') ? '我的收藏' : location.hash.startsWith('#search') ? '搜索结果' : '完整手册';
  $('#print-root').innerHTML=`<section class="print-cover"><p>THE INTERVIEW HANDBOOK</p><h1>面试手册</h1><h2>${escapeHTML(title)}</h2><p>${currentVisible.length} 道问题 · 整理于 2026-10-09<br>经典知识点汇总，非全网面经穷举。<br>回答要点 / 常见追问 / 易错点 / 参考来源</p><div class="print-toc">${included.map(c=>`${escapeHTML(c.title)} · ${c.sections.length} 题`).join('<br>')}</div></section>${included.map(c=>`<section class="print-chapter"><h1>${escapeHTML(c.title)}</h1>${c.sections.map(q=>`<article class="print-question"><h2>${escapeHTML(q.title)}</h2><p class="print-summary">${escapeHTML(q.summary)}</p><h3>回答要点</h3><ol>${q.points.map(p=>`<li>${escapeHTML(p)}</li>`).join('')}</ol>${q.code?`<pre>${escapeHTML(q.code)}</pre>`:''}<h3>常见追问</h3><p>${escapeHTML(q.followup)}</p><h3>易错点</h3><p>${escapeHTML(q.pitfall)}</p><p class="print-source">参考资料：${q.sources.map(s=>`<a href="${escapeHTML(s.url)}">${escapeHTML(s.title)}</a>`).join(' / ')}</p></article>`).join('')}</section>`).join('')}`;
  if($('#export-dialog').open)$('#export-dialog').close();
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));
}
async function init() {
  $('#main').innerHTML='<div class="loading" role="status">正在打开你的面试手册…</div>';
  try {
    const files=await Promise.all(['content-cpp-ds.json','content-systems.json','content-databases.json'].map(async name=>{const response=await fetch(name);if(!response.ok)throw Error(`${name}: ${response.status}`);return response.json();}));
    chapters=files.flat(); const order=['cpp','ds','os','network','architecture','mysql','redis']; chapters.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
    chapters.forEach(c=>c.sections.forEach(q=>q.chapterId=c.id)); questions=chapters.flatMap(c=>c.sections);
    completed=new Set([...completed].filter(id=>questions.some(q=>q.id===id)));saved=new Set([...saved].filter(id=>questions.some(q=>q.id===id)));
    $('#chapter-nav').innerHTML=chapters.map(c=>`<a class="nav-item" href="#chapter/${c.id}" data-nav="${c.id}"><span class="nav-icon">${icon(c)}</span>${escapeHTML(c.title)}<span class="nav-count">${c.sections.length}</span></a>`).join('');
    render();
    $('.skip').addEventListener('click',event=>{event.preventDefault();$('#main').focus();});
    window.addEventListener('hashchange',()=>{filter='全部';render();});
    $('#main').addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b)return;
      if(b.dataset.filter){filter=b.dataset.filter;render(false);}
      if(b.dataset.bookmark){const id=b.dataset.bookmark;if(saved.has(id))saved.delete(id);else saved.add(id);saveStore('interview-saved',[...saved]);render(false);toast(saved.has(id)?'已加入收藏':'已取消收藏');}
      if(b.dataset.complete){const id=b.dataset.complete;if(completed.has(id))completed.delete(id);else completed.add(id);saveStore('interview-completed',[...completed]);render(false);if(persistent)toast(completed.has(id)?'又掌握一个知识点。':'已撤销学习标记');}
      if(['article-print','list-print'].includes(b.id))printCurrent();
    });
    $('#export-open').addEventListener('click',exportDialog);$('#export-scope').addEventListener('change',updateDownload);$('#print-selection').addEventListener('click',printCurrent);
    $('#search-form').addEventListener('submit',event=>{event.preventDefault();const query=$('#search').value.trim();location.hash=query?`search/${encodeURIComponent(query)}`:'home';});
    let searchTimer;$('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const query=$('#search').value.trim();if(query)location.hash=`search/${encodeURIComponent(query)}`;else if(location.hash.startsWith('#search'))location.hash='home';},220);});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#export-dialog').open){event.preventDefault();$('#search').focus();}if(event.key==='Escape'){$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
    $('#menu-toggle').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',event=>{if(!event.target.closest('#sidebar,#menu-toggle')&&$('#sidebar').classList.contains('open')){$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
    $('#reset-progress').addEventListener('click',()=>{if(!completed.size){toast('还没有需要重置的学习进度。');return;}if(window.confirm('清空所有“已学会”标记？收藏会保留。')){completed.clear();saveStore('interview-completed',[]);render(false);toast('学习进度已重置，收藏已保留。');}});
    window.addEventListener('afterprint',()=>{$('#print-root').innerHTML='';});
  } catch(error) {console.error(error);$('#main').innerHTML='<div class="empty-state"><h2>手册暂时没有打开</h2><p>请通过网站地址访问，检查网络后重试。</p><button class="button" onclick="location.reload()">重新加载</button></div>';}
}
init();
