import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gameConfig as c} from '../src/config/gameConfig';
import {getRunUpgradeCost} from '../src/game/work/progression';
import {getPermanentMultiplier,getPrestigeUpgradeCost} from '../src/game/prestige/permanentUpgrades';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let report='# Progression Curve Preview\n\nPROVISIONAL：公式架構預覽，不是最終平衡。未執行 Career Balance 或自動 Tune。歷史 rank-balance 結果不適用本版本。\n\nRun Cost(L) = ceil(Base × 1.025^L × 1.015^max(0,L−100) × 1.025^max(0,L−200))。SoftCap 100／200 是成長轉折，不是等級上限。\n\n';
for(const id of Object.keys(c.upgrades) as (keyof typeof c.upgrades)[]){
 report+=`## ${c.upgrades[id].name}\n\n| Level | Raw Stat | Next Upgrade Cost |\n|---:|---:|---:|\n`;
 for(const level of [0,10,25,50,75,100,125,150,175,200,225,250,275,300,400,500]){
  const raw=id==='efficiency'?c.economy.baseWorkSpeed+level:id==='quality'?c.economy.baseQuality+level:id==='lifeManagement'?level:id==='flattery'?`Income +${level}%; Attention ${((c.boss.baseAttention+level*c.boss.flatteryAttentionPerLevel)*100).toFixed(1)}%`:c.boss.baseEscapeValue+level;
  report+=`| ${level} | ${raw} | ${getRunUpgradeCost(id,level)} |\n`;
 }report+='\n';
}
report+='## Prestige（各路線目前共用 PROVISIONAL shape）\n\nMultiplier = 1.10^Level；Cost = ceil(BaseCost × 2.65^Level)。\n\n| Permanent Level | Multiplier | Next Cost |\n|---:|---:|---:|\n';
for(let l=0;l<=10;l++)report+=`| ${l} | ${getPermanentMultiplier('workEfficiency',l).toFixed(6)} | ${getPrestigeUpgradeCost('workEfficiency',l)} |\n`;
report+='\nSleep 曲線 PROVISIONAL：(0, −30%, −30%)、(0.5, −15%, −15%)、(1, 0%, 0%)、(1.1, +5%, +5%)。線性內插，最後控制點以上封頂。目標18 reference秒；實際窗口50→次日8，共18秒（按dayDuration縮放）。生活管理 hook 本輪為1，不改睡眠輸出。\n\n大數限制：沿用 JavaScript Number；超出可表示範圍的單一公式飽和為有限值，沒有 gameplay level cap。這不是任意精度大數系統；1000級 Run 與25級永久公式均已驗證。\n';
const dir=path.join(root,'reports/progression-curves');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'PROGRESSION_CURVE_PREVIEW.md'),report);
