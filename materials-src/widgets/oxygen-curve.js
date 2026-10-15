// Textbook anchor: 40 mmHg ≈75%. Intermediate values illustrate a schematic curve.
function mountOxygenCurve(content) {
  if(content.slug !== 'o2-co2-transport') return;
  const figure = document.querySelector('.state-figure');
  const controls = document.createElement('div');
  controls.innerHTML = '<label>氧分壓 PO₂ <input type="range" min="0" max="100" value="40" aria-label="氧分壓 PO₂"></label><p aria-live="polite"></p>';
  figure.after(controls);
  const slider = controls.querySelector('input'), output = controls.querySelector('p');
  const update = () => {
    const p=Number(slider.value), state=figure.dataset.state;
    const k=state==='state-2'?31:state==='state-3'?21:26;
    const saturation=p?100*p**2.7/(k**2.7+p**2.7):0;
    figure.querySelector('.oxygen-probe').setAttribute('cx',String(60+p*3.6));
    figure.querySelector('.oxygen-probe').setAttribute('cy',String(350-saturation*2.7));
    output.textContent = `PO₂ ${p} mmHg；模型飽和度約 ${Math.round(saturation)}%（曲線示意，非臨床計算器）`;
  };
  slider.addEventListener('input',update);
  const move=e=>{const svg=figure.querySelector('svg'), r=svg.getBoundingClientRect();slider.value=String(Math.round(Math.max(0,Math.min(100,((e.clientX-r.left)*480/r.width-60)/3.6))));update();};
  figure.style.touchAction='pan-y';
  figure.addEventListener('pointerdown',e=>{figure.setPointerCapture(e.pointerId);move(e);});
  figure.addEventListener('pointermove',e=>{if(figure.hasPointerCapture(e.pointerId))move(e);});
  document.querySelectorAll('button[data-lab-state]').forEach(b=>b.addEventListener('click',update));
  update();
}
