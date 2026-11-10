/**
 * Run after transpiling src/components/FittedCatOutfit.tsx to CommonJS in
 * .preview-compiled/ (this is a visual rendering smoke test, not a browser E2E).
 */
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {CAT_FIT,FittedCatOutfit}=require('../.preview-compiled/components/FittedCatOutfit.js');
const {SHOP_ITEMS}=require('../.preview-compiled/data/catShop.js');
const {DressedCat}=require('../.preview-compiled/components/DressedCat.js');
let count=0;
for(const cat of ['mimi','tuanzhang']){
  const fit=CAT_FIT[cat];
  assert.ok(fit.eyeLeft[0]<fit.eyeRight[0]);
  assert.ok(fit.neck[1]>fit.eyeLeft[1]);
  for(const item of SHOP_ITEMS){
    const svg=renderToStaticMarkup(React.createElement(FittedCatOutfit,{cat,items:{[item.slot]:item.id}}));
    if(item.slot==='hat'){
      assert.equal(svg,'');
    }else{
      assert.match(svg,/<svg/);
      assert.match(svg,/viewBox="0 0 1000 1000"/);
      assert.ok(!svg.includes('NaN'));
    }
    count++;
  }
  const whole=renderToStaticMarkup(React.createElement(DressedCat,{cat,items:{
    hat:'green-beret',glasses:'gold-glasses',bow:'cream-bow',clothes:'lace-dress',accessory:'pearl-charm',
  }}));
  assert.ok(whole.includes(cat==='mimi'?'mimi-golden':'tuanzhang-silver'));
  assert.ok(whole.includes('对齐眼睛'));
  assert.ok(whole.includes('系在颈部'));
  assert.ok(whole.includes('贴合猫咪身形'));
}
console.log(`通过：${count} 种装扮渲染 + 两只猫整套穿搭。`);
