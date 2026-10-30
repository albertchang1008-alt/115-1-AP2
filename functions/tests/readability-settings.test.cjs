const {test}=require('node:test');const assert=require('node:assert/strict');
const {normalizeCourseFeatures,courseFeaturesFromRecord}=require('../lib/shared/features');
const {validateCourseDraft}=require('../lib/shared/courseValidation');
test('閱讀設定缺省開啟、排除陣列複製、既有三開關獨立',()=>{
 const exclusions=['kidney-anatomy-v1'];const v=normalizeCourseFeatures({assessments:true,readabilityOverlay:false,readabilityOverlayExclusions:exclusions});
 assert.equal(v.assessments,true);assert.equal(v.classroomInteraction,false);assert.equal(v.readabilityOverlay,false);assert.deepEqual(v.readabilityOverlayExclusions,exclusions);assert.notEqual(v.readabilityOverlayExclusions,exclusions);
 assert.equal(normalizeCourseFeatures().readabilityOverlay,true);
 assert.equal(courseFeaturesFromRecord({features:{readabilityOverlay:false},draft:{features:{readabilityOverlay:true}}}).readabilityOverlay,false);
 assert.deepEqual(courseFeaturesFromRecord({features:{},draft:{features:{readabilityOverlayExclusions:exclusions}}}).readabilityOverlayExclusions,exclusions);
 assert.deepEqual(courseFeaturesFromRecord({}).readabilityOverlayExclusions,[]);
});
test('閱讀設定只接受布林與有界、去重、安全版本清單',()=>{
 const c={id:'demo',title:'demo',term:'test',classIds:[],units:[]};
 for(const features of [{readabilityOverlay:0},{readabilityOverlayExclusions:'v1'},{readabilityOverlayExclusions:['../v1']},{readabilityOverlayExclusions:['v1','v1']}])assert.throws(()=>validateCourseDraft({...c,features}));
 assert.doesNotThrow(()=>validateCourseDraft({...c,features:{readabilityOverlay:true,readabilityOverlayExclusions:['kidney-anatomy-v1']}}));
});
