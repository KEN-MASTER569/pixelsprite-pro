// ============================================================
// 🧩 Addon 5: 高级导出系统 (完美兼容版)
// ============================================================
(function () {
    'use strict';

    window.addEventListener('load', () => {
        const btnExportPng = document.getElementById('btn-export-png');
        if (btnExportPng) {
            const newBtn = btnExportPng.cloneNode(true);
            btnExportPng.parentNode.replaceChild(newBtn, btnExportPng);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExportPng();
            });
        }
    });

    function handleExportPng() {
        // ===== 1. PRO 状态检测（原逻辑不动）=====
        let isPro = false;
        if (typeof window.checkIsProActive === 'function') {
            isPro = window.checkIsProActive();
        } else {
            try {
                const savedPro = localStorage.getItem('pixelsprite_pro_state_v3');
                if (savedPro && JSON.parse(savedPro).isLifetimePro) isPro = true;
            } catch (e) { }
            if (!isPro && document.getElementById('btn-header-buy-pro')?.innerHTML.includes('PRO 终身')) {
                isPro = true;
            }
        }

        const resX = parseInt(document.getElementById('res-custom-x')?.value) || 32;
        const resY = parseInt(document.getElementById('res-custom-y')?.value) || 32;

        const exportScale = isPro ? 16 : 8;
        const innerW = resX * exportScale;
        const innerH = resY * exportScale;

        // ===== 2. 创建临时画布 =====
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = innerW;
        tempCanvas.height = innerH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = false;

        // 🚨 方案 A 核心修改：从 DOM 读取真实背景模式，透明模式不填任何颜色
        const bgModeSelect = document.getElementById('select-bg-mode');
        const currentBgMode = bgModeSelect ? bgModeSelect.value : 'checkered'; // checkered | solid
        const bgColorInput = document.getElementById('bg-color-picker');
        const currentSolidColor = bgColorInput ? bgColorInput.value : '#ffffff';

        // ✅ 只有用户明确选择 solid 纯色背景时才填底色
        // ✅ 透明/棋盘格模式：什么都不画，保持 alpha 透明
        if (currentBgMode === 'solid') {
            tempCtx.fillStyle = currentSolidColor;
            tempCtx.fillRect(0, 0, innerW, innerH);
        }

        // ===== 3. 把像素画布画上去（保留 alpha）=====
        const pixelCanvas = document.getElementById('pixel-canvas');
        if (pixelCanvas) {
            tempCtx.drawImage(pixelCanvas, 0, 0, innerW, innerH);
        }

        // ===== 4. 组装最终导出画布 =====
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');

        if (isPro) {
            // PRO：直接输出，保留透明
            exportCanvas.width = innerW;
            exportCanvas.height = innerH;
            ctx.drawImage(tempCanvas, 0, 0);
        } else {
            // 免费版：加水印（灰底 + 底部条），本来就不透明
            const padding = Math.max(16, Math.floor(innerW * 0.1));
            const footerHeight = Math.max(50, Math.floor(innerW * 0.25));
            exportCanvas.width = innerW + padding * 2;
            exportCanvas.height = innerH + padding + footerHeight;

            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            ctx.drawImage(tempCanvas, padding, padding);

            const footerY = exportCanvas.height - footerHeight;
            ctx.fillStyle = '#050b14';
            ctx.fillRect(0, footerY, exportCanvas.width, footerHeight);
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(0, footerY, exportCanvas.width, 3);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const titleSize = Math.max(14, Math.floor(exportCanvas.width * 0.05));
            const subSize = Math.max(10, Math.floor(exportCanvas.width * 0.03));

            ctx.fillStyle = '#00f2fe';
            ctx.font = `bold ${titleSize}px 'Outfit', sans-serif`;
            ctx.fillText('👑 Made with PixelSprite Pro', exportCanvas.width / 2, footerY + footerHeight * 0.35);

            ctx.fillStyle = '#94a3b8';
            ctx.font = `bold ${subSize}px sans-serif`;
            ctx.fillText('Unlock 16x HD Export & Remove Watermark for $19.99', exportCanvas.width / 2, footerY + footerHeight * 0.75);
        }

        // ===== 5. 导出文件名 & 保存（原逻辑不动）=====
        const filename = isPro ? `pixelsprite_pro_${resX}x${resY}.png` : `pixelsprite_free_${resX}x${resY}.png`;
        const dataUrl = exportCanvas.toDataURL('image/png');

        if (window.promptSaveFilePicker) {
            window.promptSaveFilePicker(dataUrl, filename, [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]).then(status => {
                if (status === 'cancel') return;
                if (typeof window.showExportModal === 'function') {
                    window.showExportModal(dataUrl, filename, isPro ? 'PRO 纯净原图' : '免费版（含水印）', isPro ? '✨ PRO 导出成功！' : '✨ 免费版导出成功！', '您可以点击下方按钮浏览本地路径。');
                }
            });
        } else {
            saveFileAsync(dataUrl, filename, isPro);
        }

        if (typeof window.showToast === 'function') {
            window.showToast(isPro ? '✨ PRO 原图已导出！' : '⚠️ 免费版已导出，带有水印！');
        }
    }

    // 这是一个纯前端强行拉起“另存为”窗口的终极兜底方案
    async function saveFileAsync(dataUrl, filename, isPro) {
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
                });
                const writable = await handle.createWritable();
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                await writable.write(blob);
                await writable.close();
                if (typeof window.showExportModal === 'function') {
                    window.showExportModal(dataUrl, filename, isPro ? 'PRO 纯净原图' : '免费版', '✨ 导出成功！', '已保存到本地。');
                }
            } else {
                // 极度古老浏览器降级
                const a = document.createElement('a');
                a.href = dataUrl; a.download = filename;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('保存失败', err);
                const a = document.createElement('a');
                a.href = dataUrl; a.download = filename;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }
        }
    }
})();