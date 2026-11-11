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

    window.handleExportPng = handleExportPng;

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

        const scaleSelect = document.getElementById('select-png-scale');
        const exportScale = scaleSelect ? (parseInt(scaleSelect.value) || 1) : 1;
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
        if (typeof window.getCompositedFrameBuffer === 'function' && window.engine) {
            const buf = window.getCompositedFrameBuffer();
            window.engine.renderToCanvas(buf, tempCanvas, currentBgMode !== 'solid');
        } else {
            const pixelCanvas = document.getElementById('pixel-canvas');
            if (pixelCanvas) {
                tempCtx.drawImage(pixelCanvas, 0, 0, innerW, innerH);
            }
        }

        // ===== 4. 组装最终导出画布 =====
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        if (isPro) {
            // PRO：直接输出，保留透明
            exportCanvas.width = innerW;
            exportCanvas.height = innerH;
            ctx.drawImage(tempCanvas, 0, 0);
        } else {
            // 免费版：底部加水印条，但像素画主体区域背景必须保持 100% 透明！
            const footerHeight = Math.max(36, Math.floor(innerH * 0.15));
            const canvasW = Math.max(innerW, 220);
            exportCanvas.width = canvasW;
            exportCanvas.height = innerH + footerHeight;

            // ✅ 关键：只有纯色模式才填底色；透明模式绝不填底色，完全保留 alpha！
            if (currentBgMode === 'solid') {
                ctx.fillStyle = currentSolidColor;
                ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            }

            // 把透明像素画居中绘制在上方
            const spriteX = Math.floor((canvasW - innerW) / 2);
            ctx.drawImage(tempCanvas, spriteX, 0);

            // 仅在底部绘制深色水印条
            const footerY = innerH;
            ctx.fillStyle = '#050b14';
            ctx.fillRect(0, footerY, exportCanvas.width, footerHeight);
            ctx.fillStyle = '#00f2fe';
            ctx.fillRect(0, footerY, exportCanvas.width, 2);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const titleSize = Math.max(12, Math.floor(footerHeight * 0.35));
            const subSize = Math.max(10, Math.floor(footerHeight * 0.25));

            ctx.fillStyle = '#00f2fe';
            ctx.font = `bold ${titleSize}px 'Outfit', sans-serif`;
            ctx.fillText('👑 Made with PixelSprite Pro', exportCanvas.width / 2, footerY + footerHeight * 0.4);

            ctx.fillStyle = '#94a3b8';
            ctx.font = `normal ${subSize}px sans-serif`;
            ctx.fillText('Unlock PRO for Clean HD Export without Watermark', exportCanvas.width / 2, footerY + footerHeight * 0.75);
        }

        // ===== 5. 导出文件名 & 保存（原逻辑不动）=====
        const filename = isPro ? `pixelsprite_pro_${innerW}x${innerH}.png` : `pixelsprite_free_${innerW}x${innerH}.png`;
        const dataUrl = exportCanvas.toDataURL('image/png');

        const isEn = window.currentLang === 'en';
        const isJa = window.currentLang === 'ja';
        const modalTitle = isPro ?
            (isEn ? '✨ PRO Exported Successfully!' : isJa ? '✨ PRO 出力成功！' : '✨ PRO 导出成功！') :
            (isEn ? '✨ Free Version Exported!' : isJa ? '✨ 無料版出力成功！' : '✨ 免费版导出成功！');
        const modalDesc = isPro ?
            (isEn ? 'Exported high-res clean pixel art without watermark.' : isJa ? '透かしなしの高画質原画を出力しました。' : '您已导出纯净无水印原图。') :
            (isEn ? 'Click the button below to browse local save path.' : isJa ? '下のボタンをクリックしてローカル保存先を選択できます。' : '您可以点击下方按钮浏览本地路径。');

        if (window.promptSaveFilePicker) {
            window.promptSaveFilePicker(dataUrl, filename, [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]).then(status => {
                if (status === 'cancel') return;
                if (typeof window.showExportModal === 'function') {
                    window.showExportModal(dataUrl, filename, `PNG | ${innerW}x${innerH}px`, modalTitle, modalDesc);
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
        const isEn = window.currentLang === 'en';
        const isJa = window.currentLang === 'ja';
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
                    const badgeText = isPro ? (isEn ? 'PRO Clean HD' : isJa ? 'PRO 高画質原画' : 'PRO 纯净原图') : (isEn ? 'Free' : isJa ? '無料版' : '免费版');
                    const succTitle = isEn ? '✨ Exported Successfully!' : isJa ? '✨ 出力成功！' : '✨ 导出成功！';
                    const succDesc = isEn ? 'Saved to local disk.' : isJa ? 'ローカルに保存しました。' : '已保存到本地。';
                    window.showExportModal(dataUrl, filename, badgeText, succTitle, succDesc);
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