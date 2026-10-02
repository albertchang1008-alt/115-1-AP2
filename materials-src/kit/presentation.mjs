// 深色強調色搭配淡色背景；動靜脈與含氧／缺氧的醫學語意顏色保持原狀。
const hues = {'heart-structure':350,'cardiac-conduction':270,'cardiac-cycle':38,'ecg-basics':168,'cardiac-output':20,'blood-pressure-measurement':215,'capillary-exchange':185,'major-vessels':232,'blood-types':306,'lymphoid-organs':112,'blood-vessels':330,'circulation-routes':202,'blood-pressure-regulation':152,'lymphatic-system':85,'hemodynamics':255,'rbc-homeostasis':342,'cardiac-electrical':280,'coronary-circulation':6,'blood-composition':42,'blood-gas-transport':190,'hemostasis-mechanisms':58,'course-orientation':225,'blood-pre':12,'blood-post':292};
// Compare colors within the teaching unit: a full 21-material circle cannot have 25° gaps everywhere.
export const studentPaletteGroups = {
  heart: ['heart-structure-v2','cardiac-conduction-v2','cardiac-cycle-v2','coronary-circulation-v1'],
  heartII: ['cardiac-electrical-v1','ecg-basics-v1','cardiac-output-v1','blood-pressure-measurement-v1','capillary-exchange-v1','major-vessels-v1'],
  circulation: ['blood-vessels-v1','circulation-routes-v1','blood-pressure-regulation-v1','lymphatic-system-v1','hemodynamics-v1'],
  blood: ['blood-composition-v1','blood-gas-transport-v2','hemostasis-mechanisms-v2','rbc-homeostasis-v1','blood-types-v1'],
  lymph: ['lymphatic-system-v1','lymphoid-organs-v1']
};
const studentHues = {
  'heart-structure-v2':0,'cardiac-conduction-v2':90,'cardiac-cycle-v2':180,'coronary-circulation-v1':270,
  'cardiac-electrical-v1':30,'ecg-basics-v1':80,'cardiac-output-v1':135,'blood-pressure-measurement-v1':185,'capillary-exchange-v1':235,'major-vessels-v1':285,
  'blood-vessels-v1':10,'circulation-routes-v1':70,'blood-pressure-regulation-v1':140,'lymphatic-system-v1':190,'hemodynamics-v1':250,
  'blood-composition-v1':40,'blood-gas-transport-v2':100,'hemostasis-mechanisms-v2':160,'rbc-homeostasis-v1':220,'blood-types-v1':300,'lymphoid-organs-v1':115,
  'cardiac-conduction-v1':278,'blood-gas-transport-v1':199
};
export function palette(id){const slug=id.replace(/-v\d+$/,''),version=Number(id.match(/-v(\d+)$/)?.[1]||1),hue=studentHues[id] ?? (hues[slug]+(version-1)*9)%360;if(!Number.isFinite(hue))throw Error('Missing material palette: '+id);return {accent:`hsl(${hue} 65% 27%)`,soft:`hsl(${hue} 40% 95%)`,border:`hsl(${hue} 25% 79%)`,bg:`hsl(${hue} 25% 98%)`};}
export function paletteCss(id){const p=palette(id);return `:root{--accent:${p.accent};--accent-soft:${p.soft};--primary:${p.accent};--primary-dark:${p.accent};--primary-light:${p.soft};--b:${p.accent};--p:${p.soft};--bg:${p.bg};--border:${p.border};--focus-outline:3px solid ${p.accent};--tissue:${p.soft}}`;}
export function colorFigure(svg,id){const p=palette(id);return svg.replace(/#(?:5b3b8c|65428b|7c3aed)/gi,p.accent).replace(/#(?:f7f3fa|f5f0fa|e4f0f6|e2f1f7|e4eff9)/gi,p.soft).replace(/#(?:d8cce5|bba9cb)/gi,p.border);}
