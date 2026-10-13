const theme = document.querySelector('#theme'), size = document.querySelector('#size');
const scales = {small:.875,default:1,large:1.15,xlarge:1.3};
try { theme.value = localStorage.getItem('course-theme') || 'blossom'; size.value = localStorage.getItem('course-font-scale') || 'default'; } catch {}
function apply(){ document.documentElement.dataset.theme = theme.value || 'blossom'; document.documentElement.style.setProperty('--font-scale', String(scales[size.value] || 1)); }
for (const [control,key] of [[theme,'course-theme'],[size,'course-font-scale']]) control.addEventListener('change',()=>{apply();try{localStorage.setItem(key,control.value);}catch{}});
apply();document.querySelector('#print').addEventListener('click',()=>window.print());
let opened; addEventListener('beforeprint',()=>{opened=[...document.querySelectorAll('details')].map(d=>d.open);document.querySelectorAll('details').forEach(d=>d.open=true);}); addEventListener('afterprint',()=>document.querySelectorAll('details').forEach((d,i)=>d.open=opened?.[i] || false));
