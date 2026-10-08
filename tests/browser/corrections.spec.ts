import { test, expect } from '@playwright/test';
import { initialState } from '../../src/game/state/initialState';
import { gameConfig as c } from '../../src/config/gameConfig';
import { settleOfflineMinutes } from '../../src/game/time/offlineSimulation';
import { createTodo } from '../../src/game/work/todoManager';
import { createFollowUp } from '../../src/game/work/followUpManager';
test('offline summary dismisses without blocking and remains in History after reload',async({page})=>{
 const s=initialState(42);settleOfflineMinutes(s,30);
 await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key)){value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));}},{key:c.save.key,value:s});await page.goto('/');
 const summary=page.getByRole('region',{name:'離線摘要'});await expect(summary).toContainText('30 分鐘');await expect(summary).toContainText('金錢淨變化');await summary.getByRole('button',{name:'關閉離線摘要'}).click();await expect(summary).toHaveCount(0);await page.reload();await expect(summary).toHaveCount(0);await page.getByRole('navigation').getByRole('button',{name:'紀錄'}).click();await expect(summary).toBeVisible();await summary.getByText('專案與產品貢獻').click();await expect(summary).toContainText('續費');
});
test('late breakfast is missed and Todo list shows zero reward rework source',async({page})=>{
 await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const s=initialState(42);s.world.totalWorldTime=27;s.world.timeOfDay=27;s.world.nextEventAt=10000;const root=createTodo(s,c.work.templates[0]);createFollowUp(s,root,'MISSING_INFO',2,0);
 await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s});await page.goto('/');await page.clock.runFor(50);await expect(page.getByRole('region',{name:'中央目標'})).not.toContainText('早餐食物怪');await page.getByRole('navigation').getByRole('button',{name:'紀錄'}).click();await expect(page.getByText('早餐時間已經過了。',{exact:true}).last()).toBeVisible();await page.getByText(/待辦 .*延遲後續/).click();await expect(page.locator('.history-details')).toContainText('返工');await expect(page.locator('.history-details')).toContainText('$0');await expect(page.locator('.history-details')).toContainText('來源：回 Email');
});
