# 素材替換指南

V2 2.0.0 使用 inline SVG 角色、CSS 狀態動畫與 emoji，沒有外部字型、圖片或音效依賴。

素材原稿放在此遊戲自己的 `assets/`，建議分類：`images/characters/`、`images/backgrounds/`、`images/items/`、`animations/`、`audio/`。

首頁畫面整合點是 `src/components/TargetCard.tsx`，共用中央目標呈現。`TargetMonster.tsx` 依 kind 切換普通／急件／大型／娛樂／睡眠輪廓；`WorkerAvatar.tsx` 是旁邊的小人執行者，只接收 kind 與 age。CSS 在 `src/target-style.css`，負責出現、處理、完成動畫。原 `CharacterScene.tsx` 保留作為插畫素材。

這些元件可換成圖片、spritesheet 或播放器，不需要動模擬核心。使用例如 `import imageUrl from '../../assets/images/characters/worker.png'` 交給 Vite 打包，不填本機絕對路徑。

產品 icon 可在 `gameConfig.ts` 或 Excel 改動。未來增加素材檔名欄位時，使用分類下相對路徑，透過 `import.meta.glob` 建立映射並加上設定驗證。

保留圖片 aria-label 及「減少動畫」設定。觸控目標至少 44×44px，不依賴 hover。

V2 新增午休、Problem 與返工卡片，沿用 CSS 怪物和 WorkerAvatar；狀態與公式由 V2 Core 提供，圖片替換不改核心。
