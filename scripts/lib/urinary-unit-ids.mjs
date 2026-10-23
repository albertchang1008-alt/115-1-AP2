// Teacher-approved synchronization identifiers. Display titles keep their punctuation.
export const urinaryUnitRenames = Object.freeze({
 '腎臟位置、構造與功能':'腎臟位置構造與功能',
 '腎元、腎血流與近腎絲球器':'腎元腎血流與近腎絲球器',
 '腎小管再吸收、分泌與排泄':'腎小管再吸收分泌與排泄',
 '電解質、滲透與離子平衡':'電解質滲透與離子平衡',
});
export const urinaryUnitId = title => urinaryUnitRenames[title] || title;
