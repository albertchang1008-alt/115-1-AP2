// Scope the approved blood-flow kit extension to this material's build only.
// Other materials embed the exact unchanged shared kit, including 1.10.2 behavior.
export function bloodFlowKit(source) {
  const changes = [
    ["const WIDGETS = { ", "const WIDGETS = { 'blood-flow': () => window.BloodFlow, "],
    ["widget.html(lab)", "widget.html(lab, figures)"],
    ['${visual}${prediction}</section>', '${visual}${lab.widget===\'blood-flow\'?`<div class="flow-prediction" hidden>${prediction}</div>`:prediction}</section>'],
  ];
  for (const [before, after] of changes) {
    if (source.split(before).length !== 2) throw Error('Blood-flow kit source changed: ' + before);
    source = source.replace(before, after);
  }
  return source;
}
