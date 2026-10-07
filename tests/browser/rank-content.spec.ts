import { test,expect } from '@playwright/test';
import { initialState } from '../../src/game/state/initialState';
import { gameConfig as c } from '../../src/config/gameConfig';
test('Debug Rank content lists effective work and project weights on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const s=initialState(42);await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s});await page.goto('/');await page.getByRole('button',{name:'Debug',exact:true}).click();
 const card=page.getByRole('region',{name:'Rank Content'});await card.getByText('Eligible Normal Work',{exact:true}).click();await card.getByText('Eligible Projects',{exact:true}).click();
 for(let rank=0;rank<5;rank++){await card.getByRole('button',{name:`Set Rank ${rank}`,exact:true}).click();await expect(card).toContainText(`目前 Rank ${rank}`);}
 await expect(card).toContainText('部門策略規劃 · Effective Weight 3');await expect(card).toContainText('回 Email · Effective Weight 0.1');await expect(card).toContainText('年度策略規劃 · Effective Project Weight 4');
 await card.getByRole('button',{name:'Set Rank 0',exact:true}).click();await expect(card).not.toContainText('年度策略規劃');await expect(card).not.toContainText('部門策略規劃');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'tests/artifacts/rank-content-debug.png'});
});
