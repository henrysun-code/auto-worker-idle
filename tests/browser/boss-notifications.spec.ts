import { test, expect } from '@playwright/test';
import { initialState } from '../../src/game/state/initialState';
import { gameConfig as c } from '../../src/config/gameConfig';
import { notify } from '../../src/game/events/eventLog';
test('boss result immediately replaces an old toast despite full notification queue',async({page})=>{
 await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const s=initialState(42);for(let i=0;i<15;i++)notify(s,'工作',`舊工作通知 ${i}`);
 await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s});await page.goto('/');await page.clock.runFor(50);await page.getByRole('button',{name:'Debug',exact:true}).click();await page.getByRole('button',{name:'強制 Escape Fail',exact:true}).click();await page.clock.runFor(50);
 const stack=page.getByLabel('事件通知');await expect(stack).toContainText('下班前逃跑失敗');await expect(stack.locator('.toast')).toHaveCount(2);await expect(stack).not.toContainText('老闆正在找人……');
});
