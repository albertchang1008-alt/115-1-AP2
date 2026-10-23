import fs from 'node:fs';
export const spatialRules = {
  "kidney-anatomy:1:0": {
    "keys": [
      "左腎",
      "右腎"
    ]
  },
  "kidney-anatomy:2:0": {
    "keys": [
      "腎皮質",
      "腎髓質",
      "腎柱"
    ]
  },
  "kidney-anatomy:3:0": {
    "keys": [
      "腎乳頭",
      "小腎盞",
      "大腎盞",
      "腎盂"
    ],
    "focus": true
  },
  "kidney-anatomy:4:0": {
    "keys": [
      "腎被膜",
      "脂肪囊",
      "腎筋膜"
    ],
    "focus": true
  },
  "nephron-circulation:1:0": {
    "keys": [
      "腎小體",
      "腎小管"
    ]
  },
  "nephron-circulation:2:0": {
    "keys": [
      "長環",
      "短環"
    ]
  },
  "nephron-circulation:3:0": {
    "keys": [
      "近曲小管",
      "遠曲小管",
      "亨利氏環薄段"
    ]
  },
  "nephron-circulation:4:0": {
    "keys": [
      "入球小動脈",
      "腎絲球",
      "出球小動脈",
      "管周微血管"
    ],
    "focus": true
  },
  "nephron-circulation:5:0": {
    "keys": [
      "近腎絲球細胞",
      "緻密斑"
    ],
    "focus": true
  },
  "nephron-circulation:6:0": {
    "data": "blood",
    "crop": [
      0,
      0,
      1000,
      600
    ],
    "points": [
      [
        500,
        170
      ],
      [
        500,
        410
      ]
    ]
  },
  "filtration-clearance:2:0": {
    "keys": [
      "微血管內皮",
      "基底膜",
      "足細胞",
      "鮑氏囊壁層"
    ],
    "required": [
      0,
      1,
      2
    ],
    "expected": [
      0,
      1,
      2,
      -1
    ]
  },
  "tubular-handling:1:0": {
    "keys": [
      "過濾",
      "再吸收",
      "分泌"
    ],
    "directions": true,
    "directionVectors": [
      [
        -40,
        -25,
        40,
        25
      ],
      [
        -50,
        0,
        50,
        0
      ],
      [
        50,
        0,
        -50,
        0
      ]
    ]
  },
  "tubular-handling:5:0": {
    "keys": [
      "遠曲小管",
      "集尿管"
    ],
    "required": [
      0,
      1
    ],
    "expected": [
      0,
      1,
      -1
    ]
  },
  "urinary-route-micturition:2:0": {
    "keys": [
      "腎盂交接",
      "髂外血管交叉",
      "進入膀胱"
    ]
  },
  "urinary-route-micturition:3:0": {
    "keys": [
      "輸尿管口",
      "輸尿管口",
      "尿道內口"
    ]
  },
  "urinary-route-micturition:4:0": {
    "keys": [
      "女性尿道",
      "男性尿道"
    ],
    "cardsFromSlots": true
  },
  "urinary-route-micturition:4:1": {
    "keys": [
      "前列腺部",
      "膜部",
      "陰莖部"
    ],
    "focus": true,
    "ignorePositions": true
  },
  "water-sodium-regulation:2:0": {
    "keys": [
      "腎",
      "肺",
      "皮膚",
      "腸"
    ]
  },
  "water-sodium-regulation:4:0": {
    "keys": [
      "近腎絲球細胞"
    ],
    "crop": [
      250,
      0,
      600,
      400
    ]
  },
  "electrolyte-balance:4:0": {
    "keys": [
      "細胞外液",
      "細胞內液"
    ],
    "cardsFromSlots": true,
    "crop": [
      0,
      0,
      1122,
      650
    ]
  },
  "fluid-compartments:2:0": {
    "data": "compartments",
    "crop": [
      0,
      0,
      1000,
      600
    ],
    "points": [
      [
        310,
        350
      ],
      [
        690,
        350
      ]
    ],
    "cardsFromSlots": true,
    "captionsFromRoles": true
  },
  "fluid-compartments:3:0": {
    "data": "compartments",
    "crop": [
      0,
      0,
      1000,
      600
    ],
    "points": [
      [
        310,
        350
      ],
      [
        690,
        350
      ]
    ],
    "cardsFromSlots": true,
    "captionsFromRoles": true
  },
  "fluid-compartments:4:0": {
    "data": "compartments",
    "crop": [
      0,
      0,
      1000,
      600
    ],
    "points": [
      [
        150,
        350
      ],
      [
        380,
        350
      ],
      [
        620,
        350
      ],
      [
        850,
        350
      ]
    ],
    "cardsFromSlots": true,
    "captionsFromRoles": true
  },
  "electrolyte-balance:1:0": {
    "data": "particles",
    "crop": [
      0,
      0,
      1000,
      600
    ],
    "points": [
      [
        190,
        350
      ],
      [
        500,
        350
      ],
      [
        810,
        350
      ]
    ],
    "particles": true,
    "captionsFromSlots": true
  }
};

export function spatialStep(slug,node,stepIndex,step,fragment) {
 const rule=spatialRules[`${slug}:${node}:${stepIndex}`];if(!rule)return step;
 const figures=JSON.parse(fs.readFileSync(new URL('./teacher-figures.json',import.meta.url))).entries;
 const asset=figures.find(e=>e.slug===slug&&e.node===node);
 const cards=rule.cardsFromSlots?step.slots:step.type==='matching'?step.cards:step.options;
 const required=rule.required|| (step.type==='point'?[step.answer]:step.type==='multi'?step.expected:cards.map((_,i)=>i));
 let crop=rule.crop||asset.crop||[0,0,1000,600];
 let native=rule.points || rule.keys.map((key,index)=> {
   const xy=!rule.ignorePositions&&asset.positions?.[index]||asset.anchors[key];if(!xy)throw Error(`Missing FIGURE_MAP anchor ${slug}:${node} ${key}`);
   return [xy[0]*asset.width/100,xy[1]*asset.height/100];
 });
 if(rule.focus){
   const xs=native.map(p=>p[0]),ys=native.map(p=>p[1]);
   const w=Math.max(260,Math.max(...xs)-Math.min(...xs)+120),h=Math.max(180,Math.max(...ys)-Math.min(...ys)+120);
   crop=[Math.max(0,Math.min(asset.width-w,(Math.min(...xs)+Math.max(...xs)-w)/2)),Math.max(0,Math.min(asset.height-h,(Math.min(...ys)+Math.max(...ys)-h)/2)),w,h];
 }
 const points=rule.data?native:native.map(([x,y])=>[x-crop[0],y-crop[1]]);
 for(const [x,y]of points)if(x<0||y<0||x>crop[2]||y>crop[3])throw Error(`Spatial point outside crop: ${slug}:${node}`);
 const distances=points.flatMap((p,i)=>points.slice(i+1).map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])));
 const minWidth=distances.length?Math.ceil(48*crop[2]/Math.min(...distances)):0;

 return {...step,type:'locate',originalType:step.type,cards,spatial:{...rule,crop,points,required,minWidth,
   expected:rule.expected||cards.map((_,i)=>i),
   sequence:step.type==='sequence'?step.expected:null,
   unorderedPrefix:step.unorderedPrefix||0,
   captions:rule.captionsFromRoles?step.cards:rule.captionsFromSlots?step.slots:[],
 }};
}
