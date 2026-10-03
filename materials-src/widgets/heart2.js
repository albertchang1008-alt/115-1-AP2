// 教學互動不持有 SDK，只有「看相關節點」沿用既有閱讀入口。
const Heart2 = (() => {
  const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (id,label) => `<button type="button" data-factor="${e(id)}" aria-pressed="false" aria-describedby="factor-explain">${e(label)}<span class="factor-direction"></span></button>`;
  function tree(data) {
    return `<section class="factor-tree supplemental" aria-labelledby="factor-title"><h2 id="factor-title">${e(data.title)}</h2><div class="factor-controls"><button data-factor-change="1" aria-pressed="true">這個因素增加 ↑</button><button data-factor-change="-1" aria-pressed="false">這個因素減少 ↓</button><button data-factor-reset>重設</button></div><div class="factor-root">${button('root',data.root)}</div><div class="factor-branches">${data.branches.map(b=>`<div class="factor-branch" data-branch="${e(b.id)}"><p class="tree-edge">↓ 影響根的方向：${b.sign===-1?'−':'＋'}</p>${button(b.id,b.label)}<div class="factor-leaves">${b.children.map(c=>`<div><span class="tree-edge">↑ ${c.sign===-1?'−':'＋'}</span>${button(c.id,c.label)}</div>`).join('')}</div></div>`).join('')}</div>${(data.specials||[]).map(s=>`<div class="factor-special">${button(s.id,s.label)}<span>HR 心率↑ ⋯→ SV 心搏量↓</span></div>`).join('')}<p id="factor-explain" aria-live="polite">點選因素，沿箭頭看變化如何傳到${e(data.root)}。</p><button data-factor-node hidden>看相關節點</button></section>`;
  }
  function mountTree(root,data,reveal) {
    let selected=null,change=1;
    const leaves=data.branches.flatMap(b=>b.children.map(c=>({...c,branch:b}))),specials=data.specials||[];
    const render=()=>{
      root.querySelectorAll('[data-factor]').forEach(b=>{
        const id=b.dataset.factor,active=selected&&(id===selected.id||id===selected.branch?.id||id==='root'||selected.special&&['hr','sv'].includes(id));
        b.classList.toggle('factor-active',!!active);b.classList.toggle('factor-dim',!!selected&&!active);
        b.setAttribute('aria-pressed',String(!!active));b.querySelector('.factor-direction').textContent='';
      });
      root.querySelectorAll('[data-branch]').forEach(b=>{b.classList.toggle('branch-active',!!selected&&(selected.special||b.dataset.branch===selected.branch?.id));});
      root.querySelectorAll('[data-factor-change]').forEach(b=>{b.setAttribute('aria-pressed',String(+b.dataset.factorChange===change));b.disabled=!!selected?.special});
      const link=root.querySelector('[data-factor-node]');link.hidden=!selected;
      if(!selected){root.querySelector('#factor-explain').textContent=`點選因素，沿箭頭看變化如何傳到${data.root}。`;return;}
      const mark=(id,dir)=>root.querySelector(`[data-factor="${id}"] .factor-direction`).textContent=' '+dir;
      if(selected.special){mark(selected.id,'↑');mark('root','不一定↑');root.querySelector('#factor-explain').textContent=selected.explainUp;}
      else {
        const branch=change*selected.sign,net=branch*(selected.branch.sign??1),arrow=n=>n>0?'↑ 增加':'↓ 減少';
        mark(selected.id,arrow(change));mark(selected.branch.id,arrow(branch));mark('root',arrow(net));
        root.querySelector('#factor-explain').textContent=`${selected.label}${arrow(change)} → ${selected.branch.label}${arrow(branch)} → ${data.root}${arrow(net)}。${change===1?selected.explainUp:selected.explainDown}`;
      }
    };
    root.addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-factor-reset')){selected=null;change=1;}
      else if(b.hasAttribute('data-factor-change'))change=+b.dataset.factorChange;
      else if(b.hasAttribute('data-factor-node')){reveal(selected.nodeId);return;}
      else if(b.hasAttribute('data-factor')){const id=b.dataset.factor;selected=leaves.find(c=>c.id===id)||specials.find(c=>c.id===id)&&{...specials.find(c=>c.id===id),special:true}||null;}
      render();
    });render();
  }
  const cuff={
    html:()=>`<div class="bp-cuff"><label for="cuff-pressure">壓脈帶壓力：<output id="cuff-value">150</output> mmHg（示意數值 120／80）</label><input id="cuff-pressure" type="range" min="60" max="160" value="150" step="1" aria-describedby="cuff-sound"><div class="cuff-controls"><button data-cuff-play aria-pressed="false">自動放氣</button><button data-cuff-reset>重設 150</button></div><svg viewBox="0 0 400 300" role="img" aria-label="動脈壓與壓脈帶壓力的時間圖"><g fill="#17212b" font-size="18"><text x="12" y="24">mmHg</text><text x="315" y="285">時間 →</text><text x="6" y="112">120</text><text x="12" y="200">80</text><text x="65" y="250">120：第一聲＝收縮壓</text><text x="65" y="275">80：聲音消失＝舒張壓</text></g><path d="M55 40V220H385" stroke="#64748b" fill="none"/><path d="M55 195L70 105Q87 135 108 195L123 105Q140 135 161 195L176 105Q193 135 214 195L229 105Q246 135 267 195L282 105Q299 135 320 195L335 105Q352 135 373 195" stroke="#8250a0" stroke-width="3" fill="none"/><path class="cuff-line" d="M55 40H385" stroke="#5d327a" stroke-width="4" stroke-dasharray="8 5"/><g class="cuff-notes" fill="#8250a0" font-size="24"><text x="65" y="90">♪</text><text x="171" y="90">♪</text><text x="277" y="90">♪</text></g></svg><svg class="cuff-section" viewBox="0 0 400 140" role="img" aria-label="壓脈帶下的肱動脈剖面"><rect x="155" y="10" width="90" height="115" rx="15" fill="#eee6f5" stroke="#8250a0"/><path class="cuff-lumen" fill="#fde8e8" stroke="#a71930" stroke-width="4"/><path class="cuff-flow" fill="none" stroke="#a71930" stroke-width="4"/><text x="12" y="135" font-size="18">肱動脈：紅色箭頭表示流動 →</text></svg><p id="cuff-sound" aria-live="polite"></p></div>`,
    mount(root){root=root.querySelector('.bp-cuff');let timer=null;const slider=root.querySelector('input'),play=root.querySelector('[data-cuff-play]');
      const stop=()=>{clearInterval(timer);timer=null;play.textContent='自動放氣';play.setAttribute('aria-pressed','false');};
      const update=()=>{const p=+slider.value,closed=p>120,turbulent=p>80&&!closed;root.dataset.phase=closed?'closed':turbulent?'turbulent':'open';root.querySelector('output').textContent=p;root.querySelector('.cuff-line').setAttribute('d',`M55 ${195-(p-80)*2.25}H385`);root.querySelector('.cuff-notes').style.display=turbulent?'':'none';root.querySelector('.cuff-lumen').setAttribute('d',closed?'M15 40H155L200 67L245 40H385V95H245L200 68L155 95H15Z':turbulent?'M15 40H155L190 60H210L245 40H385V95H245L210 78H190L155 95H15Z':'M15 40H385V95H15Z');root.querySelector('.cuff-flow').setAttribute('d',closed?'':turbulent?'M25 68H165q15-20 25 0t25 0t25 0H355l-12-8m12 8-12 8':'M25 68H355l-12-8m12 8-12 8');root.querySelector('#cuff-sound').textContent=closed?'無聲：壓脈帶高於收縮壓，動脈壓閉。':turbulent?'♪ 柯氏音（斷續）：收縮期血液衝過受壓動脈，形成亂流。':'聲音消失：壓脈帶 ≤80 mmHg，血液平順通過。';};
      slider.addEventListener('input',()=>{stop();update();});play.addEventListener('click',()=>{if(timer)return stop();if(+slider.value<=60)slider.value=150;play.textContent='暫停放氣';play.setAttribute('aria-pressed','true');timer=setInterval(()=>{slider.value=Math.max(60,+slider.value-1);update();if(+slider.value===60)stop();},1000/3);});root.querySelector('[data-cuff-reset]').addEventListener('click',()=>{stop();slider.value=150;update();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);update();
    }
  };
  function misconceptions(rows){return `<section class="misconceptions supplemental"><h2>常見誤解</h2>${rows.map(r=>`<div class="misconception"><p><strong>✗ ${e(r.wrong)}</strong></p><p>✓ ${e(r.correct)}</p></div>`).join('')}</section>`;}
  function extras(rows,figures){return rows.map(r=>`<section class="extras supplemental"><h2>${e(r.title)}</h2><div class="extra-figure">${figures[r.figure]}</div><p>${e(r.caption||'')}</p></section>`).join('');}
  return {tree,mountTree,cuff,misconceptions,extras};
})();
