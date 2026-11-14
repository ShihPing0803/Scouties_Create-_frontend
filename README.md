# Scouties Creator

Scouties 的遊戲創作工具，可編輯故事與路線、匯入或匯出 JSON 故事包，並逐站試玩。

## 本機啟動

需要 Node.js 20.19 以上的 20.x，或 Node.js 22.12 以上。從包含 `package.json` 的專案根目錄執行：

```bash
npm ci
npm run dev
```

打開終端機顯示的 **Local** 網址。預設註冊頁為 <http://localhost:4173/register.html>。若 4173 已被使用，請以終端機顯示的連接埠為準。按 **Ctrl+C** 可停止開發伺服器。

## 用範例試玩

1. 在註冊頁使用測試資料建立本機帳號。
2. 進入 Dashboard，點 **Import Story (.json)**，選擇 [範例故事包](examples/kaohsiung-quest.json)。
3. 匯入後，在工作區點 **Preview game**，再點 **Start route** 開始逐站試玩。
4. 若要下載故事包，在 **Review & Submit** 頁面點 **Export story (.json)**。

本機試玩可只啟動 Vite。草稿存在目前瀏覽器，請固定使用同一個網址與連接埠。範例有兩站，足以試玩；送審頁另有站點數、封面與設定檢查。正式送審與發布需要 Scouties 後端。

## 建置與預覽

```bash
npm run build
npm run preview
```

`npm run build` 會把靜態檔案輸出到 `dist/`。`npm run preview` 會在本機提供建置產物，請開啟終端機顯示的 **Local** 網址。
