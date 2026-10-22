// ============================================================
// 🧩 Addon 4: 高级编辑与智能导入 (图片导入 / 选区缩放 / 快捷键)
// ============================================================
(function () {
    'use strict';

    window.addEventListener('load', () => {

        // ==========================================
        // 功能 A：智能导入图片 (自动匹配画布尺寸，防止拉伸)
        // ==========================================
        const fileImportInput = document.getElementById('file-import-input');
        if (fileImportInput) {
            // 克隆替换，清除 app.js 原有的绑定
            const newInput = fileImportInput.cloneNode(true);
            fileImportInput.parentNode.replaceChild(newInput, fileImportInput);

            newInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;

                if (file.name.endsWith('.pixelsprite') || file.name.endsWith('.json')) {
                    if (typeof window.showToast === 'function') window.showToast('⚠️ 工程文件导入请刷新页面后使用原版功能。');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // 1. 自动检测图片原尺寸，并强制应用新分辨率
                        let targetW = Math.max(4, Math.min(512, img.naturalWidth));
                        let targetH = Math.max(4, Math.min(512, img.naturalHeight));

                        // 调用 app.js 暴露的全局方法
                        const resXInput = document.getElementById('res-custom-x');
                        const resYInput = document.getElementById('res-custom-y');
                        const btnApplyRes = document.getElementById('btn-apply-custom-res');

                        if (resXInput && resYInput && btnApplyRes) {
                            resXInput.value = targetW;
                            resYInput.value = targetH;
                            btnApplyRes.click(); // 触发画布尺寸重设
                        }

                        // 2. 绘制到当前画布
                        setTimeout(() => {
                            const rawCanvas = document.createElement('canvas');
                            rawCanvas.width = targetW;
                            rawCanvas.height = targetH;
                            const rawCtx = rawCanvas.getContext('2d');
                            rawCtx.imageSmoothingEnabled = false;
                            rawCtx.drawImage(img, 0, 0, targetW, targetH);
                            const imgData = rawCtx.getImageData(0, 0, targetW, targetH).data;

                            // 模拟前端画笔去画像素
                            const pixelCanvas = document.getElementById('pixel-canvas');
                            if (!pixelCanvas) return;
                            const ctx = pixelCanvas.getContext('2d');
                            const cellW = pixelCanvas.width / targetW;
                            const cellH = pixelCanvas.height / targetH;

                            // 清除画布
                            ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

                            // 逐像素绘制
                            for (let y = 0; y < targetH; y++) {
                                for (let x = 0; x < targetW; x++) {
                                    const idx = (y * targetW + x) * 4;
                                    const a = imgData[idx + 3];
                                    if (a > 20) {
                                        const r = imgData[idx];
                                        const g = imgData[idx + 1];
                                        const b = imgData[idx + 2];
                                        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
                                        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
                                    }
                                }
                            }

                            if (typeof window.showToast === 'function') {
                                window.showToast(`✨ 图片已无损导入！画布已自动调整为 ${targetW}×${targetH}`);
                            }
                        }, 100); // 给 app.js 一点时间重设画布
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // ==========================================
        // 功能 B：选区 2x 放大 / 0.5x 缩小 (快捷键与按钮)
        // ==========================================
        const btnScale2x = document.getElementById('btn-scale-2x');
        const btnScaleHalf = document.getElementById('btn-scale-half');

        if (btnScale2x) {
            btnScale2x.style.display = 'inline-flex'; // 强制显示
            btnScale2x.onclick = () => {
                if (typeof window.scaleSelection === 'function') {
                    window.scaleSelection(2.0, 2.0);
                } else {
                    if (typeof window.showToast === 'function') window.showToast('⚠️ 请先用选区工具框选一块区域');
                }
            };
        }

        if (btnScaleHalf) {
            btnScaleHalf.style.display = 'inline-flex'; // 强制显示
            btnScaleHalf.onclick = () => {
                if (typeof window.scaleSelection === 'function') {
                    window.scaleSelection(0.5, 0.5);
                } else {
                    if (typeof window.showToast === 'function') window.showToast('⚠️ 请先用选区工具框选一块区域');
                }
            };
        }

        // ==========================================
        // 功能 C：快捷键增强 ( [ ] 调画笔粗细，Ctrl+D 取消选区 )
        // ==========================================
        window.addEventListener('keydown', (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            if (isInput) return;

            // 1. [ ] 键调节画笔
            if (e.key === '[' || e.key === ']') {
                // 读取当前选中的画笔粗细按钮
                const activeSizeBtn = document.querySelector('.size-btn.active');
                if (!activeSizeBtn) return;

                const currentSize = parseInt(activeSizeBtn.dataset.size) || 1;
                const allSizes = Array.from(document.querySelectorAll('.size-btn')).map(b => parseInt(b.dataset.size)).sort((a, b) => a - b);

                let newSize = currentSize;
                if (e.key === ']') {
                    // 放大
                    const nextSize = allSizes.find(s => s > currentSize);
                    if (nextSize) newSize = nextSize;
                } else {
                    // 缩小
                    const prevSizes = allSizes.filter(s => s < currentSize);
                    if (prevSizes.length > 0) newSize = prevSizes[prevSizes.length - 1];
                }

                if (newSize !== currentSize) {
                    const targetBtn = document.querySelector(`.size-btn[data-size="${newSize}"]`);
                    if (targetBtn) targetBtn.click();
                }
                e.preventDefault();
            }

            // 2. Ctrl+D 取消选区 (替代浏览器默认的收藏行为)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                const btnDeselect = document.getElementById('btn-deselect');
                if (btnDeselect && btnDeselect.style.display !== 'none') {
                    btnDeselect.click();
                }
            }
        });

        console.log('✅ 高级编辑与智能导入 (Addon) 已加载！');
    });
})();