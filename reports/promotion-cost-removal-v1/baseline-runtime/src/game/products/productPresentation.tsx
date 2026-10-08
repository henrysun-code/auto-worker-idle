import type {State} from '../state/gameState';
import type {ProductDefinition} from './productSchema';
import {getAgeWorkloadMultiplier,ageProductEfficiencyBonus} from '../work/ageWorkload';
import {decimal,money} from '../../utils/format';
export function ProductEffectDescription({s,p}:{s:State;p:ProductDefinition}){
 const sub=s.products[p.id];return p.ageEfficiencyCompensationRate>0?<p className="age-product-effect">目前年齡 {decimal(s.player.age)} 歲 · 人生工作負擔 ×{getAgeWorkloadMultiplier(s.player.age).toFixed(2)}<br />目前產品效率補償 +{decimal(ageProductEfficiencyBonus(s,p.id)*100)}%{!sub.active&&`（啟用後 +${decimal(Math.max(0,getAgeWorkloadMultiplier(s.player.age)-1)*p.ageEfficiencyCompensationRate*100)}%）`}<br />離線年齡進度 ×{p.offlineAgeProgressMultiplier.toFixed(2)}</p>:null;
}
export function productContributionText(s:State,p:ProductDefinition){const stats=s.products[p.id].contributionStats;return p.effectType==='FOOD_OPTION'?`使用 ${stats.foodUses??0} 次 · 節省進食 ${decimal(stats.foodSecondsSaved??0)} 秒`:p.effectType==='PROBLEM_RESOLVER'?`觸發 ${stats.problemTriggeredCount??0} 次 · 處理 ${stats.problemResolvedCount??0} 次 · 提前解除 ${decimal(stats.debuffSecondsSaved??0)} 秒`:p.effectType==='OFFLINE_AGE_PROTECTION'?`離線年齡保護 ${decimal(stats.offlineAgeDaysProtected??0)} 日`:`額外工作收入 $${money(stats.bonusIncome??0)}`;}
export function productBillingSummary(s:State,defaultPeriod:number){const active=Object.values(s.products).filter(p=>p.active),total=active.reduce((n,p)=>n+p.pricePerBillingPeriod,0),period=active[0]?.billingPeriodDays??defaultPeriod;return active.some(p=>p.billingPeriodDays!==period)?'固定產品支出：依各產品續費週期計算':`固定產品支出：$${money(total)}／${period} 遊戲日`;}
