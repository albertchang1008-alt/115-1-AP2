// Diagram geometry is shared across related anatomy/physiology tasks; all words come from S.units.
function renderScriptedFigure({
  node,
  step,
  state,
  txt,
  controls = true,
  operation = '',
  order = null,
}) {
  if(step.type==='locate')return renderSpatialFigure({node,step,state,txt,controls,order});
  const figure = node.figure;
  const path = (d, stroke = '#397b91', width = 3) =>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
  const kidney = `<path d="M38 12C8 7 7 89 38 90C62 91 63 69 47 61C34 54 34 44 49 36C62 28 58 13 38 12Z" fill="#f3ccd2" stroke="#9c5d73" stroke-width="2"/>`;
  // One uninterrupted centreline, constant tube width, smooth U bend and distal connection.
  const loop = `<circle cx="22" cy="17" r="12" fill="#f3ccd2" stroke="#9c5d73" stroke-width="2"/><path data-continuous-tubule d="M32 17 C42 7 48 20 37 25 S29 38 43 34 Q46 34 46 43 V79 Q46 91 53 91 Q60 91 60 79 V36 C60 25 70 21 72 30 S78 36 85 29" fill="none" stroke="#96b6ba" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path data-collecting-duct d="M85 18V95" fill="none" stroke="#c7ad6e" stroke-width="8" stroke-linecap="round"/>`;

  let shapes = '';
  if (figure === 'normal-urine') {
    shapes = `<path d="M25 15V80Q50 96 75 80V15" fill="#f9fbfc" stroke="#8ba5b3" stroke-width="2"/>${state.success ? '<path d="M27 38H73V79Q50 92 27 79Z" fill="#f2dc82"/>' : ''}`;
  } else if (figure === 'thirst-adh') {
    shapes = `<path d="M30 12Q8 42 30 48Q52 42 30 12Z" fill="#c7e6ef" stroke="#79a7b8"/><g transform="translate(55 45) scale(.55 .55)">${kidney}</g>${state.success ? path('M30 51V75H53','#397b91',3):''}`;
  } else if (figure === 'electrolyte-dissociation') {
    shapes = [7,38,69].map((x,j)=>`<rect x="${x}" y="18" width="24" height="65" rx="5" fill="#eef5f8" stroke="#9ab2bd"/>${state.match?.complete ? Array.from({length:j+1},(_,i)=>`<circle cx="${x+7+(i%2)*10}" cy="${47+Math.floor(i/2)*13}" r="4" fill="#397b91"/>`).join(''):''}`).join('');
  } else if (figure === 'meq-valency') {
    shapes = `<circle cx="28" cy="45" r="16" fill="#d3e8f0"/><circle cx="72" cy="45" r="16" fill="#e8d8ef"/>${path('M19 45H25M22 42V48M31 45H37M34 42V48M68 45H76M72 41V49','#397b91',1.5)}`;
  } else if (['na-k-distribution','chloride-balance','magnesium-role'].includes(figure)) {
    shapes = `<rect x="4" y="8" width="92" height="84" rx="10" fill="#f8fbfc" stroke="#b3c8d0"/><circle cx="52" cy="50" r="28" fill="#e7f2f6" stroke="#7ea7b8" stroke-width="2"/>${state.match?.complete || state.success ? [25,50,75].map((y,i)=>`<circle cx="${figure==='chloride-balance'?12:52}" cy="${y}" r="3" fill="#397b91"/>`).join(''):''}`;
  } else if (figure === 'body')
    shapes = `<path d="M25 3Q50 15 75 3L90 90Q50 103 10 90Z" fill="#f6e5dc" stroke="#b7c9ce" stroke-width="2"/>${path('M50 10V92', '#8a9fa9', 4)}<g transform="translate(16 34) scale(.38 .45)">${kidney}</g><g transform="translate(84 24) scale(-.38 .45)">${kidney}</g><ellipse cx="29" cy="27" rx="19" ry="10" fill="#c79776"/>`;
  else if (['kidney-cut', 'kidney-layers', 'urine-route'].includes(figure))
    shapes = `<g transform="translate(8 0) scale(1.4 1)">${kidney}</g>${[0, 1, 2, 3, 4].map((j) => `<path d="M${29 + j * 7} ${22 + j * 9}L${50 + j * 2} ${35 + j * 7}L${25 + j * 7} ${38 + j * 9}Z" fill="#bfa7c5" stroke="#fff" stroke-width="2"/>`).join('')}${path('M63 37L72 48L66 63L78 70V98', '#d3ae5e', 4)}${figure === 'kidney-layers' ? `<path d="M48 5C1 -4 2 103 48 97M51 1C-5 -7 -6 110 51 103" fill="none" stroke="#d1b77c" stroke-width="3"/>` : ''}`;
  else if (figure === 'urinary')
    shapes = `<g transform="translate(5 5) scale(.4 .4)">${kidney}</g><g transform="translate(95 5) scale(-.4 .4)">${kidney}</g>${path('M25 38Q35 50 42 66M75 38Q65 50 58 66', '#d3ae5e', 4)}<path d="M35 65Q50 57 65 65Q70 84 50 86Q30 84 35 65Z" fill="#efdd9c" stroke="#aa985d" stroke-width="2"/>${path('M50 86V99', '#d3ae5e', 5)}`;
  else if (
    [
      'nephron',
      'loop-down',
      'loop-up',
      'adh',
      'adh-comparison',
      'two-nephrons',
      'epithelium',
      'jga',
      'gradient',
      'vasa-recta',
    ].includes(figure)
  ) {
    shapes = `<rect x="2" y="30" width="96" height="68" rx="5" fill="url(#solute-gradient)"/>${loop}`;
    if (figure === 'two-nephrons')
      shapes += `<g transform="translate(42 0) scale(.55 .55)">${loop}</g>`;
    if (figure === 'epithelium')
      shapes += Array.from({ length: 8 }, (_, j) =>
        path(`M${37 + j * 2} 25l-2 -6`, '#9c7664', 1),
      ).join('');
    if (figure === 'jga')
      shapes += `<circle cx="10" cy="10" r="4" fill="#ca7575"/><circle cx="69" cy="22" r="4" fill="#a98ac4"/>${path('M0 9H13M28 11H40', '#b66570', 3)}`;
    if (figure === 'vasa-recta')
      shapes += `${path('M8 2V80Q10 106 30 82V35', '#b96f7d', 3)}${path('M15 6V79Q16 97 24 80V37', '#759ab4', 2)}`;
    if (['loop-down', 'loop-up', 'adh', 'adh-comparison', 'gradient'].includes(figure)) {
      shapes += [42,56,70,84].map((y,i)=>`<path data-gradient-tick d="M${97-i*2} ${y}H99" stroke="#7e6654" stroke-width="1"/>`).join('');
      shapes += '<path data-cortex-boundary d="M3 35H97" fill="none" stroke="#8c8174" stroke-width=".6" stroke-dasharray="2 2"/>';
      const visible = state.visited?.length || state.success || step.type === 'choice';
      const arrow = (x1, x2, y, substance) => `<path data-transport="${substance}" d="M${x1} ${y}H${x2}" fill="none" stroke="${substance === 'NaCl' ? '#bc9b53' : '#397b91'}" stroke-width="2" marker-end="url(#figure-arrow)"/>`;
      if (visible && figure === 'loop-down') shapes += [48,62,76].map(y=>arrow(41,28,y,'water')).join('');
      // Salt ends in the interstitium, well before the collecting duct at x=85.
      if (visible && figure === 'loop-up') shapes += [48,62,76].map(y=>arrow(65,74,y,'NaCl')).join('');
      if (visible && figure === 'adh') shapes += [48,62,76].map(y=>`<rect data-water-channel x="80" y="${y-2}" width="4" height="4" fill="#6ab4c2"/>`+arrow(79,69,y,'water')).join('');
    }

  } else if (figure === 'blood-tube')
    shapes = `<path d="M30 5H70V82Q70 98 50 98Q30 98 30 82Z" fill="#f3da97" stroke="#8aa7b5" stroke-width="2"/><path d="M31 52H69V82Q68 96 50 96Q32 96 31 82Z" fill="#c47885"/>`;
  else if (figure === 'blood-route')
    shapes = `${path('M3 20H28V40H65V70H95', '#ba697b', 6)}<circle cx="40" cy="30" r="16" fill="#e5b5c1"/>${[0, 1, 2, 3].map((j) => path(`M${63 + j * 7} 65v25`, '#79a2b4', 2)).join('')}`;
  else if (figure.startsWith('filter')) {
    shapes = `<rect x="2" y="4" width="42" height="92" rx="12" fill="#f7e0e2"/><rect x="57" y="4" width="41" height="92" rx="12" fill="#e1f1f6"/>${[46, 50, 54].map((x, j) => `<rect x="${x}" y="5" width="3" height="90" fill="${['#9cbcb4', '#b1a2bd', '#8aa7ba'][j]}"/>`).join('')}<circle cx="25" cy="20" r="7" fill="#c97685"/><circle cx="20" cy="70" r="9" fill="#b8a4c7"/>${[35, 45, 55].map((y) => `<circle cx="35" cy="${y}" r="2.5" fill="#66a9b6"/>`).join('')}`;
    if (figure === 'filter-direction')
      shapes += `<path data-direction-arrow d="${state.arrows?.[0] ? 'M20 48H80l-9 -6m9 6l-9 6' : 'M80 48H20l9 -6m-9 6l9 6'}" fill="none" stroke="#397b91" stroke-width="3"/>`;
    if (figure === 'filter-pressures') shapes += path('M18 25H42M78 50H56M22 78H5', '#a77d9a', 4);
  } else if (figure === 'equation')
    shapes = `<rect x="2" y="10" width="96" height="80" rx="10" fill="#e9f3f5"/>${path('M5 65H95', '#a0b8bf', 2)}${[18, 45, 72].map((x) => `<rect x="${x}" y="24" width="17" height="28" rx="4" fill="#d6e7ed" stroke="#93b4c0"/>`).join('')}`;
  else if (figure === 'glucose-slider') {
    const v = state.slider || 0, x = 15 + v / 8, y = 78 - Math.min(v,375)/7.5;
    shapes = `<rect x="4" y="8" width="92" height="84" rx="9" fill="#edf5f8"/>${path('M15 78H90M15 78V15','#8ea6b0',1.5)}${path('M61.875 76V80','#8ea6b0',1)}${v > 0 ? `<path data-curve="reabsorbed" d="M15 78L${Math.min(x,61.875)} ${y}${v>375 ? `H${x}`:''}" fill="none" stroke="#397b91" stroke-width="2"/>`:''}${v>375 ? `<path data-curve="urine" d="M61.875 78L${x} ${78-(v-375)/7.5}" fill="none" stroke="#c3937d" stroke-width="2"/>`:''}`;
  }
  else if (figure === 'three-transports')
    shapes = `${[3, 36, 70].map((x, j) => `<rect x="${x}" y="6" width="27" height="88" rx="7" fill="${['#f6dfe3', '#f8edcd', '#e5f2f5'][j]}"/>`).join('')}${path('M17 28H47M83 50H17M17 75H83', '#80a5b5', 3)}`;
  else if (figure === 'concentration')
    shapes = `<rect x="12" y="7" width="28" height="84" rx="8" fill="#e5f2f5"/><rect x="60" y="7" width="28" height="84" rx="8" fill="#e5f2f5"/>${[0, 1, 2, 3, 4, 5].map((j) => `<circle cx="${20 + (j % 2) * 11}" cy="${20 + Math.floor(j / 2) * 20}" r="3" fill="#c39f78"/><circle cx="${68 + (j % 2) * 11}" cy="${60 + Math.floor(j / 2) * 9}" r="3" fill="#c39f78"/>`).join('')}${[25,36].map(y=>`<path d="M70 ${y}H93" fill="none" stroke="#70a9b9" stroke-width="3" marker-end="url(#figure-arrow)"/>`).join('')}`;
  // --- Antigravity Expanded Figures ---
  else if (figure === 'ureter-peristalsis') {
    shapes = `<g transform="translate(15 6) scale(.4 .4)">${kidney}</g>${path('M32 40 C32 55, 38 65, 45 78 C48 83, 50 86, 52 88', '#d3ae5e', 4)}<path d="M38 78 Q50 70 65 78 Q72 95 50 96 Q32 95 38 78 Z" fill="#efdd9c" stroke="#aa985d" stroke-width="2"/>${[50, 62, 74].map((y) => `<circle cx="${33 + (y - 50) * 0.5}" cy="${y}" r="3" fill="#397b91"/>`).join('')}${path('M34 50 L38 56 L34 62', '#28687a', 2)}`;
  } else if (figure === 'ureter-constrictions') {
    shapes = `<g transform="translate(15 6) scale(.4 .4)">${kidney}</g>${path('M32 40 C32 55, 40 65, 48 85', '#d3ae5e', 4)}<path d="M30 62 L60 52" stroke="#d65a6a" stroke-width="4"/><path d="M32 66 L62 56" stroke="#4886b5" stroke-width="3"/><path d="M40 80 Q52 74 64 80 Q68 95 52 96 Q36 95 40 80 Z" fill="#efdd9c" stroke="#aa985d" stroke-width="2"/>${[[32, 41], [36, 60], [48, 84]].map(([x, y], j) => (state.selected?.includes(j) || state.success) ? `<circle data-found-location="${j}" cx="${x}" cy="${y}" r="3" fill="#2ba878"/>` : '').join('')}`;
  } else if (figure === 'bladder-trigone') {
    shapes = `<path d="M20 30 Q50 15 80 30 Q88 88 50 95 Q12 88 20 30 Z" fill="#fae8dc" stroke="#b25d6f" stroke-width="3"/>${path('M22 25 L35 42 M78 25 L65 42','#d3ae5e',3)}${path('M50 78 V96','#d3ae5e',4)}${[[35,42],[65,42],[50,78]].map(([x,y],j)=>(state.selected?.includes(j) || state.success)?`<circle data-found-location="${j}" cx="${x}" cy="${y}" r="3" fill="#2ba878"/>`:'').join('')}`;
  } else if (figure === 'male-urethra' || figure === 'urethra-male-female') {
    shapes = `<g transform="translate(8 10)"><rect x="0" y="0" width="38" height="80" rx="8" fill="#fcf3ed" stroke="#c8a598"/><circle cx="19" cy="14" r="5" fill="#d49483"/><path d="M12 25 Q19 20 26 25 Q28 45 19 46 Q10 45 12 25 Z" fill="#efdd9c" stroke="#aa985d"/><path d="M19 46 V62" stroke="#d3ae5e" stroke-width="4"/></g><g transform="translate(54 10)"><rect x="0" y="0" width="38" height="80" rx="8" fill="#eaf3f7" stroke="#90b2bf"/><circle cx="19" cy="14" r="5" fill="#699eb3"/><path d="M12 25 Q19 20 26 25 Q28 45 19 46 Q10 45 12 25 Z" fill="#efdd9c" stroke="#aa985d"/><rect x="14" y="47" width="10" height="9" rx="2" fill="${state.selected?.includes(0) ? '#2ba878' : '#c3a2ca'}"/><path d="M19 56 V63" stroke="${state.selected?.includes(1) ? '#2ba878' : '#e08470'}" stroke-width="4"/><path d="M19 63 C19 72, 28 72, 28 85" stroke="${state.selected?.includes(2) ? '#2ba878' : '#75b2bf'}" stroke-width="4" fill="none"/></g>`;
  } else if (figure === 'micturition-reflex') {
    const vol = state.slider || 0;
    shapes = `<circle cx="50" cy="50" r="${20 + (vol / 500) * 18}" fill="#f6e8b1" stroke="#bfa34a" stroke-width="2"/><path d="M48 20 Q50 35 48 50" stroke="#d3ae5e" stroke-width="3"/><path d="M50 ${50 + 20 + (vol / 500) * 18} V92" stroke="#d3ae5e" stroke-width="${vol >= 300 ? 5 : 2}"/><path d="M42 86 H58" stroke="${vol >= 300 ? '#2ba878' : '#a85050'}" stroke-width="3"/>${vol >= 300 ? '<circle cx="50" cy="50" r="38" fill="none" stroke="#2ba878" stroke-dasharray="3,3" stroke-width="2"/>' : ''}`;
  } else if (figure === 'micturition-summary' || figure === 'fluid-summary') {
    shapes = `<rect x="5" y="8" width="90" height="84" rx="8" fill="#f4f7f9" stroke="#b0c4cf"/><circle cx="25" cy="50" r="14" fill="#efdd9c"/><circle cx="75" cy="50" r="14" fill="#c3dbe8"/>${path('M40 50 H60', '#397b91', 3)}`;
  } else if (figure === 'body-water') {
    const water = state.slider || 0;
    shapes = `<rect x="8" y="6" width="84" height="88" rx="10" fill="#fcf9f5" stroke="#b8c6cf"/><path d="M35 15 C35 8, 65 8, 65 15 C65 22, 58 25, 58 30 L68 55 L60 55 L56 40 L56 88 L52 88 L52 60 L48 60 L48 88 L44 88 L44 40 L40 55 L32 55 L42 30 C42 25, 35 22, 35 15 Z" fill="#e8ded8" stroke="#a09088" stroke-width="1.5"/><g clip-path="url(#water-clip)"><rect x="25" y="${88 - (water / 100) * 73}" width="50" height="${(water / 100) * 73}" fill="#5eaec4"/></g><defs><clipPath id="water-clip"><path d="M35 15 C35 8, 65 8, 65 15 C65 22, 58 25, 58 30 L68 55 L60 55 L56 40 L56 88 L52 88 L52 60 L48 60 L48 88 L44 88 L44 40 L40 55 L32 55 L42 30 C42 25, 35 22, 35 15 Z"/></clipPath></defs>`;
  } else if (figure === 'compartments-beaker') {
    shapes = `<rect x="18" y="15" width="64" height="72" rx="4" fill="#edf4f8" stroke="#7998a6" stroke-width="2"/><rect x="20" y="35" width="40" height="50" fill="#589bb5" opacity=".8"/><rect x="62" y="55" width="18" height="30" fill="#9bc4d6" opacity=".8"/><line x1="61" y1="20" x2="61" y2="85" stroke="#c0384a" stroke-width="2" stroke-dasharray="3,2"/>`;
  } else if (figure === 'ecf-breakdown') {
    shapes = `<rect x="10" y="20" width="80" height="60" rx="6" fill="#eef5f8" stroke="#8faab8"/><rect x="33" y="25" width="54" height="50" rx="4" fill="#a4cbdb"/><rect x="15" y="25" width="14" height="50" rx="4" fill="#e89ca4"/>`;
  } else if (figure === 'icf-ecf-ions') {
    shapes = [5,29,53,77].map(x=>`<path d="M${x} 15V80Q${x+9} 90 ${x+18} 80V15" fill="#eef6fa" stroke="#8caebb" stroke-width="1.5"/>`).join('');
  } else if (figure === 'osmosis-tube') {
    shapes = `<path d="M25 15 V75 Q25 90 50 90 Q75 90 75 75 V15" fill="#eef4f8" stroke="#8ba5b3" stroke-width="2"/><line x1="50" y1="35" x2="50" y2="88" stroke="#a45867" stroke-width="2" stroke-dasharray="3,2"/><rect x="27" y="50" width="22" height="36" fill="#75b2c7"/><rect x="51" y="50" width="22" height="36" fill="#75b2c7"/>${state.success ? `<circle cx="42" cy="60" r="5" fill="#b089a9"/>${path('M30 60H36M47 52V68','#a45867',2)}` : ''}`;
  } else if (figure === 'water-balance') {
    shapes = `<rect x="10" y="15" width="38" height="70" rx="6" fill="#eef7fa" stroke="#88b1c2"/><rect x="52" y="15" width="38" height="70" rx="6" fill="#fdf4ee" stroke="#d2a893"/>${path('M29 35 V75', '#397b91', 3)}${path('M71 75 V35', '#b26852', 3)}`;
  } else if (figure === 'raas-axis') {
    shapes = `<circle cx="25" cy="25" r="12" fill="#f3ccd2"/><circle cx="75" cy="25" r="12" fill="#c3dbe8"/><circle cx="50" cy="75" r="14" fill="#f7e1b5"/>${path('M37 25 H63', '#a76d7c', 2)}${path('M75 37 V61', '#5a8ea2', 2)}${path('M50 61 V37', '#9c814b', 2)}`;
  } else if (figure === 'angiotensin2-actions') {
    shapes = `<circle cx="50" cy="25" r="14" fill="#e8b8c2"/><rect x="15" y="60" width="28" height="24" rx="4" fill="#a4cad8"/><rect x="57" y="60" width="28" height="24" rx="4" fill="#f3d79b"/>${path('M42 38 L29 60 M58 38 L71 60', '#9c5d73', 2)}`;
  } else if (figure === 'aldosterone-action') {
    shapes = `<rect x="15" y="15" width="70" height="70" rx="8" fill="#edf5f8" stroke="#90b2bf"/><path d="M30 35 H70" stroke="#2ba878" stroke-width="4"/><path d="M70 65 H30" stroke="#a44b58" stroke-width="4"/>`;
  } else if (figure === 'adh-osmolarity') {
    shapes = `<circle cx="50" cy="25" r="12" fill="#c7e1ee"/><rect x="25" y="55" width="50" height="35" rx="6" fill="#eef4f7" stroke="#7ea1b0"/>${path('M50 37 V55', '#4885a0', 3)}`;
  } else if (figure === 'anp-action') {
    const on = state.selected?.length || state.visited?.length || state.step > 0;
    shapes = `<path d="M50 15 C35 5, 20 25, 50 50 C80 25, 65 5, 50 15 Z" fill="${on ? '#f47d88' : '#e5b2ba'}" stroke="#a84d5c" stroke-width="2"/><g transform="translate(30 52) scale(.5 .4)">${kidney}</g>${on ? '<circle cx="50" cy="28" r="20" fill="none" stroke="#e04e5d" stroke-dasharray="2,2" stroke-width="2"/><path d="M50 72 V92" stroke="#2ba878" stroke-width="4"/>' : ''}`;
  } else if (figure === 'electrolytes-table') {
    shapes = `<rect x="5" y="10" width="90" height="80" rx="6" fill="#edf4f8" stroke="#8daab8"/>${[32, 56, 80].map((y) => `<line x1="8" y1="${y}" x2="92" y2="${y}" stroke="#b0c8d4" stroke-width="1.5"/>`).join('')}`;
  } else if (figure === 'osmosis-direction') {
    shapes = `<rect x="5" y="15" width="90" height="70" rx="8" fill="#edf5f8" stroke="#8faab8"/><line x1="50" y1="16" x2="50" y2="84" stroke="#a04d5d" stroke-width="2.5" stroke-dasharray="3,2"/>${[30, 50, 70].map((y) => `<circle cx="28" cy="${y}" r="3.5" fill="#397b91"/>`).join('')}${[25, 38, 50, 62, 75].flatMap((y) => [65, 78].map((x) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#397b91"/>`)).join('')}${state.success || state.selected?.includes(0) ? '<path d="M35 50 H65 l-6 -5 m6 5 l-6 5" fill="none" stroke="#2ba878" stroke-width="4"/>' : ''}`;
  } else if (figure === 'meq-charge') {
    shapes = `<rect x="10" y="20" width="36" height="60" rx="6" fill="#eaf2f6" stroke="#8ba9b8"/><rect x="54" y="20" width="36" height="60" rx="6" fill="#faecee" stroke="#cca2a7"/><circle cx="28" cy="45" r="8" fill="#397b91"/><circle cx="72" cy="45" r="10" fill="#a44b58"/>`;
  } else if (figure === 'sodium-balance' || figure === 'potassium-balance' || figure === 'calcium-regulation' || figure === 'electrolyte-summary') {
    shapes = `<rect x="8" y="10" width="84" height="80" rx="8" fill="#f4f7f9" stroke="#9bb6c4"/><circle cx="30" cy="50" r="15" fill="#f7e1b5"/><circle cx="70" cy="50" r="15" fill="#c3dbe8"/>${path('M45 50 H55', '#397b91', 3)}`;
  } else {
    shapes = `<circle cx="27" cy="50" r="22" fill="#f3ccd2"/>${[20, 40, 60].map((y) => path(`M50 ${y}H90`, '#85a9b6', 4)).join('')}`;
  }

  if (state.progress)
    shapes += `<circle class="moving-particle" data-moving-particle cx="${Math.min(85, 20 + state.progress * 16)}" cy="${Math.min(82, 22 + state.progress * 12)}" r="4" fill="#56a8be" stroke="#fff" stroke-width="1"/>`;
  if (state.match?.complete && step.type === 'matching')
    shapes += `<rect x="2" y="2" width="96" height="96" rx="9" fill="none" stroke="#3a9b70" stroke-width="3"/>`;
  shapes = shapes.replace(
    /<path d="(M(?:46|60) [^"]+)" fill="none"/g,
    '<path marker-end="url(#figure-arrow)" d="$1" fill="none"',
  );

  if (figure === 'filter-particles') {
    shapes = `<rect x="5" y="40" width="39" height="20" rx="6" fill="#f7e0e2"/><rect x="56" y="40" width="39" height="20" rx="6" fill="#e1f1f6"/>${[47,50,53].map(x=>`<rect x="${x}" y="40" width="2" height="20" fill="#9cbcb4"/>`).join('')}<circle cx="18" cy="46" r="3" fill="#c97685"/><circle cx="31" cy="54" r="4" fill="#b8a4c7"/>`;
  }
  let base = `<svg class="student-svg scripted-svg" viewBox="${figure === 'filter-particles' ? '0 32 100 32' : '0 0 100 100'}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><marker id="figure-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#6c94a7"/></marker><linearGradient id="solute-gradient" x2="0" y2="1"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#e1c8aa"/></linearGradient></defs>${shapes}</svg>`;

  const positions = {
    'urine-route': [
      [48, 32],
      [66, 48],
      [65, 63],
      [79, 79],
    ],
    'kidney-layers': [
      [28, 18],
      [16, 48],
      [25, 80],
    ],
    'blood-route': [
      [14, 20],
      [40, 30],
      [65, 48],
      [80, 80],
    ],
    'two-nephrons': [
      [53, 83],
      [73, 42],
    ],
    epithelium: [
      [42, 23],
      [70, 26],
      [48, 69],
    ],
    jga: [
      [16, 9],
      [70, 22],
    ],
    'blood-tube': [
      [50, 28],
      [50, 72],
    ],
    'filter-layers': [
      [45, 20],
      [50, 43],
      [55, 67],
      [83, 83],
    ],
    'loop-down': [[45, 62]],
    'loop-up': [[60, 60]],
    adh: [[85, 46]],
    // Antigravity Hotspots
    'ureter-constrictions': [
      [32, 41],
      [36, 60],
      [48, 84],
    ],
    'bladder-trigone': [
      [35, 42],
      [65, 42],
      [50, 78],
    ],
    'male-urethra': [
      [70, 48],
      [70, 60],
      [78, 76],
    ],
    'urethra-male-female': [
      [70, 48],
      [70, 60],
      [78, 76],
    ],
    'osmosis-direction': [
      [72, 50],
      [28, 50],
    ],
    'anp-action': [
      [50, 30],
    ],
  };

  let teacher = node.teacherFigure;
  // The second action uses the male panel only; all three structures remain in frame.
  if(teacher?.key === 'urinary-route-micturition:N04' && step.type === 'sequence')teacher={...teacher,crop:[0,780,1055,713]};
  if (teacher?.kind === 'anatomy') base = renderTeacherFigure(teacher, {state, step, txt});
  let hotspots = '';
  const onDiagram = controls && (['point', 'explore', 'sequence'].includes(step.type) || step.onDiagram);
  if (onDiagram) {
    const indices = order || step.options.map((_, i) => i);
    hotspots = indices
      .map((i) => {
        const [x, y] = teacher?.kind === 'anatomy' ? teacherPoint(teacher, txt(step.options[i]).replace(/<[^>]+>/g, ''), i) : positions[figure]?.[i] || [20 + (i % 2) * 60, 25 + Math.floor(i / 2) * 45];
        return `<button data-operation="${i}" data-figure-control data-x="${x}" data-y="${y}" aria-label="${step.blindHotspots ? '圖上位置' : ''}" class="diagram-hotspot ${step.blindHotspots ? 'blind-hotspot' : ''} ${state.selected?.includes(i) ? 'selected' : ''}">${step.blindHotspots && !state.selected?.includes(i) && !state.success ? '' : txt(step.options[i])}</button>`;
      })
      .join('');
    operation = '';
  }

  const reference = `<div class="figure-caption">${txt(node.title)}</div>`;
  const referenceLabels =
    step.type === 'matching' && figure !== 'filter-particles'
      ? `<div class="figure-legend">${step.cards.map((id) => `<span>${txt(id)}</span>`).join('')}</div>`
      : '';
  const iface = key => `<span data-interface="${key}">${({figurePlasma:'血漿',figureUrine:'尿液',chartX:'過濾出來的葡萄糖（mg/min）',chartY:'量',chartBlue:'被回收的葡萄糖',chartOrange:'尿中的葡萄糖',chart375:'375',figureBlood:'血液',figureFiltrate:'濾液'})[key]}</span>`;
  const chart = figure === 'glucose-slider' ? `<div class="chart-legend"><i class="blue-line"></i>${iface('chartBlue')}<i class="orange-line"></i>${iface('chartOrange')}</div><div class="chart-y" data-figure-control data-x="3" data-y="45">${iface('chartY')}</div><div class="chart-tick" data-figure-control data-x="61.875" data-y="84">${iface('chart375')}</div><div class="chart-x" data-figure-control data-x="52" data-y="92">${iface('chartX')}</div>` : '';
  const sides = figure === 'filter-particles' ? `<div class="filter-side-labels">${iface('figureBlood')}${iface('figureFiltrate')}</div>` : '';
  return `<div class="scripted-figure" data-figure="${figure}" data-figure-kind="${teacher?.kind || 'legacy'}">${base}${chart}${sides}${hotspots}${figure==='concentration' ? `<div class="comparison-side-labels">${iface('figurePlasma')}${iface('figureUrine')}</div>` : ''}${['loop-down','loop-up','adh','adh-comparison','gradient','vasa-recta'].includes(figure) && (step.type !== 'matching' || teacher?.src?.endsWith('-90.png')) ? `<div class="renal-regions"><span data-figure-control data-x="${figure==='vasa-recta'?200:teacher?.width*.12||12}" data-y="${figure==='vasa-recta'?35:teacher?.height*.28||10}" data-interface="renalCortex">皮質</span><span data-figure-control data-x="${figure==='vasa-recta'?230:teacher?.width*.12||12}" data-y="${figure==='vasa-recta'?800:teacher?.height*.43||45}" data-interface="renalMedulla">髓質</span><span data-figure-control data-x="${figure==='vasa-recta'?230:teacher?.width*.16||18}" data-y="${figure==='vasa-recta'?1150:teacher?.height*.89||88}" data-interface="renalGradient">越深越濃 ↓</span></div>` : ''}${step.type === 'arrows' ? `<div class="figure-boundaries">${step.options.map(txt).join('')}</div>` : ''}${figure === 'body' ? `<div class="body-side-labels">${step.labels.map(txt).join('')}</div>` : ''}${reference}${referenceLabels}${operation ? `<div class="on-figure">${operation}</div>` : ''}</div>`;
}
