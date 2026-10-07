import {test,expect} from '@playwright/test';
import {initialState} from '../../src/game/state/initialState';
import {gameConfig as c} from '../../src/config/gameConfig';
test('10x world speed cannot unlock prestige before actual30min; reload and reset preserve timer rules',async({page})=>{
 await page.clock.install({time:new Date('2026-10-06T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-06T00:00:01Z'));
 const s=initialState(42);s.runStatistics.activeSeconds=1799;s.career.rank=s.career.highestRank=c.prestige.minimumRank;s.runStatistics.earned=c.prestige.minimumEarned;s.player.settings.speed=10;
 await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key)){value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));}},{key:c.save.key,value:s});await page.goto('/');
 await expect(page.getByRole('button',{name:'該醒了，別做夢了'})).toHaveCount(0);
 await page.clock.runFor(1000);await expect(page.getByRole('button',{name:'該醒了，別做夢了'})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'該醒了，別做夢了'})).toBeVisible();
 await page.getByRole('button',{name:'該醒了，別做夢了'}).click();await page.getByRole('button',{name:'確認醒來',exact:true}).click();
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),c.save.key);expect(saved.runStatistics.activeSeconds).toBe(0);expect(saved.permanentStatistics.runs).toBe(1);
});
