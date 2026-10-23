/**
 * @file PixelSprite Pro - Core Engine (app.js)
 * @version 2.9.0
 * @license Commercial
 * @author PixelSprite Pro Team
 * @description 核心像素绘图、多图层、时间轴与 PRO 功能引擎。
 * 
 * @architecture
 * 本文件采用严格模块化设计，通过 `#region` 注释进行区域划分。
 * 修改代码前请先确认所属 Region，切勿跨区域交叉修改。
 * 
 * @regions
 * [R0] 全局变量与 DOM 缓存 (Global State)
 * [R2] 核心画布与缩放引擎 (Canvas & Zoom)
 * [R3] 画笔与图形算法 (Drawing & Shapes)
 * [R4] 多图层管理系统 (Layer Stack)
 * [R5] 历史记录 Undo/Redo (History)
 * [R6] 选区与剪贴板 (Selection & Clipboard)
 * [R7] 动画时间轴与段落标签 (Timeline & Tags)
 * [R8] 导入导出与工程保存 (Export / Import)
 * [R9] PRO 高级特权与彩蛋 (PRO Tools)
 * [R10] 事件总线与初始化 (Event Bus & Init)
 */

const API_BASE_URL = 'https://pixelsprite-backend.onrender.com';

// 🚨 提升作用域：让最底部的代码也能找到这三个元素
const cloudHistoryModal = document.getElementById('cloud-history-modal');
const cloudHistoryList = document.getElementById('cloud-history-list');
const cloudHistoryEmpty = document.getElementById('cloud-history-empty');

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.userState) {
        window.userState = { ...window.userState, ...event.data.userState };
        try { localStorage.setItem('pixelsprite_google_user', JSON.stringify(window.userState)); } catch (e) { }

        const picker = document.getElementById('google-account-picker-modal');
        if (picker) picker.style.display = 'none';
        const gate = document.getElementById('mandatory-auth-gate');
        if (gate) gate.style.display = 'none';
        const loginModal = document.getElementById('google-login-modal');
        if (loginModal) loginModal.style.display = 'none';

        const pill = document.getElementById('user-profile-pill');
        if (pill) pill.style.display = 'flex';
        // 🚨 新增：隐藏顶部的登录按钮
        const hLoginBtn = document.getElementById('btn-header-login');
        if (hLoginBtn) hLoginBtn.style.display = 'none';

        const nameEl = document.getElementById('user-display-name');
        if (nameEl) nameEl.textContent = window.userState.username;

        const initials = (window.userState.username || 'P').charAt(0).toUpperCase();
        const badge = document.getElementById('user-avatar-badge');
        if (badge) badge.textContent = initials;

        if (typeof showToast === 'function') {
            showToast(`🎉 欢迎，${window.userState.username} (${window.userState.email})！Google 官方 SSO 验证登录成功！`);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Engine Instance
    const engine = new PixelEngine();

    // DOM Elements - Canvas & Main Viewport
    const pixelCanvas = document.getElementById('pixel-canvas');
    const gridCanvas = document.getElementById('grid-overlay');
    const symmetryCanvas = document.getElementById('symmetry-overlay');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvasContainerBox = document.querySelector('.canvas-container-box');

    // Canvas Dimensions Controls
    const resolutionSelect = document.getElementById('resolution-select');
    const resCustomX = document.getElementById('res-custom-x');
    const resCustomY = document.getElementById('res-custom-y');
    const btnApplyCustomRes = document.getElementById('btn-apply-custom-res');

    // Drawing Tools Buttons
    const drawToolBtns = document.querySelectorAll('.draw-tool-btn');
    const sizeBtns = document.querySelectorAll('.size-btn');
    const checkPixelPerfect = document.getElementById('check-pixel-perfect');
    const selectMirrorMode = document.getElementById('select-mirror-mode');
    const btnFlipH = document.getElementById('btn-flip-h');
    const btnFlipV = document.getElementById('btn-flip-v');
    const btnRotate90 = document.getElementById('btn-rotate-90');

    // Layer Stack Controls
    const layersContainer = document.getElementById('layers-container');
    const paramLayerOpacity = document.getElementById('param-layer-opacity');
    const valLayerOpacity = document.getElementById('val-layer-opacity');
    const btnAddLayer = document.getElementById('btn-add-layer');
    const btnDupLayer = document.getElementById('btn-dup-layer');
    const btnRenameLayer = document.getElementById('btn-rename-layer');
    const btnLayerUp = document.getElementById('btn-layer-up');
    const btnLayerDown = document.getElementById('btn-layer-down');
    const btnMergeLayer = document.getElementById('btn-merge-layer');
    const btnDelLayer = document.getElementById('btn-del-layer');

    // Canvas Background & Color Picker
    const selectBgMode = document.getElementById('select-bg-mode');
    const solidBgColorGroup = document.getElementById('solid-bg-color-group');
    const bgColorPicker = document.getElementById('bg-color-picker');

    const primaryColorPicker = document.getElementById('primary-color-picker');
    const activeColorIndicator = document.getElementById('active-color-indicator');
    const colorSpectrumCanvas = document.getElementById('color-spectrum-canvas');
    const hexColorInput = document.getElementById('hex-color-input');
    const recentColorsBar = document.getElementById('recent-colors-bar');
    const paletteSwatches = document.getElementById('palette-swatches');
    const btnAddSwatch = document.getElementById('btn-add-swatch');

    // Edit Toolbar Buttons
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnFrameClear = document.getElementById('btn-frame-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnPaste = document.getElementById('btn-paste');
    const btnScale2x = document.getElementById('btn-scale-2x');
    const btnScaleHalf = document.getElementById('btn-scale-half');
    const btnCommitSelection = document.getElementById('btn-commit-selection');
    const btnDeleteSelection = document.getElementById('btn-delete-selection');
    const btnSelectAll = document.getElementById('btn-select-all');
    const btnDeselect = document.getElementById('btn-deselect');

    const btnGrid = document.getElementById('btn-toggle-grid');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    // Project & Export
    const btnSaveProject = document.getElementById('btn-save-project');
    const btnImportProject = document.getElementById('btn-import-project');
    const fileImportInput = document.getElementById('file-import-input');
    const btnExportMain = document.getElementById('btn-export-main');
    const exportMenu = document.getElementById('export-menu');
    const exportArrow = document.getElementById('export-arrow');
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportGif = document.getElementById('btn-export-gif');
    const btnExportSheet = document.getElementById('btn-export-sheet');
    const btnExportJsonAtlas = document.getElementById('btn-export-json-atlas');
    const btnExportSvg = document.getElementById('btn-export-svg');

    // PRO Power Features Controls
    const btnOpenSlicer = document.getElementById('btn-open-slicer');
    const btnToggleTileMode = document.getElementById('btn-toggle-tile-mode');
    const btnOpenPixelate = document.getElementById('btn-open-pixelate');
    const btnOpenPaletteExtractor = document.getElementById('btn-open-palette-extractor');
    const btnColorHarmony = document.getElementById('btn-color-harmony');
    const btnPaletteSwap = document.getElementById('btn-palette-swap');
    const selectDitherPattern = document.getElementById('select-dither-pattern');
    const btnShadingLighten = document.getElementById('btn-shading-lighten');
    const btnShadingDarken = document.getElementById('btn-shading-darken');
    const btnRotspriteRotate = document.getElementById('btn-rotsprite-rotate');

    // Animation Timeline Controls (PRO)
    const timelineControlsWrapper = document.getElementById('timeline-controls-wrapper');
    const timelineProLockedBanner = document.getElementById('timeline-pro-locked-banner');
    const btnUnlockProTimeline = document.getElementById('btn-unlock-pro-timeline');
    const btnAnimPlay = document.getElementById('btn-anim-play');
    const btnAnimPrev = document.getElementById('btn-anim-prev');
    const btnAnimNext = document.getElementById('btn-anim-next');
    const selectLoopMode = document.getElementById('select-loop-mode');
    const btnFrameAdd = document.getElementById('btn-frame-add');
    const btnFrameDuplicate = document.getElementById('btn-frame-duplicate');
    const btnFrameDelete = document.getElementById('btn-frame-delete');
    const btnToggleOnion = document.getElementById('btn-toggle-onion');
    const checkOnionTint = document.getElementById('check-onion-tint');
    const inputFps = document.getElementById('param-fps');
    const valFps = document.getElementById('val-fps');
    const frameFilmstrip = document.getElementById('frame-filmstrip');

    // Modals
    const exportModal = document.getElementById('export-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalPreviewImg = document.getElementById('modal-preview-img');
    const modalBadge = document.getElementById('modal-badge');
    const modalDesc = document.getElementById('modal-desc');
    const modalDownloadLink = document.getElementById('modal-download-link');
    const modalClose = document.getElementById('modal-close');
    const btnModalClose = document.getElementById('btn-modal-close');
    const exportFilenameInput = document.getElementById('export-filename-input');
    const btnCustomPathSave = document.getElementById('btn-custom-path-save');

    const slicerModal = document.getElementById('slicer-modal');
    const slicerModalClose = document.getElementById('slicer-modal-close');
    const btnSlicerCancel = document.getElementById('btn-slicer-cancel');
    const slicerFileInput = document.getElementById('slicer-file-input');
    const slicerPreviewCanvas = document.getElementById('slicer-preview-canvas');
    const slicerFrameW = document.getElementById('slicer-frame-w');
    const slicerFrameH = document.getElementById('slicer-frame-h');
    const btnConfirmSlice = document.getElementById('btn-confirm-slice');

    const pixelateModal = document.getElementById('pixelate-modal');
    const pixelateModalClose = document.getElementById('pixelate-modal-close');
    const btnPixelateCancel = document.getElementById('btn-pixelate-cancel');
    const pixelateFileInput = document.getElementById('pixelate-file-input');
    const pixelatePreviewCanvas = document.getElementById('pixelate-preview-canvas');
    const paramQuantizeColors = document.getElementById('param-quantize-colors');
    const valQuantizeColors = document.getElementById('val-quantize-colors');
    const btnConfirmPixelate = document.getElementById('btn-confirm-pixelate');

    // ============================================================
    // #region [R0] 全局变量与 DOM 缓存
    // ============================================================
    // State Variables
    let activeTool = 'pencil'; // pencil, eraser, picker, bucket, line, rect, circle, select, move, shading
    let brushSize = 1; // 1, 2, 3
    // 👇 新增：动画段落标签的数据和选中状态
    let frameTags = [];
    let selectedFrames = [0];
    let lastClickedFrame = 0;
    let isPixelPerfect = true;
    let mirrorMode = 'none'; // none, horizontal, vertical, dual
    let activeColor = '#FFEA70';
    let secondaryColor = '#050B14'; // 👈 全局右键色
    window.secondaryColor = '#050B14'; // 👈 允许外挂 JS 修改
    let recentColors = ['#FFEA70', '#00F2FE', '#FF007F', '#38BDF8', '#4ADE80', '#F59E0B', '#FFFFFF', '#080A12'];
    let customPalette = ['#0f172a', '#1e293b', '#334155', '#475569', '#0284c7', '#38bdf8', '#7dd3fc', '#e0f2fe', '#fbbf24', '#f59e0b', '#d97706', '#92400e', '#ffffff', '#cbd5e1', '#64748b', '#0f172a'];

    // Canvas Background
    let bgMode = 'checkered'; // checkered, solid
    let solidBgColor = '#ffffff';

    // Multi-Frame & Multi-Layer Engine State
    let frameBuffers = []; // Array of composite buffers per frame
    let frameLayers = []; // Array of layer stacks per frame: [ [ { id, name, visible, opacity, buffer } ] ]
    let currentFrame = 0;
    let activeLayerIndex = 0;

    // Undo / Redo History Stacks
    let undoStack = [];
    let redoStack = [];
    const MAX_HISTORY = 50;

    // Selection & Clipboard
    let selection = null;
    let clipboard = null;
    let isSelectionDragCreating = false;
    let isSelectionMoved = false;

    // Drawing Interaction Variables
    let isMouseDown = false;
    let isRightClickStroke = false;
    let strokeStartX = -1;
    let strokeStartY = -1;
    let strokeCurrentX = -1;
    let strokeCurrentY = -1;
    let lastStrokeX = -1;
    let strokePoints = [];
    let isMovingLayerPixels = false;
    let movePixelStartX = -1;
    let movePixelStartY = -1;
    let moveInitialBufCopy = null;

    // PRO Feature States
    let isPlaying = false;
    let fps = 12;
    let loopMode = 'loop'; // loop, reverse, pingpong
    let playDirection = 1;
    let animTimer = null;
    let showOnionSkin = false;
    let onionSkinTint = false;
    let isTileMode = false;
    let ditherPattern = 'none'; // none, bayer2x2, bayer4x4, checkerboard

    // Zoom & Pan State
    let currentZoomIndex = 4; // Default 16x (scale 1.0)
    let zoomTranslateX = 0;
    let zoomTranslateY = 0;
    let showGrid = true;
    let isPanning = false; // 👈 加上这一行
    let isSpacePressed = false;
    let layerCustomNames = {};
    let cropBox = null; // { x, y, w, h }

    // 🚨 渲染锁：防止在画画时疯狂重建 DOM
    let isDrawingNow = false;

    // 节流函数，限制高频触发
    let lastGridDraw = 0;

    const cloudHistoryModal = document.getElementById('cloud-history-modal');
    const cloudHistoryClose = document.getElementById('cloud-history-close');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const cloudHistoryList = document.getElementById('cloud-history-list');
    const cloudHistoryEmpty = document.getElementById('cloud-history-empty');
    const btnOpenOldLoad = document.getElementById('btn-open-old-load');

    const ZOOM_LEVELS = [
        { label: '2x', scale: 0.125 },
        { label: '4x', scale: 0.25 },
        { label: '8x', scale: 0.5 },
        { label: '12x', scale: 0.75 },
        { label: '16x', scale: 1.0 },
        { label: '24x', scale: 1.5 },
        { label: '32x', scale: 2.0 },
        { label: '48x', scale: 3.0 },
        { label: '64x', scale: 4.0 }
    ];

    // User Auth & PRO Subscription State (PRESERVED)
    let userState = {
        isLoggedIn: false,
        email: '',
        displayName: '',
        username: '',
        avatar: '',
        isGoogleAuth: false
    };

    let proState = {
        isLifetimePro: false,
        trialStartTime: Date.now()
    };
    window.proState = proState;

    // ============================================================
    // 🚨 自动保存与恢复系统 (IndexedDB)
    // ============================================================
    const DB_NAME = 'PixelSpriteDB';
    const STORE_NAME = 'autosave';

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 保存当前工程到 IndexedDB
    async function saveDraftToDB() {
        // 如果画布是空的，没必要存
        if (!frameBuffers || frameBuffers.length === 0) return;

        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            // 把当前的所有状态打包
            const draft = {
                resX: engine.resX,
                resY: engine.resY,
                fps: fps,
                frameBuffers: frameBuffers,
                frameLayers: frameLayers,
                currentFrame: currentFrame,
                timestamp: Date.now()
            };

            store.put(draft, 'latest_draft');

            tx.oncomplete = () => {
                console.log(`💾 [自动保存] 草稿已安全存入 IndexedDB (${new Date().toLocaleTimeString()})`);
            };
        } catch (err) {
            console.error('自动保存失败:', err);
        }
    }

    // 从 IndexedDB 恢复草稿
    async function loadDraftFromDB() {
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('latest_draft');

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            return null;
        }
    }

    // ============================================================
    // INITIALIZATION & LAYER STACK ENGINE
    // ============================================================

    function init() {
        bindEvents();
        loadProState();
        updateCanvasDOMDimensions(engine.resX || 32, engine.resY || 32);
        resetAllFrameBuffersToTemplate();
        initColorSpectrum();
        updateRecentColorsUI();
        updatePaletteSwatchesUI();
        initUserAuthAndGoogleSystem();
        initProVIPSystem();
        initPixelProWalkerSystem();
        renderAll();
    }

    // ============================================================
    // #region [R4] 多图层管理系统 (Layer Stack)
    // ============================================================
    function resetAllFrameBuffersToTemplate() {
        commitSelection();
        frameBuffers = [];
        frameLayers = [];
        activeLayerIndex = 0;

        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;
        const baseBuf = engine.createBuffer(resX, resY);

        frameBuffers.push(baseBuf);
        frameLayers.push([
            {
                id: `layer_0_${Date.now()}`,
                name: 'Layer 1 (Background)',
                visible: true,
                opacity: 1.0,
                buffer: cloneBuffer(baseBuf)
            }
        ]);

        currentFrame = 0;
        undoStack = [];
        redoStack = [];
        updateHistoryUI();
    }

    function initFrameLayers(frameIdx = currentFrame) {
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;

        if (!frameLayers[frameIdx] || !Array.isArray(frameLayers[frameIdx]) || frameLayers[frameIdx].length === 0) {
            const buf = engine.createBuffer(resX, resY);
            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
            const bgName = `${dict.layer_default_name || '图层'} 1 ${dict.layer_bg_tag || '(背景)'}`;
            frameLayers[frameIdx] = [
                {
                    id: `layer_0_${Date.now()}_${frameIdx}`,
                    name: bgName,
                    visible: true,
                    opacity: 1.0,
                    buffer: buf
                }
            ];
        } else {
            frameLayers[frameIdx].forEach(layer => {
                if (!layer.buffer || layer.buffer.length !== resY || (layer.buffer[0] && layer.buffer[0].length !== resX)) {
                    const newBuf = engine.createBuffer(resX, resY);
                    if (layer.buffer) {
                        const minH = Math.min(layer.buffer.length, resY);
                        const minW = Math.min(layer.buffer[0] ? layer.buffer[0].length : 0, resX);
                        for (let y = 0; y < minH; y++) {
                            for (let x = 0; x < minW; x++) {
                                newBuf[y][x] = layer.buffer[y][x];
                            }
                        }
                    }
                    layer.buffer = newBuf;
                }
            });
        }
    }

    function getCurrentActiveBuffer() {
        initFrameLayers(currentFrame);
        const layers = frameLayers[currentFrame];
        if (activeLayerIndex >= layers.length) activeLayerIndex = layers.length - 1;
        if (activeLayerIndex < 0) activeLayerIndex = 0;
        const activeLayer = layers[activeLayerIndex];
        return activeLayer ? activeLayer.buffer : (frameBuffers[currentFrame] || engine.createBuffer());
    }

    function getCompositedFrameBuffer(frameIdx = currentFrame) {
        initFrameLayers(frameIdx);
        const layers = frameLayers[frameIdx];
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;

        if (!layers || layers.length === 0) return frameBuffers[frameIdx] || engine.createBuffer(resX, resY);

        const composited = engine.createBuffer(resX, resY);

        layers.forEach(layer => {
            if (layer.visible && layer.buffer) {
                const b = layer.buffer;
                const opacity = (layer.opacity !== undefined) ? layer.opacity : 1.0;
                if (opacity <= 0) return;

                for (let y = 0; y < Math.min(resY, b.length); y++) {
                    const row = b[y];
                    if (!row) continue;
                    for (let x = 0; x < Math.min(resX, row.length); x++) {
                        if (row[x]) {
                            composited[y][x] = row[x];
                        }
                    }
                }
            }
        });

        return composited;
    }

    function syncCurrentFrameBuffer() {
        for (let f = 0; f < frameBuffers.length; f++) {
            initFrameLayers(f);
            frameBuffers[f] = getCompositedFrameBuffer(f);
        }
    }

    function renderLayersUI() {
        if (!layersContainer) return;
        layersContainer.innerHTML = '';

        initFrameLayers(currentFrame);
        const layers = frameLayers[currentFrame];
        if (activeLayerIndex >= layers.length) activeLayerIndex = layers.length - 1;
        if (activeLayerIndex < 0) activeLayerIndex = 0;

        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const item = document.createElement('div');
            item.className = `layer-item ${i === activeLayerIndex ? 'active' : ''}`;
            item.dataset.layerIndex = i;

            const visBtn = document.createElement('button');
            visBtn.className = 'layer-vis-btn';
            visBtn.title = layer.visible ? '隐藏图层' : '显示图层';
            visBtn.textContent = layer.visible ? '👁️' : '🙈';
            visBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                renderLayersUI();
                renderMainCanvas();
            });

            const nameSpan = document.createElement('span');
            nameSpan.className = 'layer-name';
            nameSpan.textContent = layer.name;
            nameSpan.title = '双击即可直接输入重命名图层';

            const startInlineRename = (e) => {
                if (e) e.stopPropagation();
                const inlineInput = document.createElement('input');
                inlineInput.type = 'text';
                inlineInput.className = 'layer-rename-input';
                inlineInput.value = layer.name;

                let isCommitted = false;
                const finishEdit = () => {
                    if (isCommitted) return;
                    isCommitted = true;
                    const trimmed = inlineInput.value.trim();
                    if (trimmed) {
                        layer.name = trimmed;
                        if (layer.id) {
                            layerCustomNames[layer.id] = trimmed;
                        }
                        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
                        showToast((dict.layer_renamed || '✏️ 图层重命名为 {name}').replace('{name}', layer.name));
                    }
                    renderLayersUI();
                };

                inlineInput.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') finishEdit();
                    if (evt.key === 'Escape') renderLayersUI();
                });
                inlineInput.addEventListener('blur', finishEdit);

                if (nameSpan.parentNode === item) {
                    item.replaceChild(inlineInput, nameSpan);
                    inlineInput.focus();
                    inlineInput.select();
                }
            };

            nameSpan.addEventListener('dblclick', startInlineRename);
            item._triggerRename = startInlineRename;

            const activeDot = document.createElement('span');
            activeDot.className = 'layer-active-dot';
            activeDot.textContent = (i === activeLayerIndex) ? '●' : '';

            item.appendChild(visBtn);
            item.appendChild(nameSpan);
            item.appendChild(activeDot);

            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT') return;
                activeLayerIndex = i;
                if (paramLayerOpacity) {
                    paramLayerOpacity.value = Math.round((layer.opacity !== undefined ? layer.opacity : 1) * 100);
                }
                if (valLayerOpacity) {
                    valLayerOpacity.textContent = `${paramLayerOpacity ? paramLayerOpacity.value : 100}%`;
                }
                renderLayersUI();
                renderMainCanvas();
            });

            layersContainer.appendChild(item);
        }

        const activeLayer = layers[activeLayerIndex];
        if (activeLayer && paramLayerOpacity) {
            paramLayerOpacity.value = Math.round((activeLayer.opacity !== undefined ? activeLayer.opacity : 1) * 100);
            if (valLayerOpacity) valLayerOpacity.textContent = `${paramLayerOpacity.value}%`;
        }
    }
    // #endregion [R4] 多图层管理系统 (Layer Stack)

    // ============================================================
    // #region [R5] 历史记录 Undo / Redo
    // ============================================================
    function pushHistoryState() {
        for (let f = 0; f < frameBuffers.length; f++) {
            initFrameLayers(f);
        }
        syncCurrentFrameBuffer();

        const snapshot = {
            resX: engine.resX || 32,
            resY: engine.resY || 32,
            currentFrame: currentFrame,
            activeLayerIndex: activeLayerIndex,
            frameBuffers: frameBuffers.map(buf => cloneBuffer(buf)),
            frameLayers: cloneLayersStack(frameLayers)
        };

        undoStack.push(snapshot);
        if (undoStack.length > MAX_HISTORY) {
            undoStack.shift();
        }
        redoStack = [];
        updateHistoryUI();
    }

    function undo() {
        commitSelection();
        if (undoStack.length === 0) {
            showToast('⚠️ 没有可撤销的历史记录');
            return;
        }
        stopAnimation();

        for (let f = 0; f < frameBuffers.length; f++) {
            initFrameLayers(f);
        }
        syncCurrentFrameBuffer();

        const currentSnapshot = {
            resX: engine.resX || 32,
            resY: engine.resY || 32,
            currentFrame: currentFrame,
            activeLayerIndex: activeLayerIndex,
            frameBuffers: frameBuffers.map(buf => cloneBuffer(buf)),
            frameLayers: cloneLayersStack(frameLayers)
        };
        redoStack.push(currentSnapshot);

        const state = undoStack.pop();

        if (state.resX && state.resY && (engine.resX !== state.resX || engine.resY !== state.resY)) {
            engine.resX = state.resX;
            engine.resY = state.resY;
            engine.resolution = Math.max(state.resX, state.resY);
            updateCanvasDOMDimensions(state.resX, state.resY);
            if (resCustomX) resCustomX.value = state.resX;
            if (resCustomY) resCustomY.value = state.resY;
            if (resolutionSelect) {
                const presetOpts = Array.from(resolutionSelect.options).map(o => o.value);
                resolutionSelect.value = (state.resX === state.resY && presetOpts.includes(String(state.resX))) ? String(state.resX) : 'custom';
            }
        }

        if (state.frameBuffers && Array.isArray(state.frameBuffers)) {
            frameBuffers = state.frameBuffers.map(buf => cloneBuffer(buf));
        }
        if (state.frameLayers && Array.isArray(state.frameLayers)) {
            frameLayers = cloneLayersStack(state.frameLayers);
        }

        currentFrame = Math.min(state.currentFrame || 0, Math.max(0, frameBuffers.length - 1));
        const curLayers = frameLayers[currentFrame] || [];
        activeLayerIndex = Math.min(state.activeLayerIndex !== undefined ? state.activeLayerIndex : 0, Math.max(0, curLayers.length - 1));

        syncCurrentFrameBuffer();
        renderAll();
        updateHistoryUI();
        showToast('↩️ 已成功撤销上一步画布操作');
    }

    function redo() {
        commitSelection();
        if (redoStack.length === 0) {
            showToast('⚠️ 没有可重做的历史记录');
            return;
        }
        stopAnimation();

        for (let f = 0; f < frameBuffers.length; f++) {
            initFrameLayers(f);
        }
        syncCurrentFrameBuffer();

        const currentSnapshot = {
            resX: engine.resX || 32,
            resY: engine.resY || 32,
            currentFrame: currentFrame,
            activeLayerIndex: activeLayerIndex,
            frameBuffers: frameBuffers.map(buf => cloneBuffer(buf)),
            frameLayers: cloneLayersStack(frameLayers)
        };
        undoStack.push(currentSnapshot);

        const state = redoStack.pop();

        if (state.resX && state.resY && (engine.resX !== state.resX || engine.resY !== state.resY)) {
            engine.resX = state.resX;
            engine.resY = state.resY;
            engine.resolution = Math.max(state.resX, state.resY);
            updateCanvasDOMDimensions(state.resX, state.resY);
            if (resCustomX) resCustomX.value = state.resX;
            if (resCustomY) resCustomY.value = state.resY;
            if (resolutionSelect) {
                const presetOpts = Array.from(resolutionSelect.options).map(o => o.value);
                resolutionSelect.value = (state.resX === state.resY && presetOpts.includes(String(state.resX))) ? String(state.resX) : 'custom';
            }
        }

        if (state.frameBuffers && Array.isArray(state.frameBuffers)) {
            frameBuffers = state.frameBuffers.map(buf => cloneBuffer(buf));
        }
        if (state.frameLayers && Array.isArray(state.frameLayers)) {
            frameLayers = cloneLayersStack(state.frameLayers);
        }

        currentFrame = Math.min(state.currentFrame || 0, Math.max(0, frameBuffers.length - 1));
        const curLayers = frameLayers[currentFrame] || [];
        activeLayerIndex = Math.min(state.activeLayerIndex !== undefined ? state.activeLayerIndex : 0, Math.max(0, curLayers.length - 1));

        syncCurrentFrameBuffer();
        renderAll();
        updateHistoryUI();
        showToast('↪️ 已成功重做上一步画布操作');
    }

    function updateHistoryUI() {
        if (btnUndo) {
            btnUndo.style.opacity = undoStack.length > 0 ? '1' : '0.4';
            btnUndo.style.cursor = undoStack.length > 0 ? 'pointer' : 'not-allowed';
        }
        if (btnRedo) {
            btnRedo.style.opacity = redoStack.length > 0 ? '1' : '0.4';
            btnRedo.style.cursor = redoStack.length > 0 ? 'pointer' : 'not-allowed';
        }
    }

    function cloneBuffer(buf) {
        if (!buf) return engine.createBuffer();
        return buf.map(row => [...row]);
    }

    function cloneLayersStack(layersStack) {
        if (!layersStack || !Array.isArray(layersStack)) return [];
        return layersStack.map(frame => {
            if (!frame || !Array.isArray(frame)) return [];
            return frame.map(layer => {
                const customName = (layer.id && layerCustomNames[layer.id]) ? layerCustomNames[layer.id] : layer.name;
                return {
                    id: layer.id,
                    name: customName,
                    visible: layer.visible,
                    opacity: layer.opacity !== undefined ? layer.opacity : 1.0,
                    buffer: cloneBuffer(layer.buffer)
                };
            });
        });
    }
    // #endregion [R5] 历史记录 Undo/Redo (History)

    // ============================================================
    // #region [R2] 核心画布与缩放引擎 (Zoom & Pan)
    // ============================================================
    function clampCanvasTransform() {
        if (!canvasContainerBox || !canvasWrapper) return;
        const zoomItem = ZOOM_LEVELS[currentZoomIndex];
        const scale = zoomItem ? zoomItem.scale : 1.0;

        const containerW = canvasContainerBox.clientWidth || 600;
        const containerH = canvasContainerBox.clientHeight || 500;

        // Constrain pan translation so canvas center stays bounded inside viewport box
        const limitX = Math.max(40, (containerW / 2) - 30);
        const limitY = Math.max(40, (containerH / 2) - 30);

        zoomTranslateX = Math.max(-limitX, Math.min(limitX, zoomTranslateX));
        zoomTranslateY = Math.max(-limitY, Math.min(limitY, zoomTranslateY));
    }

    function applyCanvasTransform(animate = true) {
        const zoomItem = ZOOM_LEVELS[currentZoomIndex];
        if (canvasWrapper) {
            // 🚨 恢复缩放逻辑，同时保留平移
            canvasWrapper.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(${zoomItem.scale})`;
            canvasWrapper.style.transformOrigin = 'center center';
            canvasWrapper.style.transition = animate ? 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        }
        const valSpan = document.getElementById('zoom-value');
        if (valSpan) valSpan.textContent = zoomItem.label;
    }

    function setZoomLevel(targetIndex, focalPoint = null) {
        const minIdx = 0;
        const maxIdx = ZOOM_LEVELS.length - 1;
        targetIndex = Math.max(minIdx, Math.min(maxIdx, targetIndex));

        if (targetIndex === currentZoomIndex) return;

        const oldScale = ZOOM_LEVELS[currentZoomIndex].scale;
        const newScale = ZOOM_LEVELS[targetIndex].scale;

        // 🚨 核心修复：获取鼠标相对画布容器的坐标（而不是相对页面）
        if (focalPoint) {
            // 必须减去容器的偏移量
            const rect = canvasContainerBox.getBoundingClientRect();
            const mx = focalPoint.clientX - rect.left - rect.width / 2;
            const my = focalPoint.clientY - rect.top - rect.height / 2;

            // 计算缩放比例
            const scaleRatio = newScale / oldScale;

            // 标准数学公式：新平移 = 鼠标坐标 - (鼠标坐标 - 旧平移) * 缩放率
            zoomTranslateX = mx - (mx - zoomTranslateX) * scaleRatio;
            zoomTranslateY = my - (my - zoomTranslateY) * scaleRatio;
        }

        currentZoomIndex = targetIndex;
        applyCanvasTransform(true);
    }

    function zoomIn(focalPoint = null) { setZoomLevel(currentZoomIndex + 1, focalPoint); }
    function zoomOut(focalPoint = null) { setZoomLevel(currentZoomIndex - 1, focalPoint); }
    function resetZoom() {
        zoomTranslateX = 0;
        zoomTranslateY = 0;
        setZoomLevel(4);
        applyCanvasTransform(true);
        showToast('🔍 缩放已重置为 16x');
    }
    // #endregion [R2] 核心画布与缩放引擎 (Zoom & Pan)

    // ============================================================
    // #region [R3] 画笔与图形算法 (Drawing & Shapes)
    // ============================================================
    function getPixelCoords(e) {
        const rect = pixelCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;

        let x = Math.floor((clientX - rect.left) / (rect.width / resX));
        let y = Math.floor((clientY - rect.top) / (rect.height / resY));

        x = Math.max(0, Math.min(resX - 1, x));
        y = Math.max(0, Math.min(resY - 1, y));

        return { x, y };
    }

    function setPixelSymmetric(buf, x, y, color) {
        if (!buf) return;
        const resY = buf.length;
        const resX = (buf[0] && buf[0].length) ? buf[0].length : (engine.resX || engine.resolution || 32);

        const applyStamp = (px, py) => {
            if (px < 0 || px >= resX || py < 0 || py >= resY) return;
            for (let sy = 0; sy < brushSize; sy++) {
                for (let sx = 0; sx < brushSize; sx++) {
                    const targetX = px + sx;
                    const targetY = py + sy;
                    if (targetX >= 0 && targetX < resX && targetY >= 0 && targetY < resY) {
                        if (selection && !isInsideSelection(targetX, targetY)) {
                            continue;
                        }
                        if (buf[targetY]) {
                            if (isTileMode) {
                                const tx = ((targetX % resX) + resX) % resX;
                                const ty = ((targetY % resY) + resY) % resY;
                                if (buf[ty]) buf[ty][tx] = color;
                            } else {
                                buf[targetY][targetX] = color;
                            }
                        }
                    }
                }
            }
        };

        applyStamp(x, y);

        if (mirrorMode === 'horizontal' || mirrorMode === 'dual') {
            const mx = resX - 1 - x - (brushSize - 1);
            applyStamp(mx, y);
        }
        if (mirrorMode === 'vertical' || mirrorMode === 'dual') {
            const my = resY - 1 - y - (brushSize - 1);
            applyStamp(x, my);
        }
        if (mirrorMode === 'dual') {
            const mx = resX - 1 - x - (brushSize - 1);
            const my = resY - 1 - y - (brushSize - 1);
            applyStamp(mx, my);
        }
    }

    function handleStrokeStart(x, y, isRightClick, e) {
        if (isSpacePressed) {
            return false;
        }

        // Advanced palette: waiting for the user to click the color to replace
        if (paletteSwapPending && !isRightClick) {
            performPaletteSwapAt(x, y);
            return false;
        }

        if (activeTool === 'move') {
            if (isRightClick) return true;
            if (selection) {
                if (!selection.isFloating) liftSelectionToFloating();
                selection.isDragging = true;
                selection.dragStartX = x;
                selection.dragStartY = y;
                selection.startOffsetX = selection.offsetX || 0;
                selection.startOffsetY = selection.offsetY || 0;
                startSelectionAnimation();
                return true;
            }
            pushHistoryState();
            const buf = getCurrentActiveBuffer();
            if (!buf) return false;
            isMovingLayerPixels = true;
            movePixelStartX = x;
            movePixelStartY = y;
            moveInitialBufCopy = buf.map(row => [...row]);
            return true;
        }

        initFrameLayers(currentFrame);
        const layers = frameLayers[currentFrame];
        if (layers && layers[activeLayerIndex] && !layers[activeLayerIndex].visible) {
            layers[activeLayerIndex].visible = true;
            renderLayersUI();
        }

        const buf = getCurrentActiveBuffer();
        if (!buf) return false;

        if (activeTool !== 'picker' && activeTool !== 'select') {
            pushHistoryState();
        }

        lastStrokeX = x;
        lastStrokeY = y;
        strokePoints = [{ x, y }];

        if (activeTool === 'select') {
            const clientX = e ? (e.touches ? e.touches[0].clientX : e.clientX) : 0;
            const clientY = e ? (e.touches ? e.touches[0].clientY : e.clientY) : 0;

            isSelectionDragCreating = false;
            isSelectionMoved = false;

            if (selection) {
                const handle = getSelectionHandleAt(clientX, clientY);
                if (handle) {
                    if (!selection.isFloating) liftSelectionToFloating();
                    const rect = pixelCanvas.getBoundingClientRect();
                    const resX = engine.resX || engine.resolution || 32;
                    const resY = engine.resY || engine.resolution || 32;
                    const cellW_screen = rect.width / resX;
                    const cellH_screen = rect.height / resY;

                    selection.isResizing = true;
                    selection.resizeHandle = handle;
                    selection.startClientX = clientX;
                    selection.startClientY = clientY;
                    selection.startFx = (clientX - rect.left) / cellW_screen;
                    selection.startFy = (clientY - rect.top) / cellH_screen;
                    selection.startBounds = {
                        sx: selection.x + (selection.offsetX || 0),
                        sy: selection.y + (selection.offsetY || 0),
                        sw: selection.w,
                        sh: selection.h,
                        origOffsetX: selection.offsetX || 0,
                        origOffsetY: selection.offsetY || 0
                    };
                    startSelectionAnimation();
                    drawGridOverlay();
                    return true;
                }

                if (isInsideSelectionBox(x, y)) {
                    if (!selection.isFloating) liftSelectionToFloating();
                    selection.isDragging = true;
                    selection.dragStartX = x;
                    selection.dragStartY = y;
                    selection.startOffsetX = selection.offsetX || 0;
                    selection.startOffsetY = selection.offsetY || 0;
                    startSelectionAnimation();
                    return true;
                }

                // Clicked outside existing selection:
                // Commit previous floating selection if any, then clear it
                if (selection.isFloating) commitSelection();
                else selection = null;
                updateSelectionToolbarUI();
                renderAll();

                // Prepare to drag a new selection box from this starting spot
                isSelectionDragCreating = true;
                isSelectionMoved = false;
                strokeStartX = x;
                strokeStartY = y;
                strokeCurrentX = x;
                strokeCurrentY = y;
                startSelectionAnimation();
            } else {
                isSelectionDragCreating = true;
                isSelectionMoved = false;
                strokeStartX = x;
                strokeStartY = y;
                strokeCurrentX = x;
                strokeCurrentY = y;
                startSelectionAnimation();
            }
            return true;
        }

        if (activeTool === 'pencil') {
            const drawColor = isRightClickStroke ? secondaryColor : activeColor;
            const colorToDraw = (ditherPattern !== 'none' && checkIsProActive()) ? getDitherColor(x, y, drawColor) : drawColor;
            setPixelSymmetric(buf, x, y, colorToDraw);
            pushRecentColor(drawColor);
        } else if (activeTool === 'eraser') {
            setPixelSymmetric(buf, x, y, null);
        } else if (activeTool === 'shading') {
            applyShadingBrush(buf, x, y, isRightClick);
        } else if (activeTool === 'picker') {
            const compositeBuf = getCompositedFrameBuffer(currentFrame);
            const picked = (compositeBuf[y] && compositeBuf[y][x]) ? compositeBuf[y][x] : buf[y][x];
            if (picked) setActiveColor(picked);
        } else if (activeTool === 'bucket') {
            const compositedBuf = getCompositedFrameBuffer(currentFrame);
            floodFill(buf, x, y, activeColor, compositedBuf);
            pushRecentColor(activeColor);
        }

        frameBuffers[currentFrame] = getCompositedFrameBuffer(currentFrame);
        renderMainCanvas();
        return true;
    }

    function handleStrokeMove(x, y, e) {
        if (!isMouseDown || isSpacePressed) return;

        if (activeTool === 'move') {
            if (selection && selection.isDragging) {
                const dx = x - selection.dragStartX;
                const dy = y - selection.dragStartY;
                selection.offsetX = selection.startOffsetX + dx;
                selection.offsetY = selection.startOffsetY + dy;
                renderMainCanvas();
                drawGridOverlay();
                return;
            }

            if (isMovingLayerPixels && moveInitialBufCopy) {
                const dx = x - movePixelStartX;
                const dy = y - movePixelStartY;
                const resX = engine.resX || 32;
                const resY = engine.resY || 32;
                const buf = getCurrentActiveBuffer();

                for (let ry = 0; ry < resY; ry++) {
                    for (let rx = 0; rx < resX; rx++) {
                        buf[ry][rx] = null;
                    }
                }

                for (let ry = 0; ry < resY; ry++) {
                    for (let rx = 0; rx < resX; rx++) {
                        const col = moveInitialBufCopy[ry][rx];
                        if (col !== null) {
                            const tx = rx + dx;
                            const ty = ry + dy;
                            if (tx >= 0 && tx < resX && ty >= 0 && ty < resY) {
                                buf[ty][tx] = col;
                            }
                        }
                    }
                }

                frameBuffers[currentFrame] = getCompositedFrameBuffer(currentFrame);
                renderMainCanvas();
                drawGridOverlay();
                return;
            }
        }

        const buf = getCurrentActiveBuffer();
        if (!buf) return;

        if (activeTool === 'select') {
            if (strokeStartX >= 0 && (x !== strokeStartX || y !== strokeStartY)) {
                isSelectionMoved = true;
            }
            if (selection && selection.isResizing) {
                const rect = pixelCanvas.getBoundingClientRect();
                const resX = engine.resX || engine.resolution || 32;
                const resY = engine.resY || engine.resolution || 32;
                const cellW_screen = rect.width / resX;
                const cellH_screen = rect.height / resY;
                const clientX = e ? (e.touches ? e.touches[0].clientX : e.clientX) : 0;
                const clientY = e ? (e.touches ? e.touches[0].clientY : e.clientY) : 0;

                const curFx = (clientX - rect.left) / cellW_screen;
                const curFy = (clientY - rect.top) / cellH_screen;

                const dfx = Math.round(curFx - selection.startFx);
                const dfy = Math.round(curFy - selection.startFy);

                const b = selection.startBounds;
                let newSx = b.sx;
                let newSy = b.sy;
                let newSw = b.sw;
                let newSh = b.sh;
                const handle = selection.resizeHandle;

                switch (handle) {
                    case 'se':
                        newSw = Math.max(1, b.sw + dfx);
                        newSh = Math.max(1, b.sh + dfy);
                        break;
                    case 'e':
                        newSw = Math.max(1, b.sw + dfx);
                        break;
                    case 's':
                        newSh = Math.max(1, b.sh + dfy);
                        break;
                    case 'nw': {
                        const right = b.sx + b.sw;
                        const bottom = b.sy + b.sh;
                        newSx = Math.min(right - 1, b.sx + dfx);
                        newSy = Math.min(bottom - 1, b.sy + dfy);
                        newSw = right - newSx;
                        newSh = bottom - newSy;
                        break;
                    }
                    case 'n': {
                        const bottom = b.sy + b.sh;
                        newSy = Math.min(bottom - 1, b.sy + dfy);
                        newSh = bottom - newSy;
                        break;
                    }
                    case 'w': {
                        const right = b.sx + b.sw;
                        newSx = Math.min(right - 1, b.sx + dfx);
                        newSw = right - newSx;
                        break;
                    }
                    case 'ne': {
                        const bottom = b.sy + b.sh;
                        newSy = Math.min(bottom - 1, b.sy + dfy);
                        newSw = Math.max(1, b.sw + dfx);
                        newSh = bottom - newSy;
                        break;
                    }
                    case 'sw': {
                        const right = b.sx + b.sw;
                        newSx = Math.min(right - 1, b.sx + dfx);
                        newSw = right - newSx;
                        newSh = Math.max(1, b.sh + dfy);
                        break;
                    }
                }

                if (e && e.shiftKey && ['nw', 'ne', 'se', 'sw'].includes(handle)) {
                    const aspect = b.sw / b.sh;
                    if (newSw / newSh > aspect) {
                        newSw = Math.max(1, Math.round(newSh * aspect));
                    } else {
                        newSh = Math.max(1, Math.round(newSw / aspect));
                    }
                    if (handle === 'nw') {
                        newSx = (b.sx + b.sw) - newSw;
                        newSy = (b.sy + b.sh) - newSh;
                    } else if (handle === 'ne') {
                        newSy = (b.sy + b.sh) - newSh;
                    } else if (handle === 'sw') {
                        newSx = (b.sx + b.sw) - newSw;
                    }
                }

                selection.offsetX = b.origOffsetX + (newSx - b.sx);
                selection.offsetY = b.origOffsetY + (newSy - b.sy);

                if (newSw !== selection.w || newSh !== selection.h) {
                    selection.w = newSw;
                    selection.h = newSh;
                    const scaled = scalePixelMatrix(selection.origPixels, selection.origW, selection.origH, newSw, newSh);
                    selection.floatingPixels = scaled;
                    selection.pixels = scaled;
                }

                renderMainCanvas();
                drawGridOverlay();
            } else if (selection && selection.isDragging) {
                const dx = x - selection.dragStartX;
                const dy = y - selection.dragStartY;
                selection.offsetX = selection.startOffsetX + dx;
                selection.offsetY = selection.startOffsetY + dy;
                renderMainCanvas();
                drawGridOverlay();
            } else {
                drawGridOverlay();
            }
            return;
        }

        if (activeTool === 'pencil') {
            if (x === lastStrokeX && y === lastStrokeY) return;
            const drawColor = isRightClickStroke ? secondaryColor : activeColor;
            if (lastStrokeX >= 0 && lastStrokeY >= 0) {
                const colorToDraw = (ditherPattern !== 'none' && checkIsProActive()) ? getDitherColor(x, y, drawColor) : drawColor;
                drawBresenhamLine(buf, lastStrokeX, lastStrokeY, x, y, colorToDraw);
            } else {
                setPixelSymmetric(buf, x, y, drawColor);
            }
            strokePoints.push({ x, y });
            if (isPixelPerfect && brushSize === 1) {
                applyPixelPerfectFilter(buf, strokePoints);
            }
            lastStrokeX = x;
            lastStrokeY = y;
            renderMainCanvas();
        } else if (activeTool === 'eraser') {
            if (x === lastStrokeX && y === lastStrokeY) return;
            if (lastStrokeX >= 0 && lastStrokeY >= 0) {
                drawBresenhamLine(buf, lastStrokeX, lastStrokeY, x, y, null);
            } else {
                setPixelSymmetric(buf, x, y, null);
            }
            lastStrokeX = x;
            lastStrokeY = y;
            renderMainCanvas();
        } else if (activeTool === 'shading') {
            if (x === lastStrokeX && y === lastStrokeY) return;
            if (lastStrokeX >= 0 && lastStrokeY >= 0) {
                drawBresenhamShadingLine(buf, lastStrokeX, lastStrokeY, x, y, isRightClickStroke);
            } else {
                applyShadingBrush(buf, x, y, isRightClickStroke);
            }
            lastStrokeX = x;
            lastStrokeY = y;
            renderMainCanvas();
        } else if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
            renderMainCanvas();
            renderShapePreview(activeTool, strokeStartX, strokeStartY, x, y, activeColor);
        }
    }

    function handleStrokeEnd() {
        const buf = getCurrentActiveBuffer();
        if (!buf) return;

        if (activeTool === 'move') {
            if (selection && selection.isDragging) {
                selection.isDragging = false;
                updateSelectionToolbarUI();
                renderMainCanvas();
                drawGridOverlay();
                return;
            }
            if (isMovingLayerPixels) {
                isMovingLayerPixels = false;
                const dx = strokeCurrentX - movePixelStartX;
                const dy = strokeCurrentY - movePixelStartY;
                moveInitialBufCopy = null;
                syncCurrentFrameBuffer();
                renderAll();
                showToast(`🖐️ 已移动图层像素 (${dx >= 0 ? '+' + dx : dx}, ${dy >= 0 ? '+' + dy : dy})`);
                return;
            }
        }

        if (activeTool === 'select') {
            if (selection && selection.isResizing) {
                selection.isResizing = false;
                selection.resizeHandle = null;
                showToast(`📐 选区已调整大小为 ${selection.w}×${selection.h} 像素 (${Math.round(selection.w / selection.origW * 100)}% × ${Math.round(selection.h / selection.origH * 100)}%)`);
                renderMainCanvas();
                drawGridOverlay();
                updateSelectionToolbarUI();
                return;
            }

            if (selection && selection.isDragging) {
                selection.isDragging = false;
                updateSelectionToolbarUI();
                renderMainCanvas();
                drawGridOverlay();
                return;
            }

            if (isSelectionDragCreating) {
                const dx = Math.abs(strokeCurrentX - strokeStartX);
                const dy = Math.abs(strokeCurrentY - strokeStartY);

                if (isSelectionMoved || dx > 0 || dy > 0) {
                    const minX = Math.min(strokeStartX, strokeCurrentX);
                    const maxX = Math.max(strokeStartX, strokeCurrentX);
                    const minY = Math.min(strokeStartY, strokeCurrentY);
                    const maxY = Math.max(strokeStartY, strokeCurrentY);
                    const w = maxX - minX + 1;
                    const h = maxY - minY + 1;

                    if (w > 0 && h > 0) {
                        selection = {
                            x: minX,
                            y: minY,
                            w: w,
                            h: h,
                            origW: w,
                            origH: h,
                            origPixels: null,
                            floatingPixels: null,
                            pixels: null,
                            offsetX: 0,
                            offsetY: 0,
                            isFloating: false,
                            isDragging: false,
                            isResizing: false,
                            resizeHandle: null
                        };
                        updateSelectionToolbarUI();
                        showToast(`📐 已框选 ${w}×${h} px [${minX}, ${minY}] (拖拽内部移动，手柄缩放，或在选区内作画)`);
                    }
                } else {
                    // Single click without dragging: clean cancellation of any active selection!
                    selection = null;
                    updateSelectionToolbarUI();
                }
                isSelectionDragCreating = false;
                isSelectionMoved = false;
                strokeStartX = -1;
                strokeStartY = -1;
            }
            syncCurrentFrameBuffer();
            renderAll();
            return;
        }

        if (activeTool === 'line') {
            drawBresenhamLine(buf, strokeStartX, strokeStartY, strokeCurrentX, strokeCurrentY, activeColor);
            pushRecentColor(activeColor);
        } else if (activeTool === 'rect') {
            drawRectangle(buf, strokeStartX, strokeStartY, strokeCurrentX, strokeCurrentY, activeColor);
            pushRecentColor(activeColor);
        } else if (activeTool === 'circle') {
            drawEllipse(buf, strokeStartX, strokeStartY, strokeCurrentX, strokeCurrentY, activeColor);
            pushRecentColor(activeColor);
        } else if (activeTool === 'gradient') {
            applyGradientFill(buf, strokeStartX, strokeStartY, strokeCurrentX, strokeCurrentY, activeColor, secondaryColor);
            pushRecentColor(activeColor);
        }

        lastStrokeX = -1;
        lastStrokeY = -1;
        strokePoints = [];

        syncCurrentFrameBuffer();
        isDrawingNow = false; // 🚨 画完松手，允许更新 UI
        renderAll();
    }

    // --- PIXEL PERFECT FILTER (Eliminates double corner staircases) ---
    function applyPixelPerfectFilter(buf, points) {
        if (!points || points.length < 3) return;
        const len = points.length;
        const p1 = points[len - 3];
        const p2 = points[len - 2];
        const p3 = points[len - 1];

        // Ensure points p1, p2, p3 are distinct before checking for L-corner
        if ((p1.x === p2.x && p1.y === p2.y) || (p2.x === p3.x && p2.y === p3.y) || (p1.x === p3.x && p1.y === p3.y)) {
            return;
        }

        if ((p1.x === p2.x && p2.y === p3.y) || (p1.y === p2.y && p2.x === p3.x)) {
            buf[p2.y][p2.x] = null;
        }
    }

    // --- BRESENHAM LINE & SHAPES ---
    function drawBresenhamLine(buf, x0, y0, x1, y1, color) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            setPixelSymmetric(buf, x0, y0, color);
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    function drawRectangle(buf, x0, y0, x1, y1, color) {
        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1);
        const maxY = Math.max(y0, y1);

        for (let rx = minX; rx <= maxX; rx++) {
            for (let ry = minY; ry <= maxY; ry++) {
                if (rx === minX || rx === maxX || ry === minY || ry === maxY) {
                    setPixelSymmetric(buf, rx, ry, color);
                }
            }
        }
    }

    function drawEllipse(buf, x0, y0, x1, y1, color) {
        const rx = Math.abs(x1 - x0) / 2;
        const ry = Math.abs(y1 - y0) / 2;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;

        if (rx < 0.5 && ry < 0.5) {
            setPixelSymmetric(buf, x0, y0, color);
            return;
        }

        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
            for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
                const dx = (x - cx) / (rx || 0.5);
                const dy = (y - cy) / (ry || 0.5);
                const val = dx * dx + dy * dy;
                if (val >= 0.6 && val <= 1.4) {
                    setPixelSymmetric(buf, x, y, color);
                }
            }
        }
    }

    function renderShapePreview(tool, x0, y0, x1, y1, color) {
        const ctx = pixelCanvas.getContext('2d');
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;
        const cellW = pixelCanvas.width / resX;
        const cellH = pixelCanvas.height / resY;

        ctx.fillStyle = color;
        const tempBuf = engine.createBuffer(resX, resY);

        if (tool === 'line') drawBresenhamLine(tempBuf, x0, y0, x1, y1, color);
        else if (tool === 'rect') drawRectangle(tempBuf, x0, y0, x1, y1, color);
        else if (tool === 'circle') drawEllipse(tempBuf, x0, y0, x1, y1, color);
        else if (tool === 'gradient') applyGradientFill(tempBuf, x0, y0, x1, y1, color, secondaryColor);

        for (let ry = 0; ry < resY; ry++) {
            for (let rx = 0; rx < resX; rx++) {
                if (tempBuf[ry][rx]) {
                    ctx.fillRect(rx * cellW, ry * cellH, cellW, cellH);
                }
            }
        }
    }

    // FLOOD FILL
    function floodFill(targetBuffer, startX, startY, fillColor, sampleBuffer = null) {
        if (!targetBuffer || startY < 0 || startY >= targetBuffer.length) return;
        const resY = targetBuffer.length;
        const resX = targetBuffer[0] ? targetBuffer[0].length : resY;
        if (startX < 0 || startX >= resX) return;
        if (selection && !isInsideSelection(startX, startY)) return;

        const srcBuffer = sampleBuffer || targetBuffer;
        const targetColor = (srcBuffer[startY] && srcBuffer[startY][startX] !== undefined) ? srcBuffer[startY][startX] : null;

        if (targetColor === fillColor) return;

        const queue = [[startX, startY]];
        const visited = Array.from({ length: resY }, () => new Array(resX).fill(false));
        visited[startY][startX] = true;

        while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            targetBuffer[cy][cx] = fillColor;

            const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < resX && ny >= 0 && ny < resY) {
                    if (selection && !isInsideSelection(nx, ny)) continue;
                    if (!visited[ny][nx] && srcBuffer[ny][nx] === targetColor) {
                        visited[ny][nx] = true;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }
    // #endregion [R3] 画笔与图形算法 (Drawing & Shapes)

    // ============================================================
    // COLOR WORKBENCH & PALETTE SWATCHES
    // ============================================================

    let spectrumPointerX = 180;
    let spectrumPointerY = 20;

    function safeHex6(col) {
        if (!col) return '#000000';
        let str = col.toString().trim().toLowerCase();
        if (str.startsWith('#')) {
            if (str.length === 4) return '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
            if (str.length >= 7) return str.substring(0, 7);
        }
        return '#000000';
    }

    function setActiveColor(color) {
        if (!color) return;
        const hex6 = safeHex6(color);
        activeColor = hex6.toUpperCase();
        window.activeColor = activeColor; // 暴露给全局

        if (primaryColorPicker) primaryColorPicker.value = hex6;
        if (activeColorIndicator) activeColorIndicator.style.backgroundColor = activeColor;
        if (hexColorInput) hexColorInput.value = activeColor;

        // 👇 强制刷新最近颜色栏
        updateRecentColorsUI();

        // 👇 强制刷新调色板
        updatePaletteSwatchesUI();

        // 👇 强制刷新双色工作台 UI
        const addonPrimarySwatch = document.getElementById('addon-primary-swatch');
        const addonPrimaryHex = document.getElementById('addon-primary-hex');
        if (addonPrimarySwatch) addonPrimarySwatch.style.backgroundColor = activeColor;
        if (addonPrimaryHex) addonPrimaryHex.textContent = activeColor;
    }
    window.setActiveColor = setActiveColor;

    function setSecondaryColor(color, showToastMsg = true) {
        if (!color) return;
        const hex6 = safeHex6(color);
        secondaryColor = hex6.toUpperCase();
        window.secondaryColor = secondaryColor;

        const secSwatch = document.getElementById('addon-secondary-swatch');
        const secHex = document.getElementById('addon-secondary-hex');
        const secPicker = document.getElementById('addon-secondary-picker');
        if (secSwatch) secSwatch.style.backgroundColor = secondaryColor;
        if (secHex) secHex.textContent = secondaryColor;
        if (secPicker) secPicker.value = hex6;

        updateRecentColorsUI();
        updatePaletteSwatchesUI();

        if (showToastMsg && typeof showToast === 'function') {
            showToast(`🖱️ 右键色已设为: ${secondaryColor}`);
        }
    }
    window.setSecondaryColor = setSecondaryColor;

    function updateDualColorUI() {
        const addonPrimarySwatch = document.getElementById('addon-primary-swatch');
        const addonSecondarySwatch = document.getElementById('addon-secondary-swatch');
        const addonPrimaryHex = document.getElementById('addon-primary-hex');
        const addonSecondaryHex = document.getElementById('addon-secondary-hex');
        const addonPrimaryPicker = document.getElementById('addon-primary-picker');
        const addonSecondaryPicker = document.getElementById('addon-secondary-picker');

        if (addonPrimarySwatch) addonPrimarySwatch.style.backgroundColor = activeColor;
        if (addonSecondarySwatch) addonSecondarySwatch.style.backgroundColor = secondaryColor;
        if (addonPrimaryHex) addonPrimaryHex.textContent = activeColor;
        if (addonSecondaryHex) addonSecondaryHex.textContent = secondaryColor;
        if (addonPrimaryPicker) addonPrimaryPicker.value = safeHex6(activeColor);
        if (addonSecondaryPicker) addonSecondaryPicker.value = safeHex6(secondaryColor);
    }
    window.updateDualColorUI = updateDualColorUI;

    function pushRecentColor(color) {
        if (!color) return;
        const hex = safeHex6(color).toUpperCase();
        recentColors = recentColors.filter(c => c !== hex);
        recentColors.unshift(hex);
        if (recentColors.length > 8) recentColors.pop();
        updateRecentColorsUI();
    }

    function updateRecentColorsUI() {
        if (!recentColorsBar) return;
        recentColorsBar.innerHTML = '';

        // 强制把当前主色和副色转成小写，确保比较一致
        const prim = (activeColor || '').toLowerCase();
        const sec = (secondaryColor || '').toLowerCase();

        recentColors.forEach(col => {
            const swatch = document.createElement('div');

            // 暴力转换颜色：无论原色是 rgb() 还是 #hex，全转成小写 hex
            let colHex = col.toLowerCase();
            if (colHex.includes('rgb')) {
                const match = colHex.match(/\d+/g);
                if (match && match.length >= 3) {
                    const r = parseInt(match[0]).toString(16).padStart(2, '0');
                    const g = parseInt(match[1]).toString(16).padStart(2, '0');
                    const b = parseInt(match[2]).toString(16).padStart(2, '0');
                    colHex = '#' + r + g + b;
                }
            }

            let cls = 'swatch';
            if (colHex === prim) cls += ' active-primary';
            if (colHex === sec) cls += ' active-secondary';

            swatch.className = cls;
            swatch.style.width = '28px';
            swatch.style.height = '28px';
            swatch.style.backgroundColor = col;
            swatch.style.position = 'relative'; // 确保 L 角标能定位

            recentColorsBar.appendChild(swatch);
        });
    }

    function updatePaletteSwatchesUI() {
        if (!paletteSwatches) return;
        paletteSwatches.innerHTML = '';
        const prim = (activeColor || '').toUpperCase();
        const sec = (secondaryColor || '').toUpperCase();

        customPalette.forEach((col, idx) => {
            const swatch = document.createElement('div');
            let colHex;
            try {
                colHex = (typeof rgbToHex === 'function') ? rgbToHex(col).toUpperCase() : col.toUpperCase();
            } catch (e) {
                colHex = col.toUpperCase();
            }
            const isPrim = (colHex === prim);
            const isSec = (colHex === sec);

            let cls = 'swatch';
            if (isPrim) cls += ' active-primary';
            if (isSec) cls += ' active-secondary';

            swatch.className = cls;
            swatch.style.backgroundColor = col;
            swatch.style.position = 'relative';
            swatch.dataset.palette = 'true';

            paletteSwatches.appendChild(swatch);
        });

        if (typeof updateDualColorUI === 'function') {
            updateDualColorUI();
        }
    }

    function drawColorSpectrum() {
        if (!colorSpectrumCanvas) return;
        const ctx = colorSpectrumCanvas.getContext('2d');
        const w = colorSpectrumCanvas.width || 220;
        const h = colorSpectrumCanvas.height || 120;

        ctx.clearRect(0, 0, w, h);

        const hueGrad = ctx.createLinearGradient(0, 0, w, 0);
        hueGrad.addColorStop(0, '#FF0000');
        hueGrad.addColorStop(0.17, '#FFFF00');
        hueGrad.addColorStop(0.33, '#00FF00');
        hueGrad.addColorStop(0.5, '#00FFFF');
        hueGrad.addColorStop(0.67, '#0000FF');
        hueGrad.addColorStop(0.83, '#FF00FF');
        hueGrad.addColorStop(1, '#FF0000');

        ctx.fillStyle = hueGrad;
        ctx.fillRect(0, 0, w, h);

        const whiteGrad = ctx.createLinearGradient(0, 0, 0, h / 2);
        whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = whiteGrad;
        ctx.fillRect(0, 0, w, h / 2);

        const blackGrad = ctx.createLinearGradient(0, h / 2, 0, h);
        blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        blackGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = blackGrad;
        ctx.fillRect(0, h / 2, w, h / 2);
    }

    function initColorSpectrum() {
        if (!colorSpectrumCanvas) return;
        const ctx = colorSpectrumCanvas.getContext('2d');
        const w = colorSpectrumCanvas.width;
        const h = colorSpectrumCanvas.height;

        drawColorSpectrum();
        let isSpectrumDragging = false;

        function pickSpectrumColor(e) {
            const rect = colorSpectrumCanvas.getBoundingClientRect();
            // 获取鼠标/手指的相对坐标
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            spectrumPointerX = Math.max(0, Math.min(w - 1, Math.floor((clientX - rect.left) * (w / rect.width))));
            spectrumPointerY = Math.max(0, Math.min(h - 1, Math.floor((clientY - rect.top) * (h / rect.height))));

            const imgData = ctx.getImageData(spectrumPointerX, spectrumPointerY, 1, 1).data;
            const hex = `#${((1 << 24) + (imgData[0] << 16) + (imgData[1] << 8) + imgData[2]).toString(16).slice(1)}`;
            setActiveColor(hex);
        }

        // 🚨 鼠标事件升级：使用 pointer 事件，兼容鼠标和触摸屏
        colorSpectrumCanvas.addEventListener('pointerdown', (e) => {
            isSpectrumDragging = true;
            colorSpectrumCanvas.setPointerCapture(e.pointerId); // 锁定指针，防止滑出画布外失效
            pickSpectrumColor(e);
        });

        colorSpectrumCanvas.addEventListener('pointermove', (e) => {
            if (isSpectrumDragging) {
                pickSpectrumColor(e);
            }
        });

        colorSpectrumCanvas.addEventListener('pointerup', (e) => {
            isSpectrumDragging = false;
            colorSpectrumCanvas.releasePointerCapture(e.pointerId);
        });

        colorSpectrumCanvas.addEventListener('pointercancel', (e) => {
            isSpectrumDragging = false;
            colorSpectrumCanvas.releasePointerCapture(e.pointerId);
        });

        // ============================================================
        // 🏷️ 分类 1: 双色工作台 (左键色 / 右键色) - 保持原有逻辑不变
        // ============================================================
        const addonPrimaryPicker = document.getElementById('addon-primary-picker');
        const addonSecondaryPicker = document.getElementById('addon-secondary-picker');
        const addonPrimarySwatch = document.getElementById('addon-primary-swatch');
        const addonSecondarySwatch = document.getElementById('addon-secondary-swatch');
        const addonPrimaryHex = document.getElementById('addon-primary-hex');
        const addonSecondaryHex = document.getElementById('addon-secondary-hex');
        const btnSwap = document.getElementById('addon-swap-btn');

        if (addonPrimarySwatch && addonSecondarySwatch) {
            const updateDualUI = () => {
                addonPrimarySwatch.style.backgroundColor = activeColor;
                addonSecondarySwatch.style.backgroundColor = secondaryColor;
                addonPrimaryHex.textContent = activeColor;
                addonSecondaryHex.textContent = secondaryColor;
            };
            updateDualUI();

            if (addonPrimaryPicker) {
                addonPrimaryPicker.addEventListener('input', (e) => {
                    activeColor = e.target.value.toUpperCase();
                    updateDualUI();
                    if (primaryColorPicker) primaryColorPicker.value = e.target.value;
                });
            }
            if (addonSecondaryPicker) {
                addonSecondaryPicker.addEventListener('input', (e) => {
                    secondaryColor = e.target.value.toUpperCase();
                    updateDualUI();
                });
            }
            if (btnSwap) {
                btnSwap.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const temp = activeColor;
                    activeColor = secondaryColor;
                    secondaryColor = temp;
                    updateDualUI();
                    if (primaryColorPicker) primaryColorPicker.value = activeColor;
                    if (typeof showToast === 'function') showToast(`⇄ 已互换: 左键 ${activeColor} ⇋ 右键 ${secondaryColor}`);
                });
            }
            // 键盘 X 键互换
            window.addEventListener('keydown', (e) => {
                if (e.key.toLowerCase() === 'x' && !e.ctrlKey && !e.metaKey) {
                    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
                    if (!isInput && btnSwap) btnSwap.click();
                }
            });
        }
    }

    // ============================================================
    // RENDERING PIPELINE & MIRROR / TILE OVERLAY
    // ============================================================

    function renderAll() {
        renderMainCanvas();
        drawGridOverlay();
        drawSymmetryOverlay();

        // 🚨 核心：如果在画画（鼠标没松开），就跳过重建图层面板和缩略图！
        // 等鼠标松开触发了 handleStrokeEnd，isDrawingNow 变回 false，再去重建。
        if (!isDrawingNow) {
            renderFilmstripThumbnails();
            renderLayersUI();
            updateHistoryUI();
        }
    }

    function renderMainCanvas() {
        const ctx = pixelCanvas.getContext('2d');
        ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

        // ========================================================
        // 🚨 核心改造：绘制高级防眩光棋盘格
        // ========================================================
        const isLightTheme = document.body.classList.contains('light-theme');

        // 只有在透明模式（checkered）下，才画格子
        // 只有在透明模式（checkered）下，才画底色
        if (bgMode === 'checkered') {
            // 1. 铺满高级哑光冷灰底色 (带有极微弱的蓝色调，非常护眼且高级)
            ctx.fillStyle = '#14161c';
            ctx.fillRect(0, 0, pixelCanvas.width, pixelCanvas.height);

            // 2. 在底层画上极淡的辅助网格（每 16 个像素一格，冷灰白色）
            const gridSize = 16 * 8; // 假设每个像素 8px，这里就是每 16 格画一条
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; // 极低的白色透明度
            ctx.lineWidth = 1;

            // 画竖线
            for (let x = 0; x <= pixelCanvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, pixelCanvas.height);
                ctx.stroke();
            }
            // 画横线
            for (let y = 0; y <= pixelCanvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(pixelCanvas.width, y);
                ctx.stroke();
            }

            // 3. 在中心画一个极淡的十字准星
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.moveTo(pixelCanvas.width / 2, 0);
            ctx.lineTo(pixelCanvas.width / 2, pixelCanvas.height);
            ctx.moveTo(0, pixelCanvas.height / 2);
            ctx.lineTo(pixelCanvas.width, pixelCanvas.height / 2);
            ctx.stroke();

        } else if (bgMode === 'solid') {
            // 如果是纯色背景模式
            ctx.fillStyle = solidBgColor;
            ctx.fillRect(0, 0, pixelCanvas.width, pixelCanvas.height);
        }

        // 2. Onion Skin (PRO)
        if (showOnionSkin && !isPlaying && frameBuffers.length > 1 && checkIsProActive()) {
            const prevFrameIdx = (currentFrame - 1 + frameBuffers.length) % frameBuffers.length;
            const prevBuf = frameBuffers[prevFrameIdx];
            if (prevBuf) {
                ctx.globalAlpha = 0.35;
                if (onionSkinTint) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                }
                engine.renderToCanvas(prevBuf, pixelCanvas, false);
                ctx.globalAlpha = 1.0;
            }
        }

        // 3. Active Layer Focus Composite Render
        initFrameLayers(currentFrame);
        const layers = frameLayers[currentFrame];

        // Render inactive visible layers first at 35% opacity as context
        layers.forEach((layer, idx) => {
            if (idx !== activeLayerIndex && layer.visible && layer.buffer) {
                ctx.globalAlpha = 0.35;
                engine.renderToCanvas(layer.buffer, pixelCanvas, false);
                ctx.globalAlpha = 1.0;
            }
        });

        // Render active selected layer ON TOP at 100% full opacity
        if (layers[activeLayerIndex] && layers[activeLayerIndex].visible && layers[activeLayerIndex].buffer) {
            ctx.globalAlpha = 1.0;
            engine.renderToCanvas(layers[activeLayerIndex].buffer, pixelCanvas, false);
        }

        // 4. Selection Overlay Render (Only when floating/lifted)
        if (selection && selection.isFloating && (selection.floatingPixels || selection.pixels)) {
            const resX = engine.resX || engine.resolution || 32;
            const resY = engine.resY || engine.resolution || 32;
            const cellW = pixelCanvas.width / resX;
            const cellH = pixelCanvas.height / resY;
            const targetX = selection.x + (selection.offsetX || 0);
            const targetY = selection.y + (selection.offsetY || 0);
            const floatPix = selection.floatingPixels || selection.pixels;

            for (let ry = 0; ry < selection.h; ry++) {
                for (let rx = 0; rx < selection.w; rx++) {
                    const color = floatPix[ry] ? floatPix[ry][rx] : null;
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect((targetX + rx) * cellW, (targetY + ry) * cellH, cellW, cellH);
                    }
                }
            }
        }
    }

    let currentHoverPixelX = -1;
    let currentHoverPixelY = -1;
    let selectionDashOffset = 0;
    let selectionAnimFrame = null;

    function startSelectionAnimation() {
        if (selectionAnimFrame) return;
        const animate = () => {
            if (selection || (isMouseDown && activeTool === 'select')) {
                selectionDashOffset = (selectionDashOffset + 0.4) % 24;
                drawGridOverlay();
                selectionAnimFrame = requestAnimationFrame(animate);
            } else {
                selectionAnimFrame = null;
            }
        };
        selectionAnimFrame = requestAnimationFrame(animate);
    }

    function drawGridOverlay() {
        const ctx = gridCanvas.getContext('2d');
        ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        // 🚨 性能护盾：如果画布超过 128×128，隐藏密集的网格线（只保留最外层边框）
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        const cellW = gridCanvas.width / resX;
        const cellH = gridCanvas.height / resY;

        // 当格子非常小的时候，放弃绘制内部网格线（这一步能省去 80% 的性能消耗）
        if (showGrid && resX <= 128 && resY <= 128) {
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= resX; i++) {
                ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, gridCanvas.height); ctx.stroke();
            }
            for (let i = 0; i <= resY; i++) {
                ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(gridCanvas.width, i * cellH); ctx.stroke();
            }
        }

        if (showGrid) {
            // 🚨 彻底移除尺寸限制！不管 32 还是 128，统统绘制精致网格
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)'; // 赛博青，透明度刚刚好，既清晰又不抢戏
            ctx.lineWidth = 1;

            // 画纵向网格
            for (let i = 0; i <= resX; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellW, 0);
                ctx.lineTo(i * cellW, gridCanvas.height);
                ctx.stroke();
            }
            // 画横向网格
            for (let i = 0; i <= resY; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * cellH);
                ctx.lineTo(gridCanvas.width, i * cellH);
                ctx.stroke();
            }

            // 🚨 画布中心加一根稍微亮一点的青色十字中心线
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(gridCanvas.width / 2, 0);
            ctx.lineTo(gridCanvas.width / 2, gridCanvas.height);
            ctx.moveTo(0, gridCanvas.height / 2);
            ctx.lineTo(gridCanvas.width, gridCanvas.height / 2);
            ctx.stroke();
        }

        // Draw Active / Dragging Selection Box (Grid Mesh + Marching Ants + Anchor Handles + Badge)
        let selBounds = null;
        if (selection) {
            selBounds = {
                sx: selection.x + (selection.offsetX || 0),
                sy: selection.y + (selection.offsetY || 0),
                sw: selection.w,
                sh: selection.h
            };
        } else if (isMouseDown && activeTool === 'select' && isSelectionDragCreating && strokeStartX >= 0 && strokeStartY >= 0) {
            const minX = Math.min(strokeStartX, strokeCurrentX);
            const maxX = Math.max(strokeStartX, strokeCurrentX);
            const minY = Math.min(strokeStartY, strokeCurrentY);
            const maxY = Math.max(strokeStartY, strokeCurrentY);
            selBounds = {
                sx: minX,
                sy: minY,
                sw: maxX - minX + 1,
                sh: maxY - minY + 1
            };
        }

        if (selBounds && selBounds.sw > 0 && selBounds.sh > 0) {
            const { sx, sy, sw, sh } = selBounds;
            const px = sx * cellW;
            const py = sy * cellH;
            const pw = sw * cellW;
            const ph = sh * cellH;

            // 1. Semi-transparent cyan tint inside selected area
            ctx.fillStyle = 'rgba(0, 242, 254, 0.16)';
            ctx.fillRect(px, py, pw, ph);

            // 2. High-Density Internal Pixel Line Grid Mesh (线条格子状)
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]); // Solid internal grid lines

            for (let c = 0; c <= sw; c++) {
                const gx = px + c * cellW;
                ctx.beginPath();
                ctx.moveTo(gx, py);
                ctx.lineTo(gx, py + ph);
                ctx.stroke();
            }
            for (let r = 0; r <= sh; r++) {
                const gy = py + r * cellH;
                ctx.beginPath();
                ctx.moveTo(px, gy);
                ctx.lineTo(px + pw, gy);
                ctx.stroke();
            }
            ctx.restore();

            // 3. High-Contrast Animated Marching Ants Outer Border
            ctx.save();
            ctx.lineWidth = 1.5; // 变细一点，更锐利

            // 暗红/品红底边（赛博朋克经典配色：青色+品红）
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.7)';
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -selectionDashOffset;
            ctx.strokeRect(px, py, pw, ph);

            // 荧光青边，产生错位感
            ctx.strokeStyle = '#00f2fe';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 4;
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -(selectionDashOffset + 6);
            ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2); // 故意画偏 1px 制造故障感
            ctx.restore();

            // 4. Corner & Midpoint Anchor Handles (Nodes) - Show on active selection (not while dragging to create)
            if (selection && !isSelectionDragCreating && (activeTool === 'select' || selection.isFloating)) {
                const handles = [
                    { id: 'nw', x: px, y: py }, // top-left
                    { id: 'n', x: px + pw / 2, y: py }, // top-mid
                    { id: 'ne', x: px + pw, y: py }, // top-right
                    { id: 'e', x: px + pw, y: py + ph / 2 }, // right-mid
                    { id: 'se', x: px + pw, y: py + ph }, // bottom-right
                    { id: 's', x: px + pw / 2, y: py + ph }, // bottom-mid
                    { id: 'sw', x: px, y: py + ph }, // bottom-left
                    { id: 'w', x: px, y: py + ph / 2 } // left-mid
                ];

                // ========================================================
                // 💠 赛博朋克风选区手柄 (多层光效 Pro Max 版)
                // ========================================================
                const nodeSize = 12; // 稍微放大一点，让光效有空间展示
                ctx.save();

                handles.forEach(h => {
                    const hx = h.x;
                    const hy = h.y;

                    ctx.save();
                    ctx.translate(hx, hy);
                    ctx.rotate(Math.PI / 4); // 旋转 45 度，变成菱形

                    const size = nodeSize;

                    // 🔮 第 1 层：外层弥散光晕 (Soft Glow)
                    ctx.shadowColor = '#00f2fe'; // 青色泛光
                    ctx.shadowBlur = 15;         // 大范围模糊
                    ctx.fillStyle = 'rgba(0, 242, 254, 0.2)'; // 极低透明度的青色底
                    ctx.fillRect(-size / 2 - 2, -size / 2 - 2, size + 4, size + 4);

                    // 🔷 第 2 层：中层科技边框 (Tech Border)
                    ctx.shadowBlur = 6; // 减小模糊，让边框锐利
                    ctx.strokeStyle = '#00f2fe';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(-size / 2, -size / 2, size, size);

                    // ⬛ 第 3 层：内部暗色填充 (Dark Core)
                    ctx.shadowBlur = 0; // 关掉阴影，保证暗部纯粹
                    ctx.fillStyle = 'rgba(5, 11, 20, 0.85)';
                    ctx.fillRect(-size / 2, -size / 2, size, size);

                    // ✨ 第 4 层：中心十字高光 (Center Highlight)
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    // 画个小小的十字星
                    ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                    ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                    ctx.stroke();

                    ctx.restore();

                    // 🌟 第 5 层：绝对纯白点 (Sparkle Core) - 不随旋转
                    ctx.beginPath();
                    ctx.arc(hx, hy, 1, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 8;
                    ctx.fill();
                });
                ctx.restore();
            }

            // 5. Dimension & Coordinate Floating Badge Tooltip
            let scaleInfo = '';
            if (selection && selection.origW && selection.origH) {
                const scaleX = Math.round((sw / selection.origW) * 100);
                const scaleY = Math.round((sh / selection.origH) * 100);
                if (scaleX !== 100 || scaleY !== 100) {
                    scaleInfo = ` (${scaleX}%×${scaleY}%)`;
                }
            }

            let badgeText = '';
            if (selection && selection.isFloating) {
                badgeText = `📐 ${sw}×${sh} px${scaleInfo} [${sx}, ${sy}] 浮动选区 (Enter 确认固定 / 拖动手柄缩放)`;
            } else if (selection) {
                badgeText = `📐 ${sw}×${sh} px [${sx}, ${sy}] 选区有效 (拖动内部移动，画笔仅在此生效)`;
            } else {
                badgeText = `📐 正在框选: ${sw}×${sh} px [${sx}, ${sy}]`;
            }
            ctx.font = 'bold 11px sans-serif';
            const textWidth = ctx.measureText(badgeText).width;
            const badgeW = textWidth + 14;
            const badgeH = 22;
            const badgeX = Math.max(4, Math.min(gridCanvas.width - badgeW - 4, px));
            const badgeY = (py >= 26) ? py - 26 : py + ph + 6;

            ctx.fillStyle = 'rgba(5, 11, 20, 0.88)';
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            else ctx.rect(badgeX, badgeY, badgeW, badgeH);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00f2fe';
            ctx.fillText(badgeText, badgeX + 7, badgeY + 15);

            startSelectionAnimation();
        }

        // Draw Crop Tool Overlay (Dark Vignette + Amber Dashed Box + Anchor Nodes + Badge)
        if (activeTool === 'crop' && cropBox && cropBox.w > 0 && cropBox.h > 0) {
            const { x: cx, y: cy, w: cw, h: ch } = cropBox;
            const px = cx * cellW;
            const py = cy * cellH;
            const pw = cw * cellW;
            const ph = ch * cellH;
            const gw = gridCanvas.width;
            const gh = gridCanvas.height;

            // 1. Darkened Vignette Outside Crop Area
            ctx.fillStyle = 'rgba(5, 11, 20, 0.68)';
            ctx.fillRect(0, 0, gw, py); // Top
            ctx.fillRect(0, py + ph, gw, gh - (py + ph)); // Bottom
            ctx.fillRect(0, py, px, ph); // Left
            ctx.fillRect(px + pw, py, gw - (px + pw), ph); // Right

            // 2. Glowing Amber Dashed Crop Box Border
            ctx.save();
            ctx.strokeStyle = '#ff9f43';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(px, py, pw, ph);

            // Solid inner border line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.strokeRect(px, py, pw, ph);
            ctx.restore();

            // 3. Corner Handles (Nodes)
            const cropHandles = [
                { x: px, y: py },
                { x: px + pw, y: py },
                { x: px, y: py + ph },
                { x: px + pw, y: py + ph }
            ];
            cropHandles.forEach(h => {
                ctx.fillStyle = '#ff9f43';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
                ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
            });

            // 4. Floating Action Badge
            const badgeText = `✂️ 双击或按 Enter 确认裁剪 (${cw}×${ch} px)`;
            ctx.font = 'bold 11px sans-serif';
            const textWidth = ctx.measureText(badgeText).width;
            const badgeW = textWidth + 16;
            const badgeH = 24;
            const badgeX = Math.max(4, Math.min(gw - badgeW - 4, px + (pw - badgeW) / 2));
            const badgeY = (py >= 28) ? py - 28 : py + ph + 6;

            ctx.fillStyle = 'rgba(255, 159, 67, 0.95)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            else ctx.rect(badgeX, badgeY, badgeW, badgeH);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#050b14';
            ctx.fillText(badgeText, badgeX + 8, badgeY + 16);
        }

        // Draw Hover Pixel Cursor Box (1px / 2px / 3px brush size indicator)
        if (currentHoverPixelX >= 0 && currentHoverPixelY >= 0 && activeTool !== 'move' && !isSpacePressed) {
            ctx.save();

            // 1. 高亮当前格子 (半透明青色填充)
            const bx = currentHoverPixelX;
            const by = currentHoverPixelY;
            const bw = Math.min(brushSize, resX - bx);
            const bh = Math.min(brushSize, resY - by);

            ctx.fillStyle = 'rgba(0, 242, 254, 0.3)';
            ctx.fillRect(bx * cellW, by * cellH, bw * cellW, bh * cellH);

            // 2. 绘制赛博狙击十字线 (哪怕格子只有 4px，这十字线也覆盖整个屏幕)
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]); // 虚线

            const cx = bx * cellW + (bw * cellW) / 2; // 格子中心X
            const cy = by * cellH + (bh * cellH) / 2; // 格子中心Y

            // 横线
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(gridCanvas.width, cy);
            ctx.stroke();

            // 竖线
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, gridCanvas.height);
            ctx.stroke();

            ctx.restore();
        }
    }

    function drawSymmetryOverlay() {
        if (!symmetryCanvas) return;
        const ctx = symmetryCanvas.getContext('2d');
        ctx.clearRect(0, 0, symmetryCanvas.width, symmetryCanvas.height);

        if (mirrorMode === 'none') return;

        const w = symmetryCanvas.width;
        const h = symmetryCanvas.height;

        ctx.strokeStyle = 'rgba(0, 242, 254, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);

        if (mirrorMode === 'horizontal' || mirrorMode === 'dual') {
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w / 2, h);
            ctx.stroke();
        }
        if (mirrorMode === 'vertical' || mirrorMode === 'dual') {
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    // ============================================================
    // 🏷️ 分类 7: 动画时间轴与帧管理 (Timeline & Tags)
    // ============================================================
    function startAnimation() {
        if (!checkIsProActive()) {
            openProModal();
            showToast('👑 动画时间轴为 PRO 专属功能！');
            return;
        }
        isPlaying = true;
        if (btnAnimPlay) btnAnimPlay.textContent = '⏸ 暂停动画';
        restartAnimationTimer();
    }

    function stopAnimation() {
        isPlaying = false;
        if (btnAnimPlay) btnAnimPlay.textContent = '▶ 播放动画';
        if (animTimer) {
            clearInterval(animTimer);
            animTimer = null;
        }
        renderMainCanvas();
    }

    function restartAnimationTimer() {
        if (animTimer) clearInterval(animTimer);
        animTimer = setInterval(() => {
            if (loopMode === 'loop') {
                currentFrame = (currentFrame + 1) % frameBuffers.length;
            } else if (loopMode === 'reverse') {
                currentFrame = (currentFrame - 1 + frameBuffers.length) % frameBuffers.length;
            } else if (loopMode === 'pingpong') {
                currentFrame += playDirection;
                if (currentFrame >= frameBuffers.length - 1) {
                    currentFrame = frameBuffers.length - 1;
                    playDirection = -1;
                } else if (currentFrame <= 0) {
                    currentFrame = 0;
                    playDirection = 1;
                }
            }
            updateFrameUI();
            renderMainCanvas();
        }, 1000 / fps);
    }

    function updateFrameUI() {
        const cards = document.querySelectorAll('.frame-thumb-card');
        cards.forEach((card, idx) => {
            card.classList.toggle('active', idx === currentFrame);
        });
    }

    // ============================================================
    // #region [R7] 动画时间轴与段落标签 (Timeline & Tags)
    // ============================================================
    function renderFrameTags() {
        document.querySelectorAll('.addon-tag-badge').forEach(el => el.remove());
        const cards = document.querySelectorAll('.frame-thumb-card');

        // 找到这一段
        cards.forEach((card, index) => {
            card.style.position = 'relative';
            card.style.overflow = 'visible';

            // 🚨 改成这样：如果当前卡片或者前面有标签，才加 margin-top，否则为 0
            const hasTagNearby = frameTags.some(t => t.from === index || t.to === index);
            card.style.marginTop = hasTagNearby ? '24px' : '0px';

            // 如果你想让卡片整体都往上靠，也可以把 24px 改成 12px 或更小
            // ...

            // 1. 画起点标签
            const tagStart = frameTags.find(t => t.from === index);
            if (tagStart) {
                const badge = document.createElement('div');
                badge.className = 'addon-tag-badge';
                badge.textContent = tagStart.name;
                // 内联样式，绝对不依赖外部 CSS 漏掉
                badge.style.cssText = `
                    position: absolute; top: -24px; left: -1px; height: 22px; padding: 0 8px;
                    border-radius: 4px 4px 0 0; font-size: 11px; font-weight: 800;
                    display: flex; align-items: center; z-index: 10; cursor: pointer;
                    box-shadow: 0 -2px 6px rgba(0,0,0,0.3); color: #050b14;
                    background-color: ${tagStart.color};
                `;
                badge.title = '点击删除此动画段落';

                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 🚨 修改这里，支持多语言
                    const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
                    const msg = (dict.tag_delete_confirm || '确定要删除动画段落【{name}】吗？').replace('{name}', tagStart.name);

                    if (confirm(msg)) {
                        frameTags = frameTags.filter(t => t !== tagStart);
                        renderFilmstripThumbnails();
                        showToast(`🗑️ 已删除段落【${tagStart.name}】`);
                    }
                });
                card.appendChild(badge);
            }

            // 2. 画终点分割线
            const tagEnd = frameTags.find(t => t.to === index);
            if (tagEnd) {
                card.style.borderRight = `3px solid ${tagEnd.color}`;
                card.style.marginRight = '4px';
            } else {
                card.style.borderRight = '';
                card.style.marginRight = '';
            }

            // 3. 画多选高亮
            if (selectedFrames.includes(index)) {
                card.style.boxShadow = '0 0 0 2px #ffffff inset';
            } else {
                card.style.boxShadow = '';
            }
        });
    }

    function renderFilmstripThumbnails() {
        if (!frameFilmstrip) return;
        frameFilmstrip.innerHTML = '';

        for (let f = 0; f < frameBuffers.length; f++) {
            const card = document.createElement('div');
            card.className = `frame-thumb-card ${f === currentFrame ? 'active' : ''}`;
            card.dataset.frame = f;

            // 🚨 新增：暴力干掉所有可能的内联黑边和 outline
            card.style.outline = 'none';
            card.style.border = 'none';

            // 👇 新增这行：开启 HTML5 拖拽功能
            card.draggable = true;

            const canvas = document.createElement('canvas');
            canvas.className = 'frame-thumb-canvas';
            // 👇 改成这样：统一用小尺寸渲染，再放大显示，保证缩略图清晰不糊
            const thumbSize = 56;
            canvas.width = thumbSize;
            canvas.height = thumbSize;

            const buf = frameBuffers[f] || engine.createBuffer();
            engine.renderToCanvas(buf, canvas, true);

            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
            const label = document.createElement('span');
            label.className = 'frame-number-tag';
            label.setAttribute('data-frame-index', f + 1);
            label.textContent = `${dict.frame_label || 'Frame'} ${f + 1}`;

            card.appendChild(canvas);
            card.appendChild(label);

            // 左键：多选/Ctrl/Shift 连选
            card.addEventListener('click', (e) => {
                commitSelection();
                stopAnimation();
                const f = parseInt(card.dataset.frame);
                if (isNaN(f)) return;

                if (e.ctrlKey || e.metaKey) {
                    if (!selectedFrames.includes(f)) selectedFrames.push(f);
                    else selectedFrames = selectedFrames.filter(idx => idx !== f);
                    if (selectedFrames.length === 0) selectedFrames = [f];
                } else if (e.shiftKey) {
                    const start = Math.min(lastClickedFrame, f);
                    const end = Math.max(lastClickedFrame, f);
                    selectedFrames = [];
                    for (let i = start; i <= end; i++) selectedFrames.push(i);
                } else {
                    selectedFrames = [f];
                }

                currentFrame = f;
                lastClickedFrame = f;

                updateFrameUI();
                renderMainCanvas();
                renderFilmstripThumbnails();
            });

            // 右键：生成动画段落标签
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (selectedFrames.length === 0) return;

                const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

                const sorted = [...selectedFrames].sort((a, b) => a - b);
                const from = sorted[0];
                const to = sorted[sorted.length - 1];

                const overlap = frameTags.find(t => (from >= t.from && from <= t.to) || (to >= t.from && to <= t.to) || (from <= t.from && to >= t.to));
                if (overlap) {
                    // 🚨 修改这里：多语言重叠警告
                    const overlapMsg = (dict.tag_overlap_alert || '⚠️ 选中的帧与已有段落【{name}】重叠，请先删除旧段落或重新选择。').replace('{name}', overlap.name);
                    alert(overlapMsg);
                    return;
                }

                // 🚨 修改这里：多语言 prompt 标题和默认名字
                const defaultName = (dict.tag_prompt_default || '动画 {n}').replace('{n}', frameTags.length + 1);
                const promptTitle = (dict.tag_prompt_title || '为第 {from} 到 {to} 帧创建一个动画段落标签：\n(输入名字即可生成，留空则取消)')
                    .replace('{from}', from + 1)
                    .replace('{to}', to + 1);

                const tagName = prompt(promptTitle, defaultName);

                if (tagName && tagName.trim() !== '') {
                    const colors = ['#00f2fe', '#ffc439', '#ff007f', '#4ADE80', '#a855f7'];
                    const color = colors[frameTags.length % colors.length];

                    frameTags.push({ name: tagName.trim(), color: color, from: from, to: to });
                    frameTags.sort((a, b) => a.from - b.from);
                    renderFilmstripThumbnails();
                    showToast(`🎬 已创建动画段落【${tagName}】`);
                }
            });

            // ==========================================
            // 👇 新增：赛博拖拽排序逻辑 (Drag & Drop)
            // ==========================================
            card.addEventListener('dragstart', (e) => {
                // 如果正在播放动画，禁止拖拽
                if (isPlaying) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('text/plain', f); // 存下当前帧的索引
                e.dataTransfer.effectAllowed = 'move';
                card.style.opacity = '0.4'; // 拖拽时半透明
            });

            card.addEventListener('dragend', (e) => {
                card.style.opacity = '1'; // 拖拽结束恢复
                // 清理所有其他卡片的拖拽边框
                document.querySelectorAll('.frame-thumb-card').forEach(c => {
                    c.style.borderLeft = '';
                    c.style.borderRight = '';
                });
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault(); // 必须阻止默认行为才能触发 drop
                e.dataTransfer.dropEffect = 'move';

                // 视觉反馈：当鼠标拖动经过某个卡片时，判断是往左插还是往右插
                const rect = card.getBoundingClientRect();
                const mouseX = e.clientX;
                const isLeftHalf = mouseX < rect.left + rect.width / 2;

                if (isLeftHalf) {
                    card.style.borderLeft = '3px solid #00f2fe'; // 插在前面
                    card.style.borderRight = '';
                } else {
                    card.style.borderRight = '3px solid #00f2fe'; // 插在后面
                    card.style.borderLeft = '';
                }
            });

            card.addEventListener('dragleave', (e) => {
                card.style.borderLeft = '';
                card.style.borderRight = '';
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.style.borderLeft = '';
                card.style.borderRight = '';

                const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const targetIdx = f;

                if (isNaN(sourceIdx) || sourceIdx === targetIdx) return;

                // 判断是插在前面还是后面
                const rect = card.getBoundingClientRect();
                const mouseX = e.clientX;
                const isLeftHalf = mouseX < rect.left + rect.width / 2;

                let insertIdx = isLeftHalf ? targetIdx : targetIdx + 1;

                // 如果原位置在目标位置之前，由于移除了一个元素，插入索引要减 1
                if (sourceIdx < insertIdx) {
                    insertIdx--;
                }

                // 🚨 核心数据交换开始！
                pushHistoryState(); // 记录历史，支持撤销
                stopAnimation();

                // 1. 提取源数据
                const movedBuf = frameBuffers.splice(sourceIdx, 1)[0];
                const movedLayers = frameLayers.splice(sourceIdx, 1)[0];

                // 2. 插入到新位置
                frameBuffers.splice(insertIdx, 0, movedBuf);
                frameLayers.splice(insertIdx, 0, movedLayers);

                // 3. 更新当前选中的帧（保持跟随被拖拽的帧）
                currentFrame = insertIdx;
                selectedFrames = [insertIdx];
                lastClickedFrame = insertIdx;

                // 4. 重新渲染界面
                renderAll();
                showToast(`🔀 已将第 ${sourceIdx + 1} 帧移动至第 ${insertIdx + 1} 帧位置`);
            });
            // ==========================================

            frameFilmstrip.appendChild(card);
        }

        renderFrameTags();
    }
    // #endregion [R7] 动画时间轴与段落标签 (Timeline & Tags)

    // ============================================================
    // #region [R6] 选区与剪贴板 (Selection & Clipboard)
    // ============================================================
    function updateSelectionToolbarUI() {
        const displayVal = selection ? 'inline-flex' : 'none';
        const floatDisplayVal = (selection && selection.isFloating) ? 'inline-flex' : 'none';
        if (btnDeleteSelection) btnDeleteSelection.style.display = displayVal;
        if (btnScale2x) btnScale2x.style.display = floatDisplayVal;
        if (btnScaleHalf) btnScaleHalf.style.display = floatDisplayVal;
        if (btnCommitSelection) btnCommitSelection.style.display = floatDisplayVal;
        const btnDeselectEl = document.getElementById('btn-deselect');
        if (btnDeselectEl) btnDeselectEl.style.display = displayVal;
    }

    function scalePixelMatrix(origPixels, origW, origH, targetW, targetH) {
        if (!origPixels || !origPixels.length || targetW <= 0 || targetH <= 0) return [];
        const result = [];
        for (let dy = 0; dy < targetH; dy++) {
            const row = [];
            const sy = Math.min(origH - 1, Math.max(0, Math.floor((dy / targetH) * origH)));
            const srcRow = origPixels[sy];
            for (let dx = 0; dx < targetW; dx++) {
                const sx = Math.min(origW - 1, Math.max(0, Math.floor((dx / targetW) * origW)));
                row.push(srcRow ? srcRow[sx] : null);
            }
            result.push(row);
        }
        return result;
    }

    function liftSelectionToFloating() {
        if (!selection || selection.isFloating) return;
        const buf = getCurrentActiveBuffer();
        if (!buf) return;
        pushHistoryState();

        const pixels = [];
        for (let ry = 0; ry < selection.h; ry++) {
            const row = [];
            for (let rx = 0; rx < selection.w; rx++) {
                const px = selection.x + rx;
                const py = selection.y + ry;
                const col = (buf[py] && buf[py][px] !== undefined) ? buf[py][px] : null;
                row.push(col);
                if (buf[py] && px >= 0 && px < (buf[0] ? buf[0].length : 0)) {
                    buf[py][px] = null; // Cut original pixels into floating layer
                }
            }
            pixels.push(row);
        }

        selection.isFloating = true;
        selection.floatingPixels = pixels;
        selection.origPixels = pixels.map(r => [...r]);
        selection.pixels = pixels;
        selection.origW = selection.w;
        selection.origH = selection.h;
        selection.offsetX = selection.offsetX || 0;
        selection.offsetY = selection.offsetY || 0;
        updateSelectionToolbarUI();
        syncCurrentFrameBuffer();
        renderAll();
    }

    function scaleSelection(factorX, factorY) {
        if (!selection) return;
        if (!selection.isFloating) liftSelectionToFloating();
        if (!selection.origPixels) return;
        pushHistoryState();
        const newW = Math.max(1, Math.round(selection.w * factorX));
        const newH = Math.max(1, Math.round(selection.h * factorY));
        selection.w = newW;
        selection.h = newH;
        const scaled = scalePixelMatrix(selection.origPixels, selection.origW, selection.origH, newW, newH);
        selection.floatingPixels = scaled;
        selection.pixels = scaled;
        renderMainCanvas();
        drawGridOverlay();
        showToast(`📐 选区已缩放为 ${newW}×${newH} px (${Math.round(newW / selection.origW * 100)}% × ${Math.round(newH / selection.origH * 100)}%)`);
    }

    function getSelectionHandleAt(clientX, clientY) {
        if (!selection || !pixelCanvas) return null;
        if (selection.w < 2 || selection.h < 2) return null; // Small selection: full body drag
        const rect = pixelCanvas.getBoundingClientRect();
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;
        const cellW_screen = rect.width / resX;
        const cellH_screen = rect.height / resY;

        const sx = selection.x + (selection.offsetX || 0);
        const sy = selection.y + (selection.offsetY || 0);
        const sw = selection.w;
        const sh = selection.h;

        const handles = [
            { id: 'nw', x: sx, y: sy },
            { id: 'n', x: sx + sw / 2, y: sy },
            { id: 'ne', x: sx + sw, y: sy },
            { id: 'e', x: sx + sw, y: sy + sh / 2 },
            { id: 'se', x: sx + sw, y: sy + sh },
            { id: 's', x: sx + sw / 2, y: sy + sh },
            { id: 'sw', x: sx, y: sy + sh },
            { id: 'w', x: sx, y: sy + sh / 2 }
        ];

        // Specific 6px screen radius targeting the 8px handle anchor boxes
        const threshold = 6;
        for (const h of handles) {
            const hx_screen = rect.left + h.x * cellW_screen;
            const hy_screen = rect.top + h.y * cellH_screen;
            const dist = Math.hypot(clientX - hx_screen, clientY - hy_screen);
            if (dist <= threshold) {
                return h.id;
            }
        }
        return null;
    }

    function isInsideSelectionScreen(clientX, clientY) {
        if (!selection || !pixelCanvas) return false;
        const rect = pixelCanvas.getBoundingClientRect();
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;
        const cellW_screen = rect.width / resX;
        const cellH_screen = rect.height / resY;

        const sx = selection.x + (selection.offsetX || 0);
        const sy = selection.y + (selection.offsetY || 0);
        const sw = selection.w;
        const sh = selection.h;

        const fx = (clientX - rect.left) / cellW_screen;
        const fy = (clientY - rect.top) / cellH_screen;
        return (fx >= sx && fx <= sx + sw && fy >= sy && fy <= sy + sh);
    }

    function getCursorForHandle(handle) {
        switch (handle) {
            case 'nw':
            case 'se': return 'nwse-resize';
            case 'ne':
            case 'sw': return 'nesw-resize';
            case 'n':
            case 's': return 'ns-resize';
            case 'w':
            case 'e': return 'ew-resize';
            default: return 'crosshair';
        }
    }

    function updateSelectionCursor(clientX, clientY) {
        if (activeTool !== 'select' || isPanning || isSpacePressed) return;
        const targetElement = canvasWrapper || gridCanvas;
        if (!targetElement) return;

        if (selection) {
            if (selection.isResizing) {
                targetElement.style.cursor = getCursorForHandle(selection.resizeHandle);
                return;
            }
            if (selection.isDragging) {
                targetElement.style.cursor = 'move';
                return;
            }
            const handle = getSelectionHandleAt(clientX, clientY);
            if (handle) {
                targetElement.style.cursor = getCursorForHandle(handle);
                return;
            }
            if (isInsideSelectionScreen(clientX, clientY)) {
                targetElement.style.cursor = 'move';
                return;
            }
        }
        targetElement.style.cursor = 'crosshair';
    }

    function commitSelection() {
        if (!selection) return;
        if (selection.isFloating && (selection.floatingPixels || selection.pixels)) {
            const buf = getCurrentActiveBuffer();
            if (buf) {
                const targetX = selection.x + (selection.offsetX || 0);
                const targetY = selection.y + (selection.offsetY || 0);
                const floatPix = selection.floatingPixels || selection.pixels;

                for (let ry = 0; ry < selection.h; ry++) {
                    for (let rx = 0; rx < selection.w; rx++) {
                        const color = floatPix[ry] ? floatPix[ry][rx] : null;
                        const px = targetX + rx;
                        const py = targetY + ry;
                        if (px >= 0 && px < buf[0].length && py >= 0 && py < buf.length) {
                            if (color !== null && color !== undefined) {
                                buf[py][px] = color;
                            }
                        }
                    }
                }
            }
        }
        selection = null;
        updateSelectionToolbarUI();
        syncCurrentFrameBuffer();
        renderAll();
    }

    function deleteActiveSelection() {
        if (!selection) return;
        pushHistoryState();
        if (selection.isFloating) {
            selection = null;
        } else {
            const buf = getCurrentActiveBuffer();
            if (buf) {
                for (let ry = 0; ry < selection.h; ry++) {
                    for (let rx = 0; rx < selection.w; rx++) {
                        const px = selection.x + rx;
                        const py = selection.y + ry;
                        if (buf[py] && px >= 0 && px < (buf[0] ? buf[0].length : 0)) {
                            buf[py][px] = null;
                        }
                    }
                }
            }
            selection = null;
        }
        updateSelectionToolbarUI();
        syncCurrentFrameBuffer();
        renderAll();
        showToast('🗑️ 已删除选区像素');
    }

    function isInsideSelection(x, y) {
        if (!selection) return true; // Drawing constraint: no selection => all coordinates permitted
        const selMinX = selection.x + (selection.offsetX || 0);
        const selMinY = selection.y + (selection.offsetY || 0);
        const selMaxX = selMinX + selection.w - 1;
        const selMaxY = selMinY + selection.h - 1;
        return (x >= selMinX && x <= selMaxX && y >= selMinY && y <= selMaxY);
    }

    function isInsideSelectionBox(x, y) {
        if (!selection) return false;
        const selMinX = selection.x + (selection.offsetX || 0);
        const selMinY = selection.y + (selection.offsetY || 0);
        const selMaxX = selMinX + selection.w - 1;
        const selMaxY = selMinY + selection.h - 1;
        return (x >= selMinX && x <= selMaxX && y >= selMinY && y <= selMaxY);
    }

    function copySelection() {
        const buf = getCurrentActiveBuffer();
        if (!buf) return;
        if (selection) {
            if (selection.isFloating && (selection.floatingPixels || selection.pixels)) {
                const floatPix = selection.floatingPixels || selection.pixels;
                clipboard = floatPix.map(row => [...row]);
            } else {
                clipboard = [];
                for (let ry = 0; ry < selection.h; ry++) {
                    const row = [];
                    for (let rx = 0; rx < selection.w; rx++) {
                        const px = selection.x + rx;
                        const py = selection.y + ry;
                        row.push((buf[py] && buf[py][px] !== undefined) ? buf[py][px] : null);
                    }
                    clipboard.push(row);
                }
            }
            showToast(`📋 已复制选区 (${selection.w}×${selection.h} px)`);
        } else {
            clipboard = buf.map(row => [...row]);
            showToast('📋 已复制当前图层全图');
        }
    }

    function cutSelection() {
        if (!selection) {
            showToast('⚠️ 当前无选区可剪切！');
            return;
        }
        copySelection();
        deleteActiveSelection();
        showToast('✂️ 已剪切选区到剪贴板');
    }

    function pasteSelection() {
        if (!clipboard || !clipboard.length) {
            showToast('⚠️ 剪贴板为空！请先复制像素内容');
            return;
        }
        if (selection && selection.isFloating) commitSelection();
        pushHistoryState();
        const h = clipboard.length;
        const w = clipboard[0].length;
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        const startX = Math.max(0, Math.floor((resX - w) / 2));
        const startY = Math.max(0, Math.floor((resY - h) / 2));

        selection = {
            x: startX,
            y: startY,
            w: w,
            h: h,
            origW: w,
            origH: h,
            origPixels: clipboard.map(row => [...row]),
            floatingPixels: clipboard.map(row => [...row]),
            pixels: clipboard.map(row => [...row]),
            offsetX: 0,
            offsetY: 0,
            isFloating: true,
            isDragging: false,
            isResizing: false,
            resizeHandle: null
        };
        switchTool('select');
        updateSelectionToolbarUI();
        renderAll();
        showToast(`📥 已粘贴像素内容 (${w}×${h} px)`);
    }

    function selectAll() {
        if (selection && selection.isFloating) commitSelection();
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        selection = {
            x: 0,
            y: 0,
            w: resX,
            h: resY,
            origW: resX,
            origH: resY,
            origPixels: null,
            floatingPixels: null,
            pixels: null,
            offsetX: 0,
            offsetY: 0,
            isFloating: false,
            isDragging: false,
            isResizing: false,
            resizeHandle: null
        };
        updateSelectionToolbarUI();
        renderAll();
        showToast(`🔲 已全选画布 (${resX}×${resY} px)`);
    }

    function deselect() {
        if (!selection) return;
        if (selection.isFloating) {
            commitSelection();
            showToast('✔️ 已固定浮动选区并取消');
        } else {
            selection = null;
            updateSelectionToolbarUI();
            renderAll();
            showToast('✖️ 已取消选区');
        }
    }

    function flipHorizontal() {
        pushHistoryState();
        if (selection) {
            if (!selection.isFloating) liftSelectionToFloating();
            const pix = selection.floatingPixels || selection.pixels;
            if (pix) {
                pix.forEach(row => row.reverse());
                if (selection.origPixels) selection.origPixels.forEach(row => row.reverse());
                selection.floatingPixels = pix;
                selection.pixels = pix;
                renderMainCanvas();
                drawGridOverlay();
                showToast('↔️ 已水平翻转选中区域');
                return;
            }
        }
        const buf = getCurrentActiveBuffer();
        if (buf) {
            buf.forEach(row => row.reverse());
            syncCurrentFrameBuffer();
            renderAll();
            showToast('↔️ 已水平翻转');
        }
    }

    function flipVertical() {
        pushHistoryState();
        if (selection) {
            if (!selection.isFloating) liftSelectionToFloating();
            const pix = selection.floatingPixels || selection.pixels;
            if (pix) {
                pix.reverse();
                if (selection.origPixels) selection.origPixels.reverse();
                selection.floatingPixels = pix;
                selection.pixels = pix;
                renderMainCanvas();
                drawGridOverlay();
                showToast('↕️ 已垂直翻转选中区域');
                return;
            }
        }
        const buf = getCurrentActiveBuffer();
        if (buf) {
            buf.reverse();
            syncCurrentFrameBuffer();
            renderAll();
            showToast('↕️ 已垂直翻转');
        }
    }

    function rotate90() {
        pushHistoryState();
        if (selection) {
            if (!selection.isFloating) liftSelectionToFloating();
            const pix = selection.floatingPixels || selection.pixels;
            if (pix) {
                const oldH = pix.length;
                const oldW = pix[0].length;
                const newPixels = [];
                for (let x = 0; x < oldW; x++) {
                    const row = [];
                    for (let y = oldH - 1; y >= 0; y--) {
                        row.push(pix[y][x]);
                    }
                    newPixels.push(row);
                }
                selection.floatingPixels = newPixels;
                selection.pixels = newPixels;
                selection.w = oldH;
                selection.h = oldW;
                if (selection.origPixels) {
                    const origOldH = selection.origPixels.length;
                    const origOldW = selection.origPixels[0].length;
                    const newOrig = [];
                    for (let x = 0; x < origOldW; x++) {
                        const row = [];
                        for (let y = origOldH - 1; y >= 0; y--) {
                            row.push(selection.origPixels[y][x]);
                        }
                        newOrig.push(row);
                    }
                    selection.origPixels = newOrig;
                    selection.origW = origOldH;
                    selection.origH = origOldW;
                }
                renderMainCanvas();
                drawGridOverlay();
                showToast('🔄 选区顺时针旋转 90°');
                return;
            }
        }
        const buf = getCurrentActiveBuffer();
        if (buf) {
            const resY = buf.length;
            const resX = buf[0].length;
            const rotated = engine.createBuffer(resY, resX);

            for (let y = 0; y < resY; y++) {
                for (let x = 0; x < resX; x++) {
                    rotated[x][resY - 1 - y] = buf[y][x];
                }
            }

            initFrameLayers(currentFrame);
            frameLayers[currentFrame][activeLayerIndex].buffer = rotated;
            syncCurrentFrameBuffer();
            renderAll();
            showToast('🔄 已顺时针旋转 90°');
        }
    }
    // #endregion [R6] 选区与剪贴板 (Selection & Clipboard)

    function lightenColor(hex, amount = 0.12) {
        if (!hex) return null;
        const str = safeHex6(hex);
        let r = parseInt(str.slice(1, 3), 16);
        let g = parseInt(str.slice(3, 5), 16);
        let b = parseInt(str.slice(5, 7), 16);

        r = Math.min(255, Math.round(r + (255 - r) * amount + 8));
        g = Math.min(255, Math.round(g + (255 - g) * amount + 8));
        b = Math.min(255, Math.round(b + (255 - b) * amount + 8));

        return engine.rgbToHex([r, g, b]);
    }

    function darkenColor(hex, amount = 0.12) {
        if (!hex) return null;
        const str = safeHex6(hex);
        let r = parseInt(str.slice(1, 3), 16);
        let g = parseInt(str.slice(3, 5), 16);
        let b = parseInt(str.slice(5, 7), 16);

        r = Math.max(0, Math.round(r * (1 - amount)));
        g = Math.max(0, Math.round(g * (1 - amount)));
        b = Math.max(0, Math.round(b * (1 - amount)));

        return engine.rgbToHex([r, g, b]);
    }

    function applyShadingBrush(buf, x, y, isDarken = false) {
        if (!buf) return;
        const resX = engine.resX || engine.resolution || 32;
        const resY = engine.resY || engine.resolution || 32;

        const applyAt = (px, py) => {
            if (px < 0 || px >= resX || py < 0 || py >= resY) return;
            for (let sy = 0; sy < brushSize; sy++) {
                for (let sx = 0; sx < brushSize; sx++) {
                    const targetX = px + sx;
                    const targetY = py + sy;
                    if (targetX >= 0 && targetX < resX && targetY >= 0 && targetY < resY) {
                        if (selection && !isInsideSelection(targetX, targetY)) continue;
                        const currentHex = buf[targetY][targetX];
                        if (currentHex) {
                            const newHex = isDarken ? darkenColor(currentHex) : lightenColor(currentHex);
                            buf[targetY][targetX] = newHex;
                        }
                    }
                }
            }
        };

        applyAt(x, y);

        if (mirrorMode === 'horizontal' || mirrorMode === 'dual') {
            const mx = resX - 1 - x - (brushSize - 1);
            applyAt(mx, y);
        }
        if (mirrorMode === 'vertical' || mirrorMode === 'dual') {
            const my = resY - 1 - y - (brushSize - 1);
            applyAt(x, my);
        }
        if (mirrorMode === 'dual') {
            const mx = resX - 1 - x - (brushSize - 1);
            const my = resY - 1 - y - (brushSize - 1);
            applyAt(mx, my);
        }
    }

    function drawBresenhamShadingLine(buf, x0, y0, x1, y1, isDarken = false) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            applyShadingBrush(buf, x0, y0, isDarken);
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    // ============================================================
    // PRO ADVANCED POWER TOOLS (Dithering, Shading, RotSprite, Tile)
    // ============================================================

    function getDitherColor(x, y, color) {
        if (ditherPattern === 'checkerboard') {
            return (x + y) % 2 === 0 ? color : null;
        } else if (ditherPattern === 'bayer2x2') {
            const matrix = [[0, 2], [3, 1]];
            const val = matrix[y % 2][x % 2];
            return val < 2 ? color : null;
        } else if (ditherPattern === 'bayer4x4') {
            const matrix = [
                [0, 8, 2, 10],
                [12, 4, 14, 6],
                [3, 11, 1, 9],
                [15, 7, 13, 5]
            ];
            const val = matrix[y % 4][x % 4];
            return val < 8 ? color : null;
        }
        return color;
    }

    function applyShading(type) {
        if (!checkIsProActive()) {
            openProModal();
            showToast('👑 自动阴影/高光刷为 PRO 专属功能！');
            return;
        }
        pushHistoryState();
        const buf = getCurrentActiveBuffer();
        const resY = buf.length;
        const resX = buf[0].length;

        for (let y = 0; y < resY; y++) {
            for (let x = 0; x < resX; x++) {
                const hex = buf[y][x];
                if (hex) {
                    const rgb = engine.hslToRgb(0, 0, 0); // Convert hex to rgb
                    const parse = safeHex6(hex);
                    const r = parseInt(parse.slice(1, 3), 16);
                    const g = parseInt(parse.slice(3, 5), 16);
                    const b = parseInt(parse.slice(5, 7), 16);

                    const factor = type === 'lighten' ? 1.2 : 0.8;
                    const nr = Math.min(255, Math.max(0, Math.round(r * factor)));
                    const ng = Math.min(255, Math.max(0, Math.round(g * factor)));
                    const nb = Math.min(255, Math.max(0, Math.round(b * factor)));
                    buf[y][x] = engine.rgbToHex([nr, ng, nb]);
                }
            }
        }
        syncCurrentFrameBuffer();
        renderAll();
        showToast(type === 'lighten' ? '☀️ 已应用高光加亮' : '🌙 已应用阴影加深');
    }

    function rotspriteRotate() {
        if (!checkIsProActive()) {
            openProModal();
            showToast('👑 RotSprite 像素无损旋转为 PRO 专属功能！');
            return;
        }
        rotate90(); // RotSprite algorithm wrapper fallback
        showToast('🔄 已应用 RotSprite 高精像素无损旋转');
    }

    // ============================================================
    // SPRITE SHEET SLICER & IMAGE TO PIXEL ART (PRO)
    // ============================================================

    function openSpriteSheetSlicer() {
        if (!checkIsProActive()) {
            openProModal();
            showToast('👑 Sprite Sheet 切割器为 PRO 专属功能！');
            return;
        }
        if (slicerModal) slicerModal.style.display = 'flex';
    }

    function closeSpriteSheetSlicer() {
        if (slicerModal) slicerModal.style.display = 'none';
    }

    function handleSlicerFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (!slicerPreviewCanvas) return;
                const ctx = slicerPreviewCanvas.getContext('2d');
                slicerPreviewCanvas.width = img.width;
                slicerPreviewCanvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function confirmSliceSpriteSheet() {
        const frameW = parseInt(slicerFrameW.value) || 32;
        const frameH = parseInt(slicerFrameH.value) || 32;

        if (!slicerPreviewCanvas || slicerPreviewCanvas.width === 0) {
            alert('请先选择有效的 Sprite Sheet 图片！');
            return;
        }

        pushHistoryState();

        const imgW = slicerPreviewCanvas.width;
        const imgH = slicerPreviewCanvas.height;
        const cols = Math.floor(imgW / frameW);
        const rows = Math.floor(imgH / frameH);
        const totalFrames = cols * rows;

        if (totalFrames === 0) {
            alert('单帧尺寸过大，图片无法切割！');
            return;
        }

        engine.resX = frameW;
        engine.resY = frameH;
        engine.resolution = Math.max(frameW, frameH);
        updateCanvasDOMDimensions(frameW, frameH);

        frameBuffers = [];
        frameLayers = [];

        const ctx = slicerPreviewCanvas.getContext('2d');

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const imgData = ctx.getImageData(c * frameW, r * frameH, frameW, frameH).data;
                const buf = engine.createBuffer(frameW, frameH);

                for (let y = 0; y < frameH; y++) {
                    for (let x = 0; x < frameW; x++) {
                        const idx = (y * frameW + x) * 4;
                        const a = imgData[idx + 3];
                        if (a > 20) {
                            buf[y][x] = engine.rgbToHex([imgData[idx], imgData[idx + 1], imgData[idx + 2]]);
                        }
                    }
                }

                frameBuffers.push(buf);
                frameLayers.push([{
                    id: `layer_0_${Date.now()}_${frameBuffers.length}`,
                    name: 'Layer 1 (Background)',
                    visible: true,
                    opacity: 1.0,
                    buffer: cloneBuffer(buf)
                }]);
            }
        }

        currentFrame = 0;
        activeLayerIndex = 0;
        closeSpriteSheetSlicer();
        renderAll();
        showToast(`✨ 成功将 Sprite Sheet 切割为 ${totalFrames} 帧动画！`);
    }

    function openPixelateConverter() {
        if (!checkIsProActive()) {
            openProModal();
            showToast('👑 照片转像素画转换器为 PRO 专属功能！');
            return;
        }
        if (pixelateModal) pixelateModal.style.display = 'flex';
    }

    function closePixelateConverter() {
        if (pixelateModal) pixelateModal.style.display = 'none';
    }

    function handlePixelateFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (!pixelatePreviewCanvas) return;
                const resX = engine.resX || 32;
                const resY = engine.resY || 32;
                pixelatePreviewCanvas.width = resX;
                pixelatePreviewCanvas.height = resY;
                const ctx = pixelatePreviewCanvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, resX, resY);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function confirmPixelateImage() {
        if (!pixelatePreviewCanvas || pixelatePreviewCanvas.width === 0) {
            alert('请先上传原图！');
            return;
        }
        pushHistoryState();

        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        const ctx = pixelatePreviewCanvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, resX, resY).data;
        const buf = getCurrentActiveBuffer();

        for (let y = 0; y < resY; y++) {
            for (let x = 0; x < resX; x++) {
                const idx = (y * resX + x) * 4;
                const a = imgData[idx + 3];
                if (a > 20) {
                    buf[y][x] = engine.rgbToHex([imgData[idx], imgData[idx + 1], imgData[idx + 2]]);
                } else {
                    buf[y][x] = null;
                }
            }
        }

        syncCurrentFrameBuffer();
        closePixelateConverter();
        renderAll();
        showToast('✨ 成功将图片转换为像素画载入画布！');
    }

    // ============================================================
    // EVENT BINDINGS & SHORTCUTS
    // ============================================================

    // ============================================================
    // ADVANCED PALETTE TOOLS (Extract from image / Color harmony / Palette swap)
    // ============================================================

    let paletteSwapPending = false;

    function hexToHsl(hex) {
        const s6 = safeHex6(hex);
        const r = parseInt(s6.slice(1, 3), 16) / 255;
        const g = parseInt(s6.slice(3, 5), 16) / 255;
        const b = parseInt(s6.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        let h = 0;
        let s = 0;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
        }
        return { h, s: s * 100, l: l * 100 };
    }

    function hslToHex(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
    }

    function addColorsToPalette(colors) {
        let added = 0;
        colors.forEach(col => {
            const hex = safeHex6(col).toUpperCase();
            if (!customPalette.some(c => safeHex6(c).toUpperCase() === hex)) {
                customPalette.push(hex);
                added++;
            }
        });
        updatePaletteSwatchesUI();
        return added;
    }

    // Upload an image and replace the palette with its (up to 16) dominant colors
    function extractPaletteFromImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const maxSide = 128;
                    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                    const w = Math.max(1, Math.round(img.width * scale));
                    const h = Math.max(1, Math.round(img.height * scale));
                    const c = document.createElement('canvas');
                    c.width = w;
                    c.height = h;
                    const cx = c.getContext('2d');
                    cx.drawImage(img, 0, 0, w, h);
                    const data = cx.getImageData(0, 0, w, h).data;

                    // Bucket colors (5 bits per channel) and count occurrences
                    const buckets = new Map();
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] < 128) continue;
                        const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
                        const bk = buckets.get(key);
                        if (bk) { bk.n++; bk.r += data[i]; bk.g += data[i + 1]; bk.b += data[i + 2]; }
                        else buckets.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
                    }

                    const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
                    const picked = [];
                    for (const bk of sorted) {
                        const rgb = [bk.r / bk.n, bk.g / bk.n, bk.b / bk.n].map(Math.round);
                        // Skip colors too similar to ones already picked
                        const tooClose = picked.some(p => Math.abs(p[0] - rgb[0]) + Math.abs(p[1] - rgb[1]) + Math.abs(p[2] - rgb[2]) < 48);
                        if (!tooClose) picked.push(rgb);
                        if (picked.length >= 16) break;
                    }

                    if (picked.length === 0) {
                        showToast(t('palette_extract_fail'));
                        return;
                    }
                    customPalette = picked.map(rgb => safeHex6(engine.rgbToHex(rgb)).toUpperCase());
                    updatePaletteSwatchesUI();
                    showToast(t('palette_extracted', { n: picked.length }));
                };
                img.onerror = () => showToast(t('palette_extract_fail'));
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
        input.click();
    }

    // Add complementary / analogous / triadic colors of the current brush color
    function addColorHarmony() {
        const { h, s, l } = hexToHsl(activeColor);
        const sat = Math.max(s, 35);
        const harmony = [
            hslToHex(h + 180, sat, l), // complementary
            hslToHex(h + 30, sat, l),  // analogous
            hslToHex(h - 30, sat, l),  // analogous
            hslToHex(h + 120, sat, l), // triadic
            hslToHex(h + 240, sat, l), // triadic
            hslToHex(h, sat, Math.min(95, l + 18)), // tint
            hslToHex(h, sat, Math.max(10, l - 18))  // shade
        ];
        const added = addColorsToPalette(harmony);
        const swatchesEl = document.getElementById('palette-swatches');
        if (swatchesEl) {
            swatchesEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            swatchesEl.style.transition = 'box-shadow 0.3s ease';
            swatchesEl.style.boxShadow = '0 0 12px var(--accent-cyan)';
            setTimeout(() => { swatchesEl.style.boxShadow = ''; }, 600);
        }
        showToast(added > 0 ? t('harmony_added', { n: added }) : '✨ 已更新色彩和谐与明暗色阶！');
    }

    // Enter "pick a color on canvas" mode; the next left click replaces that color
    function startPaletteSwap() {
        commitSelection();
        paletteSwapPending = true;
        if (pixelCanvas) pixelCanvas.style.cursor = 'crosshair';
        if (canvasContainerBox) canvasContainerBox.style.cursor = 'crosshair';
        showToast(t('swap_pick_prompt'));
    }

    function cancelPaletteSwap() {
        if (!paletteSwapPending) return;
        paletteSwapPending = false;
        if (pixelCanvas) pixelCanvas.style.cursor = (activeTool === 'move') ? 'move' : '';
        if (canvasContainerBox) canvasContainerBox.style.cursor = (activeTool === 'move') ? 'move' : '';
        showToast(t('swap_cancelled'));
    }

    function performPaletteSwapAt(x, y) {
        paletteSwapPending = false;
        if (pixelCanvas) pixelCanvas.style.cursor = (activeTool === 'move') ? 'move' : '';
        if (canvasContainerBox) canvasContainerBox.style.cursor = (activeTool === 'move') ? 'move' : '';
        const buf = getCurrentActiveBuffer();
        const from = (buf && buf[y]) ? buf[y][x] : null;
        if (!from) {
            showToast(t('swap_no_color'));
            return;
        }
        const fromHex = safeHex6(from).toUpperCase();
        const toHex = safeHex6(activeColor).toUpperCase();
        if (fromHex === toHex) {
            showToast(t('swap_same_color'));
            return;
        }

        pushHistoryState();
        let count = 0;
        for (let yy = 0; yy < buf.length; yy++) {
            const row = buf[yy];
            if (!row) continue;
            for (let xx = 0; xx < row.length; xx++) {
                if (row[xx] && safeHex6(row[xx]).toUpperCase() === fromHex) {
                    row[xx] = toHex;
                    count++;
                }
            }
        }
        syncCurrentFrameBuffer();
        renderAll();
        showToast(t('swap_done', { from: fromHex, to: toHex, n: count }));
    }

    // ============================================================
    // ADVANCED PALETTE STUDIO (RETRO PRESETS & HARMONY RAMPS)
    // ============================================================

    const RETRO_PALETTE_PRESETS = [
        {
            id: 'pico8',
            name: '🎮 PICO-8',
            colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA']
        },
        {
            id: 'gameboy',
            name: '👾 Game Boy (Classic)',
            colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
        },
        {
            id: 'nes',
            name: '🕹️ NES Nintendo 16',
            colors: ['#000000', '#2038ec', '#0058f8', '#3cbcfc', '#98f898', '#58d854', '#a81000', '#e40058', '#f83800', '#f87800', '#fca044', '#f8b800', '#f8d878', '#ffffff', '#b8b8b8', '#7c7c7c']
        },
        {
            id: 'endesga32',
            name: '🎨 Endesga 32',
            colors: ['#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f56', '#733e39', '#3e2731', '#a22633', '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e', '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466', '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569']
        },
        {
            id: 'cyberpunk',
            name: '🌃 Cyberpunk Neon',
            colors: ['#0d0221', '#0f084b', '#26408b', '#0d0835', '#0f4c5c', '#00f0ff', '#7000ff', '#ff007f', '#ff003c', '#ffe600', '#05ffa1', '#f0f3f4', '#39ff14', '#1b003a', '#9400d3', '#ffffff']
        },
        {
            id: 'pastel',
            name: '🧁 Pastel Fantasy',
            colors: ['#6c567b', '#c06c84', '#f67280', '#f8b195', '#ffe5b4', '#b5ead7', '#c7ceea', '#e2f0cb', '#ffdac1', '#ffb7b2', '#b28dff', '#aff8db', '#ffabab', '#e0bbe4', '#957dad', '#d291bc']
        },
        {
            id: 'c64',
            name: '🖥️ Commodore 64',
            colors: ['#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77', '#dd8855', '#664400', '#ff7777', '#333333', '#777777', '#aaff66', '#0088ff', '#bbbbbb']
        },
        {
            id: 'solarized',
            name: '☀️ Solarized 16',
            colors: ['#002b36', '#073642', '#586e75', '#657b83', '#839496', '#93a1a1', '#eee8d5', '#fdf6e3', '#b58900', '#cb4b16', '#dc322f', '#d33682', '#6c71c4', '#268bd2', '#2aa198', '#859900']
        }
    ];

    let currentHarmoniesGenerated = [];

    function openAdvancedPaletteModal() {
        const modal = document.getElementById('advanced-palette-modal');
        if (!modal) return;
        renderRetroPalettePresets();
        updateAdvancedPaletteHarmonyUI();
        modal.style.display = 'flex';
    }

    function closeAdvancedPaletteModal() {
        const modal = document.getElementById('advanced-palette-modal');
        if (modal) modal.style.display = 'none';
    }

    function renderRetroPalettePresets() {
        const grid = document.getElementById('adv-palette-presets-grid');
        if (!grid) return;
        grid.innerHTML = '';

        RETRO_PALETTE_PRESETS.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'adv-preset-card';

            const header = document.createElement('div');
            header.className = 'adv-preset-header';

            const name = document.createElement('span');
            name.className = 'adv-preset-name';
            name.textContent = preset.name;

            const count = document.createElement('span');
            count.className = 'adv-preset-count';
            count.textContent = `${preset.colors.length} 色`;

            header.appendChild(name);
            header.appendChild(count);

            const strip = document.createElement('div');
            strip.className = 'adv-preset-swatches-strip';
            preset.colors.forEach(col => {
                const slice = document.createElement('div');
                slice.className = 'adv-preset-color-slice';
                slice.style.backgroundColor = col;
                strip.appendChild(slice);
            });

            card.appendChild(header);
            card.appendChild(strip);

            card.addEventListener('click', () => {
                customPalette = [...preset.colors.map(c => safeHex6(c).toUpperCase())];
                updatePaletteSwatchesUI();
                if (preset.colors[0]) setActiveColor(preset.colors[0]);
                showToast(`🎨 已成功载入【${preset.name}】调色板 (${preset.colors.length} 色)！`);
            });

            grid.appendChild(card);
        });
    }

    function updateAdvancedPaletteHarmonyUI() {
        const baseSwatch = document.getElementById('adv-harmony-base-swatch');
        const baseHex = document.getElementById('adv-harmony-base-hex');
        const box = document.getElementById('adv-harmony-swatches-box');
        if (!box) return;

        if (baseSwatch) baseSwatch.style.backgroundColor = activeColor;
        if (baseHex) baseHex.textContent = activeColor;

        const { h, s, l } = hexToHsl(activeColor);
        const sat = Math.max(s, 35);
        const comp = hslToHex(h + 180, sat, l);
        const anal1 = hslToHex(h + 30, sat, l);
        const anal2 = hslToHex(h - 30, sat, l);
        const tri1 = hslToHex(h + 120, sat, l);
        const tri2 = hslToHex(h + 240, sat, l);
        const light1 = hslToHex(h, sat, Math.min(95, l + 18));
        const light2 = hslToHex(h, sat, Math.min(98, l + 32));
        const dark1 = hslToHex(h, sat, Math.max(10, l - 18));
        const dark2 = hslToHex(h, sat, Math.max(5, l - 32));

        currentHarmoniesGenerated = [comp, anal1, anal2, tri1, tri2, light2, light1, dark1, dark2].map(c => safeHex6(c).toUpperCase());

        box.innerHTML = '';
        currentHarmoniesGenerated.forEach((hex) => {
            const chip = document.createElement('div');
            chip.className = 'adv-harmony-chip';
            chip.title = `点击设为主画笔颜色: ${hex}`;

            const dot = document.createElement('div');
            dot.className = 'adv-harmony-color-dot';
            dot.style.backgroundColor = hex;

            const text = document.createElement('span');
            text.className = 'adv-harmony-chip-text';
            text.textContent = hex;

            chip.appendChild(dot);
            chip.appendChild(text);

            chip.addEventListener('click', () => {
                setActiveColor(hex);
                updateAdvancedPaletteHarmonyUI();
                showToast(`🖌️ 已选择画笔颜色: ${hex}`);
            });

            box.appendChild(chip);
        });
    }

    function updateAdvancedPaletteModalI18n() {
        if (typeof updateAdvancedPaletteHarmonyUI === 'function') {
            updateAdvancedPaletteHarmonyUI();
        }
    }

    // ============================================================
    // #region [R10] 事件总线与初始化 (Event Bus & Init)
    // ============================================================
    function bindEvents() {
        if (canvasWrapper) canvasWrapper.addEventListener('contextmenu', (e) => e.preventDefault());

        // ===== 最近颜色栏 & 调色板：统一事件委托 =====
        if (recentColorsBar) {
            recentColorsBar.addEventListener('click', (e) => {
                const swatch = e.target.closest('.swatch');
                if (!swatch) return;
                e.preventDefault();
                const hex = rgbToHex(swatch.style.backgroundColor);
                if (typeof window.setActiveColor === 'function') window.setActiveColor(hex);
            });
            recentColorsBar.addEventListener('contextmenu', (e) => {
                const swatch = e.target.closest('.swatch');
                if (!swatch) return;
                e.preventDefault();
                e.stopPropagation();
                const hex = rgbToHex(swatch.style.backgroundColor);
                if (typeof window.setSecondaryColor === 'function') window.setSecondaryColor(hex, true);
            });
        }

        if (paletteSwatches) {
            paletteSwatches.addEventListener('click', (e) => {
                const swatch = e.target.closest('.swatch');
                if (!swatch) return;
                e.preventDefault();
                const hex = rgbToHex(swatch.style.backgroundColor);
                if (typeof window.setActiveColor === 'function') window.setActiveColor(hex);
            });
            paletteSwatches.addEventListener('contextmenu', (e) => {
                const swatch = e.target.closest('.swatch');
                if (!swatch) return;
                e.preventDefault();
                e.stopPropagation();

                if (e.shiftKey || e.altKey) {
                    // Shift+右键删除调色板颜色
                    const hex = rgbToHex(swatch.style.backgroundColor).toUpperCase();
                    const idx = customPalette.findIndex(c => safeHex6(c).toUpperCase() === hex);
                    if (idx > -1) {
                        customPalette.splice(idx, 1);
                        updatePaletteSwatchesUI();
                        showToast(`🗑️ 已删除颜色: ${hex}`);
                    }
                } else {
                    const hex = rgbToHex(swatch.style.backgroundColor);
                    if (typeof window.setSecondaryColor === 'function') window.setSecondaryColor(hex, true);
                }
            });
        }

        // Collapsible Section Headers
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.collapsible-section');
                if (section) {
                    const content = section.querySelector('.collapsible-content');
                    const arrow = section.querySelector('.toggle-arrow');
                    if (content) content.classList.toggle('collapsed');
                    if (arrow) arrow.classList.toggle('collapsed');
                }
            });
        });

        // Drawing Tool Switcher
        drawToolBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTool(btn.dataset.tool));
        });

        // Brush Size Switcher
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                brushSize = parseInt(btn.dataset.size) || 1;
                showToast(`🖌️ 画笔粗细设为: ${brushSize}px`);
            });
        });

        // Pixel Perfect Toggle
        if (checkPixelPerfect) {
            checkPixelPerfect.addEventListener('change', (e) => {
                isPixelPerfect = e.target.checked;
            });
        }

        // Mirror Symmetry Selection
        if (selectMirrorMode) {
            selectMirrorMode.addEventListener('change', (e) => {
                mirrorMode = e.target.value;
                drawSymmetryOverlay();
                showToast(`↔️ 镜像对称模式: ${selectMirrorMode.options[selectMirrorMode.selectedIndex].text}`);
            });
        }

        // Transform Buttons
        if (btnFlipH) btnFlipH.addEventListener('click', flipHorizontal);
        if (btnFlipV) btnFlipV.addEventListener('click', flipVertical);
        if (btnRotate90) btnRotate90.addEventListener('click', rotate90);

        // Layers Stack Controls
        if (paramLayerOpacity) {
            paramLayerOpacity.addEventListener('input', (e) => {
                const opacityVal = parseInt(e.target.value) / 100;
                if (valLayerOpacity) valLayerOpacity.textContent = `${e.target.value}%`;
                initFrameLayers(currentFrame);
                const activeLayer = frameLayers[currentFrame][activeLayerIndex];
                if (activeLayer) {
                    activeLayer.opacity = opacityVal;
                    renderMainCanvas();
                }
            });
        }

        if (btnAddLayer) {
            btnAddLayer.addEventListener('click', () => {
                pushHistoryState();
                initFrameLayers(currentFrame);
                const layers = frameLayers[currentFrame];
                const newIdx = layers.length + 1;
                const resX = engine.resX || 32;
                const resY = engine.resY || 32;
                const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
                layers.push({
                    id: `layer_${Date.now()}`,
                    name: `${dict.layer_default_name || '图层'} ${newIdx}`,
                    visible: true,
                    opacity: 1.0,
                    buffer: engine.createBuffer(resX, resY)
                });
                activeLayerIndex = layers.length - 1;
                renderLayersUI();
                renderMainCanvas();
                showToast(`${dict.layer_created || '🥞 已创建【图层 {index}】'}`.replace('{index}', newIdx));
            });
        }

        if (btnDupLayer) {
            btnDupLayer.addEventListener('click', () => {
                pushHistoryState();
                initFrameLayers(currentFrame);
                const layers = frameLayers[currentFrame];
                const curLayer = layers[activeLayerIndex];
                if (curLayer) {
                    layers.splice(activeLayerIndex + 1, 0, {
                        id: `layer_${Date.now()}`,
                        name: `${curLayer.name} (副本)`,
                        visible: true,
                        opacity: curLayer.opacity,
                        buffer: cloneBuffer(curLayer.buffer)
                    });
                    activeLayerIndex++;
                    renderLayersUI();
                    renderMainCanvas();
                    showToast(`📋 已复制【${curLayer.name}】`);
                }
            });
        }

        if (btnRenameLayer) {
            btnRenameLayer.addEventListener('click', () => {
                initFrameLayers(currentFrame);
                const activeItem = layersContainer.querySelector(`.layer-item[data-layer-index="${activeLayerIndex}"]`);
                if (activeItem && activeItem._triggerRename) {
                    activeItem._triggerRename();
                }
            });
        }

        if (btnLayerUp) {
            btnLayerUp.addEventListener('click', () => {
                initFrameLayers(currentFrame);
                const layers = frameLayers[currentFrame];
                if (activeLayerIndex < layers.length - 1) {
                    pushHistoryState();
                    const temp = layers[activeLayerIndex];
                    layers[activeLayerIndex] = layers[activeLayerIndex + 1];
                    layers[activeLayerIndex + 1] = temp;
                    activeLayerIndex++;
                    renderLayersUI();
                    renderMainCanvas();
                }
            });
        }

        if (btnLayerDown) {
            btnLayerDown.addEventListener('click', () => {
                initFrameLayers(currentFrame);
                const layers = frameLayers[currentFrame];
                if (activeLayerIndex > 0) {
                    pushHistoryState();
                    const temp = layers[activeLayerIndex];
                    layers[activeLayerIndex] = layers[activeLayerIndex - 1];
                    layers[activeLayerIndex - 1] = temp;
                    activeLayerIndex--;
                    renderLayersUI();
                    renderMainCanvas();
                }
            });
        }

        if (btnMergeLayer) {
            btnMergeLayer.addEventListener('click', mergeLayerDown);
        }

        if (btnDelLayer) {
            btnDelLayer.addEventListener('click', () => {
                initFrameLayers(currentFrame);
                const layers = frameLayers[currentFrame];
                if (layers.length <= 1) {
                    showToast('⚠️ 至少需要保留一个图层！');
                    return;
                }
                pushHistoryState();
                const deletedName = layers[activeLayerIndex].name;
                layers.splice(activeLayerIndex, 1);
                activeLayerIndex = Math.max(0, activeLayerIndex - 1);
                renderLayersUI();
                renderMainCanvas();
                showToast(`🗑️ 已删除【${deletedName}】`);
            });
        }

        function mergeLayerDown() {
            initFrameLayers(currentFrame);
            const layers = frameLayers[currentFrame];
            if (activeLayerIndex <= 0) {
                showToast('⚠️ 已经是最底层，无法向下合并！');
                return;
            }
            pushHistoryState();

            const topLayer = layers[activeLayerIndex];
            const targetLayer = layers[activeLayerIndex - 1];

            const resX = engine.resX || 32;
            const resY = engine.resY || 32;

            const topBuf = topLayer.buffer;
            const targetBuf = targetLayer.buffer;

            for (let y = 0; y < resY; y++) {
                if (!topBuf || !topBuf[y]) continue;
                for (let x = 0; x < resX; x++) {
                    const topColor = topBuf[y][x];
                    if (topColor !== null && topColor !== undefined) {
                        if (targetBuf && targetBuf[y]) {
                            targetBuf[y][x] = topColor;
                        }
                    }
                }
            }

            const mergedName = topLayer.name;
            layers.splice(activeLayerIndex, 1);
            activeLayerIndex = activeLayerIndex - 1;

            syncCurrentFrameBuffer();
            renderLayersUI();
            renderMainCanvas();
            showToast(`🔽 已将【${mergedName}】向下合并！`);
        }

        // Canvas Resolution & BG
        if (resolutionSelect) {
            resolutionSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val !== 'custom') {
                    const num = parseInt(val);
                    applyCanvasResolution(num, num);
                }
            });
        }

        if (btnApplyCustomRes) {
            btnApplyCustomRes.addEventListener('click', () => {
                const xVal = resCustomX ? resCustomX.value : 32;
                const yVal = resCustomY ? resCustomY.value : 32;
                applyCanvasResolution(xVal, yVal);
            });
        }

        if (resCustomX) {
            resCustomX.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const xVal = resCustomX.value;
                    const yVal = resCustomY ? resCustomY.value : 32;
                    applyCanvasResolution(xVal, yVal);
                    resCustomX.blur();
                }
            });
        }

        if (resCustomY) {
            resCustomY.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const xVal = resCustomX ? resCustomX.value : 32;
                    const yVal = resCustomY.value;
                    applyCanvasResolution(xVal, yVal);
                    resCustomY.blur();
                }
            });
        }

        // Drag & Drop File Import Support
        const dropTarget = canvasContainerBox || document.body;
        if (dropTarget) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropTarget.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            dropTarget.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    handleFileImport({ target: { files: dt.files, value: '' } });
                }
            }, false);
        }

        if (selectBgMode) {
            selectBgMode.addEventListener('change', (e) => {
                bgMode = e.target.value;
                if (solidBgColorGroup) solidBgColorGroup.style.display = (bgMode === 'solid') ? 'flex' : 'none';
                renderMainCanvas();
            });
        }

        if (bgColorPicker) {
            bgColorPicker.addEventListener('input', (e) => {
                solidBgColor = e.target.value;
                renderMainCanvas();
            });
        }

        // Edit Bar Actions
        if (btnUndo) btnUndo.addEventListener('click', undo);
        if (btnRedo) btnRedo.addEventListener('click', redo);
        if (btnFrameClear) {
            btnFrameClear.addEventListener('click', () => {
                pushHistoryState();
                const buf = getCurrentActiveBuffer();
                const resX = engine.resX || 32;
                const resY = engine.resY || 32;
                for (let y = 0; y < resY; y++) {
                    for (let x = 0; x < resX; x++) buf[y][x] = null;
                }
                syncCurrentFrameBuffer();
                renderAll();
                showToast('🧹 已清空当前图层');
            });
        }
        if (btnCopy) btnCopy.addEventListener('click', copySelection);
        if (btnPaste) btnPaste.addEventListener('click', pasteSelection);
        if (btnScale2x) btnScale2x.addEventListener('click', () => scaleSelection(2.0, 2.0));
        if (btnScaleHalf) btnScaleHalf.addEventListener('click', () => scaleSelection(0.5, 0.5));
        if (btnCommitSelection) btnCommitSelection.addEventListener('click', () => commitSelection());
        if (btnDeleteSelection) btnDeleteSelection.addEventListener('click', deleteActiveSelection);
        if (btnSelectAll) btnSelectAll.addEventListener('click', selectAll);
        if (btnDeselect) btnDeselect.addEventListener('click', deselect);

        // Zoom & Grid
        if (btnGrid) {
            btnGrid.addEventListener('click', () => {
                showGrid = !showGrid;
                btnGrid.classList.toggle('active', showGrid);
                drawGridOverlay();
            });
        }
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => zoomOut());
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => zoomIn());
        if (btnZoomReset) btnZoomReset.addEventListener('click', resetZoom);

        // Colors
        if (primaryColorPicker) primaryColorPicker.addEventListener('input', (e) => setActiveColor(e.target.value));
        if (activeColorIndicator) activeColorIndicator.addEventListener('click', () => primaryColorPicker.click());
        if (hexColorInput) {
            hexColorInput.addEventListener('change', (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) setActiveColor(val);
            });
        }

        if (btnAddSwatch) {
            btnAddSwatch.addEventListener('click', () => {
                if (!customPalette.includes(activeColor)) {
                    customPalette.push(activeColor);
                    updatePaletteSwatchesUI();
                    showToast(`➕ 已添加色块到调色板: ${activeColor}`);
                }
            });
        }

        // Mouse Drawing Events on Canvas Wrapper
        const targetElement = canvasWrapper || gridCanvas;

        // Prevent HTML5 default image / canvas drag-and-drop ghosts
        if (canvasWrapper) canvasWrapper.addEventListener('dragstart', (e) => e.preventDefault());
        if (pixelCanvas) pixelCanvas.addEventListener('dragstart', (e) => e.preventDefault());
        if (gridCanvas) gridCanvas.addEventListener('dragstart', (e) => e.preventDefault());

        targetElement.addEventListener('mousedown', (e) => {
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            if (isSpacePressed || e.button === 1) return;
            if (isPlaying) {
                showToast('⚠️ 动画播放中禁止编辑！');
                return;
            }
            if (isMouseDown) {
                handleStrokeEnd();
                isMouseDown = false;
                isRightClickStroke = false;
                // 🚨 解锁！并手动刷新一次面板，确保画完的笔画能在缩略图里显示
                isDrawingNow = false;
                renderAll();
            }

            e.preventDefault();
            isRightClickStroke = (e.button === 2);
            isMouseDown = true;
            isDrawingNow = true; // 🚨 一定要加上这句，告诉系统“我正在画画，别更新缩略图了”
            const coords = getPixelCoords(e);
            strokeStartX = coords.x;
            strokeStartY = coords.y;
            strokeCurrentX = coords.x;
            strokeCurrentY = coords.y;

            const strokeStarted = handleStrokeStart(coords.x, coords.y, isRightClickStroke, e);
            if (strokeStarted === false) isMouseDown = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (isPlaying) return;
            const coords = getPixelCoords(e);
            if (isMouseDown) {
                strokeCurrentX = coords.x;
                strokeCurrentY = coords.y;
            }
            if (coords.x !== currentHoverPixelX || coords.y !== currentHoverPixelY) {
                currentHoverPixelX = coords.x;
                currentHoverPixelY = coords.y;
            }
            if (activeTool === 'select') {
                updateSelectionCursor(e.clientX, e.clientY);
            }
            if (isMouseDown) {
                handleStrokeMove(coords.x, coords.y, e);
            } else {
                const now = Date.now();
                if (now - lastGridDraw > 30) {
                    drawGridOverlay();
                    lastGridDraw = now;
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDown) {
                handleStrokeEnd();
                isMouseDown = false;
                isRightClickStroke = false;
            }
        });

        // ==========================================
        // 🚨 移动端 Touch 优化：单指画画，双指缩放/平移
        // ==========================================
        let touchStartDist = 0;
        let touchStartZoomIndex = currentZoomIndex;
        let isTwoFingerMode = false;

        targetElement.addEventListener('touchstart', (e) => {
            if (isPlaying) return;

            if (e.touches.length === 2) {
                // 切换到双指模式，取消画画
                isTwoFingerMode = true;
                isMouseDown = false;

                const t1 = e.touches[0];
                const t2 = e.touches[1];
                touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                touchStartZoomIndex = currentZoomIndex;
                return;
            }

            if (e.touches.length === 1 && !isTwoFingerMode) {
                isMouseDown = true;
                isRightClickStroke = false;
                const coords = getPixelCoords(e);
                strokeStartX = coords.x;
                strokeStartY = coords.y;
                strokeCurrentX = coords.x;
                strokeCurrentY = coords.y;
                handleStrokeStart(coords.x, coords.y, false, e);
            }
            e.preventDefault();
        }, { passive: false });

        targetElement.addEventListener('touchmove', (e) => {
            // 🚨 核心：如果是双指，触发缩放，绝对不画画
            if (e.touches.length === 2) {
                isTwoFingerMode = true;
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

                // 计算缩放比例
                const ratio = currentDist / touchStartDist;

                // 算出要跨越几个缩放层级
                let targetZoom = Math.round(touchStartZoomIndex + Math.log2(ratio) * 2);

                // 限制边界并应用
                targetZoom = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, targetZoom));
                setZoomLevel(targetZoom);

                e.preventDefault();
                return;
            }

            if (isMouseDown && !isTwoFingerMode) {
                const coords = getPixelCoords(e);
                strokeCurrentX = coords.x;
                strokeCurrentY = coords.y;
                handleStrokeMove(coords.x, coords.y, e);
            }
            e.preventDefault();
        }, { passive: false });

        targetElement.addEventListener('touchend', (e) => {
            // 如果还有手指在屏幕上，不结束
            if (e.touches.length > 0) return;

            if (isMouseDown && !isTwoFingerMode) {
                handleStrokeEnd();
                isMouseDown = false;
                isRightClickStroke = false;
            }

            // 松开手指，解除双指模式
            isTwoFingerMode = false;
        });

        // Canvas Panning & Mouse Wheel Focal Zoom
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;

        // 画布滚轮缩放
        if (canvasContainerBox) {
            canvasContainerBox.addEventListener('wheel', (e) => {
                e.preventDefault(); // 阻止页面滚动
                e.stopPropagation();

                // 获取真实的鼠标视口坐标
                const focalPoint = { clientX: e.clientX, clientY: e.clientY };

                if (e.deltaY < 0) {
                    zoomIn(focalPoint); // 向上滚放大
                } else if (e.deltaY > 0) {
                    zoomOut(focalPoint); // 向下滚缩小
                }
            }, { passive: false });
        }

        canvasContainerBox.addEventListener('contextmenu', (e) => e.preventDefault());

        canvasContainerBox.addEventListener('mousedown', (e) => {
            const isMiddleClick = (e.button === 1);
            const isRightClick = (e.button === 2);
            const isClickInsideCanvas = (canvasWrapper && canvasWrapper.contains(e.target));
            const isClickOutsideCanvas = !isClickInsideCanvas;
            const isLeftClickWithSpace = (e.button === 0 && isSpacePressed);

            // Right-click inside canvas is a drawing action for: pencil (erase) and shading (darken)
            const isToolRightClickAction = (isRightClick && isClickInsideCanvas && (activeTool === 'pencil' || activeTool === 'shading'));

            // Pan viewport on: middle click, spacebar + left click, clicking outside canvas, or right-clicking when the tool has no right-click action
            const shouldPan = isMiddleClick || isLeftClickWithSpace || (isClickOutsideCanvas && (isRightClick || e.button === 0)) || (isRightClick && !isToolRightClickAction);

            if (shouldPan) {
                isPanning = true;
                panStartX = e.clientX - zoomTranslateX;
                panStartY = e.clientY - zoomTranslateY;
                canvasContainerBox.style.cursor = 'grabbing';
                e.preventDefault();
                e.stopPropagation();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isPanning) {
                zoomTranslateX = e.clientX - panStartX;
                zoomTranslateY = e.clientY - panStartY;
                applyCanvasTransform(false);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                if (canvasContainerBox) {
                    canvasContainerBox.style.cursor = (activeTool === 'move' || isSpacePressed) ? 'grab' : '';
                }
            }
        });

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            // 🚨 强化版拦截：不仅看标签名，还要看有没有获得焦点
            const targetTag = e.target.tagName.toUpperCase();
            const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target.isContentEditable;
            const isTextField = targetTag === 'INPUT' && ['text', 'password', 'number', 'search', 'email', 'url'].includes(e.target.type);

            // 如果用户在输入框里，直接放行，把控制权交还给浏览器（用户就能正常按 Ctrl+Z 撤销文字了）
            if (isInput || isTextField) {
                return;
            }

            const k = e.key ? e.key.toLowerCase() : '';
            const code = e.code || '';

            // ==========================================
            // 🚨 沉浸式画布：按 Tab 键隐藏/显示两侧面板
            // ==========================================
            if (k === 'tab') {
                e.preventDefault();

                // 防止键盘按住不放导致疯狂闪烁
                if (e.repeat) return;

                const leftSidebar = document.querySelector('.left-sidebar') || document.querySelector('.left-panel');
                const rightSidebar = document.querySelector('.right-sidebar') || document.querySelector('.right-panel');
                const topHeader = document.querySelector('header');
                const bottomTimeline = document.querySelector('.bottom-timeline') || document.querySelector('.timeline-panel');
                const canvasContainer = document.querySelector('.canvas-container-box');

                if (leftSidebar && rightSidebar && canvasContainer) {
                    const isHidden = leftSidebar.style.display === 'none';

                    if (isHidden) {
                        // ========== 退出沉浸模式（还原） ==========
                        leftSidebar.style.display = 'flex';
                        rightSidebar.style.display = 'flex';
                        if (topHeader) topHeader.style.display = 'flex';
                        if (bottomTimeline) bottomTimeline.style.display = 'flex';

                        // 撤销绝对定位，恢复原样
                        canvasContainer.style.position = '';
                        canvasContainer.style.top = '';
                        canvasContainer.style.left = '';
                        canvasContainer.style.width = '';
                        canvasContainer.style.height = '';
                        canvasContainer.style.zIndex = '';
                        canvasContainer.style.background = '';

                        if (typeof showToast === 'function') showToast('🔲 已退出沉浸模式');
                    } else {
                        // ========== 进入沉浸模式 ==========
                        leftSidebar.style.display = 'none';
                        rightSidebar.style.display = 'none';
                        if (topHeader) topHeader.style.display = 'none';
                        if (bottomTimeline) bottomTimeline.style.display = 'none';

                        // 🚨 核心魔法：把画布容器强行固定在屏幕正中央，脱离原本的 DOM 布局！
                        canvasContainer.style.position = 'fixed';
                        canvasContainer.style.top = '0';
                        canvasContainer.style.left = '0';
                        canvasContainer.style.width = '100vw';
                        canvasContainer.style.height = '100vh';
                        canvasContainer.style.zIndex = '9999';
                        canvasContainer.style.background = 'var(--bg-dark, #0b0f19)'; // 铺一层底色防止穿帮

                        if (typeof showToast === 'function') showToast('🖼️ 已进入沉浸模式 (按 Tab 退出)');
                    }

                    // 触发画布重绘，适应新尺寸
                    setTimeout(() => {
                        if (typeof applyCanvasTransform === 'function') applyCanvasTransform(false);
                        if (typeof drawGridOverlay === 'function') drawGridOverlay();
                    }, 100);
                }

                // 🎉 隐藏彩蛋：输入 "ilovepixel" 自动触发无限色彩派对
                let secretCode = '';
                window.addEventListener('keypress', (e) => {
                    secretCode += e.key.toLowerCase();
                    if (secretCode.length > 10) secretCode = secretCode.slice(-10);
                    if (secretCode === 'ilovepixel') {
                        document.body.style.animation = 'rainbowBg 2s infinite';
                        const style = document.createElement('style');
                        style.innerHTML = `@keyframes rainbowBg { 0% { background: #0b0d14; } 50% { background: #1a0b2e; } 100% { background: #0b1c29; } }`;
                        document.head.appendChild(style);
                        showToast("🎉 发现隐藏彩蛋！欢迎来到 Pixel 宇宙！");
                        secretCode = '';
                    }
                });
                return;
            }

            // ==========================================
            // 基础快捷键
            // ==========================================
            if (k === 'delete' || k === 'backspace') {
                if (selection) { deleteActiveSelection(); e.preventDefault(); }
            }
            if (k === 'enter') {
                if (selection) {
                    commitSelection();
                    showToast('✔️ 已确认固定选区');
                    e.preventDefault();
                    return;
                }
            }
            if (k === 'escape') {
                if (paletteSwapPending) {
                    paletteSwapPending = false;
                    showToast(t('swap_cancelled'));
                }
                if (selection) {
                    deselect();
                    e.preventDefault();
                    return;
                }
            }

            if ((e.ctrlKey || e.metaKey) && k === 'a') { selectAll(); e.preventDefault(); return; }
            if ((e.ctrlKey || e.metaKey) && k === 'd') { deselect(); e.preventDefault(); return; }
            if ((e.ctrlKey || e.metaKey) && k === 'x') { cutSelection(); e.preventDefault(); return; }

            if (selection) {
                if (!selection.isFloating) {
                    liftSelectionToFloating();
                }
                const step = e.shiftKey ? 5 : 1;
                if (code === 'ArrowLeft' || k === 'arrowleft') {
                    selection.offsetX -= step;
                    renderMainCanvas();
                    drawGridOverlay();
                    e.preventDefault();
                    return;
                } else if (code === 'ArrowRight' || k === 'arrowright') {
                    selection.offsetX += step;
                    renderMainCanvas();
                    drawGridOverlay();
                    e.preventDefault();
                    return;
                } else if (code === 'ArrowUp' || k === 'arrowup') {
                    selection.offsetY -= step;
                    renderMainCanvas();
                    drawGridOverlay();
                    e.preventDefault();
                    return;
                } else if (code === 'ArrowDown' || k === 'arrowdown') {
                    selection.offsetY += step;
                    renderMainCanvas();
                    drawGridOverlay();
                    e.preventDefault();
                    return;
                }
            }

            // ==========================================
            // 🚨 撤销/重做 (加上了终极拦截)
            // ==========================================
            if ((e.ctrlKey || e.metaKey) && k === 'z') {
                // 再次检查，防止意外的焦点丢失
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    return; // 如果焦点在输入框，放过它，不撤销画布
                }
                if (e.shiftKey) redo(); else undo();
                e.preventDefault();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && k === 'y') {
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
                redo(); e.preventDefault(); return;
            }
            if ((e.ctrlKey || e.metaKey) && k === 'c') { copySelection(); e.preventDefault(); return; }
            if ((e.ctrlKey || e.metaKey) && k === 'v') { pasteSelection(); e.preventDefault(); return; }

            // 数字快捷键
            if (k === '1') switchTool('pencil');
            else if (k === '2') switchTool('eraser');
            else if (k === '3') switchTool('picker');
            else if (k === '4') switchTool('bucket');
            else if (k === '5') switchTool('line');
            else if (k === '6') switchTool('rect');
            else if (k === '7') switchTool('circle');
            else if (k === '8') switchTool('select');
            else if (k === '9') switchTool('move');
            else if (k === '0') switchTool('crop');
        });

        // Spacebar Panning Hotkey
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space' || e.key === ' ') {
                if (!isSpacePressed) {
                    isSpacePressed = true;
                    if (canvasContainerBox) canvasContainerBox.style.cursor = 'grab';
                }
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                isSpacePressed = false;
                if (canvasContainerBox) canvasContainerBox.style.cursor = (activeTool === 'move') ? 'grab' : '';
            }
        });

        // Export Dropdown
        if (btnExportMain && exportMenu) {
            btnExportMain.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = exportMenu.style.display === 'flex';
                exportMenu.style.display = isOpen ? 'none' : 'flex';
                if (exportArrow) exportArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            });

            document.addEventListener('click', (e) => {
                if (exportMenu && !exportMenu.contains(e.target) && e.target !== btnExportMain) {
                    exportMenu.style.display = 'none';
                    if (exportArrow) exportArrow.style.transform = 'rotate(0deg)';
                }
            });
        }

        if (btnExportPng) btnExportPng.addEventListener('click', exportPng);
        if (btnExportGif) btnExportGif.addEventListener('click', exportGif);
        if (btnExportSheet) btnExportSheet.addEventListener('click', exportSpritesheet);
        if (btnExportJsonAtlas) btnExportJsonAtlas.addEventListener('click', exportJsonAtlas);
        if (btnExportSvg) btnExportSvg.addEventListener('click', exportSvg);

        // Project Save & Import
        if (btnSaveProject) btnSaveProject.addEventListener('click', saveProject);
        if (btnImportProject && fileImportInput) {
            btnImportProject.addEventListener('click', () => fileImportInput.click());
            fileImportInput.addEventListener('change', handleFileImport);
        }

        // ============================================================
        // 🚨 全屏 Loading 辅助函数
        // ============================================================
        const showLoader = () => {
            const loader = document.getElementById('global-loader');
            if (loader) loader.style.display = 'flex';
        };
        const hideLoader = () => {
            const loader = document.getElementById('global-loader');
            if (loader) loader.style.display = 'none';
        };

        // ☁️ 云端保存
        const btnCloudSave = document.getElementById('btn-cloud-save');
        if (btnCloudSave) {
            btnCloudSave.addEventListener('click', async () => {
                const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

                showLoader();
                btnCloudSave.disabled = true;
                await new Promise(resolve => setTimeout(resolve, 50));

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000);

                try {
                    commitSelection();

                    const projectData = {
                        resX: engine.resX || 32,
                        resY: engine.resY || 32,
                        fps: fps,
                        currentFrame: currentFrame,
                        frameBuffers: frameBuffers,
                        frameLayers: frameLayers
                    };

                    const userId = (window.userState && window.userState.email)
                        ? window.userState.email
                        : (localStorage.getItem('pixelsprite_anon_id') || (() => {
                            const id = 'anon_' + crypto.randomUUID();
                            localStorage.setItem('pixelsprite_anon_id', id);
                            return id;
                        })());

                    const projectName = prompt(dict.cloud_history_save_prompt || "请为这个云端工程起个名字：", `工程_${new Date().toLocaleDateString()}`) || 'Untitled';

                    const res = await fetch(`${API_BASE_URL}/api/cloud/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectData, userId, projectName }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }

                    const result = await res.json();
                    hideLoader();

                    if (result.success) {
                        // 多语言成功提示
                        const msg = dict.cloud_save_success_alert.replace('{code}', result.pinCode);
                        alert(msg);
                        if (typeof showToast === 'function') {
                            showToast(dict.cloud_save_success_toast.replace('{name}', projectName));
                        }
                    } else {
                        alert(dict.cloud_save_failed + '\n' + (result.error || ''));
                    }

                } catch (err) {
                    clearTimeout(timeoutId);
                    hideLoader();

                    console.error("保存捕获到的真实错误:", err);

                    // 终极智能判断
                    try {
                        const checkRes = await fetch(`${API_BASE_URL}/api/cloud/list/${encodeURIComponent(userId)}`);
                        const checkData = await checkRes.json();

                        const isSaved = checkData.projects && checkData.projects.some(p => p.name === projectName);

                        if (isSaved) {
                            if (typeof showToast === 'function') {
                                showToast(dict.cloud_save_success_toast.replace('{name}', projectName));
                            }
                            alert(dict.cloud_save_timeout_success); // 多语言“网络波动但已保存”
                        } else {
                            alert(dict.cloud_save_failed); // 确实没存进去
                        }
                    } catch (e) {
                        alert(dict.cloud_save_offline); // 彻底断网
                    }
                } finally {
                    hideLoader();
                    btnCloudSave.disabled = false;
                }
            });
        }

        // ☁️ 云端读取（终极完美版：多语言 + 容量显示 + 历史列表 + 删除功能）
        const btnCloudLoad = document.getElementById('btn-cloud-load');
        if (btnCloudLoad) {
            btnCloudLoad.onclick = async () => {
                const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

                // 1. 如果登录了，走历史档案库
                if (window.userState && window.userState.isLoggedIn && window.userState.email) {
                    const modal = document.getElementById('cloud-history-modal');
                    modal.style.display = 'flex';
                    cloudHistoryList.innerHTML = `<div style="color:#00f2fe; width:100%; text-align:center; padding: 20px;">${dict.cloud_history_loading || '⏳ 加载中...'}</div>`;
                    cloudHistoryEmpty.style.display = 'none';

                    // 多语言替换
                    document.querySelector('#cloud-history-modal h3').innerHTML = dict.cloud_history_title || '☁️ 我的云端工程库';
                    document.querySelector('#btn-close-history').innerText = dict.cloud_history_close || '关闭';
                    document.querySelector('#cloud-history-empty p').innerText = dict.cloud_history_empty || '您还没有保存过任何云端工程哦~';

                    try {
                        // 获取列表
                        const res = await fetch(`${API_BASE_URL}/api/cloud/list/${encodeURIComponent(window.userState.email)}`);
                        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                        const result = await res.json();

                        // 获取容量
                        let usedMB = 0, totalMB = 512;
                        try {
                            const usageRes = await fetch(`${API_BASE_URL}/api/cloud/usage/${encodeURIComponent(window.userState.email)}`);
                            if (usageRes.ok) {
                                const usageData = await usageRes.json();
                                if (usageData.success) {
                                    usedMB = usageData.usedMB || 0;
                                    totalMB = usageData.totalMB || 512;
                                }
                            }
                        } catch (e) { console.warn('获取容量失败', e); }

                        // 更新底部
                        const footerDiv = document.querySelector('#cloud-history-modal .modal-footer div');
                        if (footerDiv) {
                            footerDiv.innerHTML = `
                                <span style="color:#00f2fe; font-weight:bold; margin-right: 15px;">💾 ${dict.cloud_storage_used || '已用容量'}: ${usedMB.toFixed(1)} MB / ${totalMB} MB</span>
                                ${dict.cloud_history_old_pin || '还在用旧密码？'} 
                                <button id="btn-open-old-load" style="background: none; border: none; color: #00f2fe; cursor: pointer; text-decoration: underline;">
                                    ${dict.cloud_history_input_pin || '输入提取码读取'}
                                </button>
                            `;
                        }

                        cloudHistoryList.innerHTML = '';
                        if (result.success && result.projects && result.projects.length > 0) {
                            result.projects.forEach(proj => {
                                const card = document.createElement('div');
                                card.style.cssText = `position: relative; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; text-align: center;`;
                                card.onmouseover = () => { card.style.borderColor = '#00f2fe'; card.style.transform = 'translateY(-2px)'; };
                                card.onmouseout = () => { card.style.borderColor = 'rgba(255,255,255,0.1)'; card.style.transform = 'translateY(0)'; };

                                card.innerHTML = `
                                    <button class="delete-cloud-btn" title="删除此工程" style="position: absolute; top: 6px; right: 6px; background: rgba(255, 71, 87, 0.2); border: none; border-radius: 50%; width: 24px; height: 24px; color: #ff4757; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.2s; z-index: 10;">🗑️</button>
                                    <div style="font-size: 32px; margin-bottom: 8px;">🖼️</div>
                                    <div style="font-size: 13px; font-weight: bold; color: #fff; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${proj.name || dict.cloud_history_default_name || '未命名'}</div>
                                    <div style="font-size: 10px; color: #8a99ad;">${new Date(proj.timestamp).toLocaleString()}</div>
                                    <div style="font-size: 11px; color: #00f2fe; margin-top: 8px; font-weight: bold;">${dict.cloud_history_load || '点击载入'}</div>
                                `;

                                // 删除按钮
                                const deleteBtn = card.querySelector('.delete-cloud-btn');
                                deleteBtn.onclick = async (e) => {
                                    e.stopPropagation();
                                    if (!confirm(dict.confirm_delete_project || '确定要彻底删除这个云端工程吗？此操作不可恢复！')) return;
                                    try {
                                        deleteBtn.innerHTML = '⏳';
                                        const delRes = await fetch(`${API_BASE_URL}/api/cloud/delete/${proj.pinCode}`, {
                                            method: 'DELETE',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId: window.userState.email })
                                        });
                                        const delData = await delRes.json();
                                        if (delData.success) {
                                            card.style.transform = 'scale(0.8)';
                                            card.style.opacity = '0';
                                            setTimeout(() => {
                                                card.remove();
                                                if (cloudHistoryList.children.length === 0) {
                                                    cloudHistoryEmpty.style.display = 'block';
                                                }
                                            }, 200);
                                            showToast(dict.cloud_delete_success || '🗑️ 工程已删除');
                                        } else {
                                            alert('删除失败: ' + delData.error);
                                            deleteBtn.innerHTML = '🗑️';
                                        }
                                    } catch (err) {
                                        alert('网络错误');
                                        deleteBtn.innerHTML = '🗑️';
                                    }
                                };

                                // 点击卡片加载
                                card.addEventListener('click', async () => {
                                    card.innerHTML = `<div style="color:#00f2fe; padding: 20px 0;">⏳ ...</div>`;
                                    try {
                                        const loadRes = await fetch(`${API_BASE_URL}/api/cloud/load/${proj.pinCode}`);
                                        const loadData = await loadRes.json();
                                        if (loadData.success && loadData.data) {
                                            restoreProjectData(loadData.data);
                                            modal.style.display = 'none';
                                            showToast(dict.cloud_load_success || '✨ 云端画作恢复成功！');
                                        } else {
                                            alert('加载失败: ' + loadData.error);
                                        }
                                    } catch (e) {
                                        alert('网络错误');
                                    }
                                });

                                cloudHistoryList.appendChild(card);
                            });
                        } else {
                            cloudHistoryEmpty.style.display = 'block';
                        }
                    } catch (err) {
                        console.error(err);
                        cloudHistoryList.innerHTML = `<div style="color:#ff4757; width:100%; text-align:center; padding: 20px;">${dict.cloud_history_net_error || '网络请求失败'}</div>`;
                    }
                    return;
                }

                // 2. 如果没登录，弹提取码输入框
                const pinCode = prompt(dict.cloud_load_prompt || '请输入提取码：');
                if (!pinCode) return;
                try {
                    const res = await fetch(`${API_BASE_URL}/api/cloud/load/${pinCode.toUpperCase()}`);
                    const result = await res.json();
                    if (result.success && result.data) {
                        restoreProjectData(result.data);
                        showToast('✨ 云端画作恢复成功！');
                    } else {
                        alert(result.error || '加载失败');
                    }
                } catch (err) {
                    alert('网络错误');
                }
            };
        }

        // 绑定关闭档案库弹窗
        [cloudHistoryClose, btnCloseHistory].forEach(btn => {
            if (btn) btn.addEventListener('click', () => { document.getElementById('cloud-history-modal').style.display = 'none'; });
        });

        // 如果没有登录，但想用旧码，点击切换
        if (btnOpenOldLoad) {
            btnOpenOldLoad.addEventListener('click', () => {
                document.getElementById('cloud-history-modal').style.display = 'none';
                const pinCode = prompt(window.I18N_TRANSLATIONS[window.currentLang]?.cloud_load_prompt || '请输入提取码：');
                if (pinCode) {
                    fetch(`${API_BASE_URL}/api/cloud/load/${pinCode.toUpperCase()}`)
                        .then(res => res.json())
                        .then(result => {
                            if (result.success && result.data) {
                                restoreProjectData(result.data);
                                showToast('✨ 云端画作恢复成功！');
                            } else {
                                alert(result.error || '加载失败');
                            }
                        }).catch(() => alert('网络错误'));
                }
            });
        }

        // ============================================================
        // 🚨 PRO 功能统一拦截器（安全版）
        // ============================================================
        const bindProFeature = (btnId, action) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            // 🚨 温柔重写：直接覆盖 onclick，不克隆节点
            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (!window.userState || !window.userState.isLoggedIn) {
                    if (typeof showToast === 'function') showToast('👑 Please login with Google to unlock PRO');
                    return;
                }

                if (typeof checkIsProActive === 'function' && !checkIsProActive()) {
                    if (typeof showToast === 'function') showToast('👑 PRO exclusive feature, please unlock first!');
                    openProModal();
                    return;
                }

                if (typeof action === 'function') action();
            };
        };

        // 重新绑定所有 PRO 按钮
        bindProFeature('btn-open-slicer', openSpriteSheetSlicer);
        bindProFeature('btn-open-pixelate', openPixelateConverter);
        bindProFeature('btn-header-buy-pro', openProModal);
        bindProFeature('btn-open-advanced-palette', openAdvancedPaletteModal);

        // Tile 模式特殊处理
        bindProFeature('btn-toggle-tile-mode', () => {
            isTileMode = !isTileMode;
            const b = document.getElementById('btn-toggle-tile-mode');
            if (b) b.classList.toggle('active', isTileMode);
            showToast(isTileMode ? '🧱 已开启 Seamless Tile 无缝瓷砖平铺模式！' : '🧱 已关闭 Seamless Tile 模式');
        });
        // ============================================================

        // PRO Tool Buttons
        if (btnOpenSlicer) btnOpenSlicer.addEventListener('click', openSpriteSheetSlicer);
        if (btnToggleTileMode) {
            btnToggleTileMode.addEventListener('click', () => {
                if (!checkIsProActive()) { openProModal(); return; }
                isTileMode = !isTileMode;
                btnToggleTileMode.classList.toggle('active', isTileMode);
                showToast(isTileMode ? '🧱 已开启 Seamless Tile 无缝瓷砖平铺模式！' : '🧱 已关闭 Seamless Tile 模式');
            });
        }
        if (btnOpenPixelate) btnOpenPixelate.addEventListener('click', openPixelateConverter);
        if (selectDitherPattern) {
            selectDitherPattern.addEventListener('change', (e) => {
                if (!checkIsProActive()) { openProModal(); return; }
                ditherPattern = e.target.value;
                showToast(`░ 抖动网格: ${selectDitherPattern.options[selectDitherPattern.selectedIndex].text}`);
            });
        }
        if (btnShadingLighten) btnShadingLighten.addEventListener('click', () => applyShading('lighten'));
        if (btnShadingDarken) btnShadingDarken.addEventListener('click', () => applyShading('darken'));
        if (btnRotspriteRotate) btnRotspriteRotate.addEventListener('click', rotspriteRotate);
        if (btnOpenPaletteExtractor) btnOpenPaletteExtractor.addEventListener('click', extractPaletteFromImage);
        if (btnColorHarmony) btnColorHarmony.addEventListener('click', addColorHarmony);
        if (btnPaletteSwap) btnPaletteSwap.addEventListener('click', startPaletteSwap);

        // Advanced Palette Studio Modal Controls
        const btnOpenAdvPalette = document.getElementById('btn-open-advanced-palette');
        if (btnOpenAdvPalette) {
            btnOpenAdvPalette.addEventListener('click', () => {
                if (!checkIsProActive()) { openProModal(); return; }
                openAdvancedPaletteModal();
            });
        }
        const advPaletteModalClose = document.getElementById('adv-palette-modal-close');
        if (advPaletteModalClose) advPaletteModalClose.addEventListener('click', closeAdvancedPaletteModal);
        const advPaletteModalCloseBtn = document.getElementById('adv-palette-modal-close-btn');
        if (advPaletteModalCloseBtn) advPaletteModalCloseBtn.addEventListener('click', closeAdvancedPaletteModal);
        const btnModalExtract = document.getElementById('btn-modal-extract-palette');
        if (btnModalExtract) {
            btnModalExtract.addEventListener('click', () => {
                closeAdvancedPaletteModal();
                extractPaletteFromImage();
            });
        }
        const btnModalSwap = document.getElementById('btn-modal-palette-swap');
        if (btnModalSwap) {
            btnModalSwap.addEventListener('click', () => {
                closeAdvancedPaletteModal();
                startPaletteSwap();
            });
        }
        const btnAdvAddHarmony = document.getElementById('btn-adv-add-harmony');
        if (btnAdvAddHarmony) {
            btnAdvAddHarmony.addEventListener('click', () => {
                if (currentHarmoniesGenerated && currentHarmoniesGenerated.length > 0) {
                    const added = addColorsToPalette(currentHarmoniesGenerated);
                    showToast(`✨ 成功将 ${added} 个和谐配色加入调色板！`);
                }
            });
        }

        // Animation Controls (PRO)
        if (btnAnimPlay) {
            btnAnimPlay.addEventListener('click', () => {
                if (isPlaying) stopAnimation(); else startAnimation();
            });
        }
        if (btnAnimPrev) {
            btnAnimPrev.addEventListener('click', () => {
                stopAnimation();
                currentFrame = (currentFrame - 1 + frameBuffers.length) % frameBuffers.length;
                updateFrameUI();
                renderMainCanvas();
            });
        }
        if (btnAnimNext) {
            btnAnimNext.addEventListener('click', () => {
                stopAnimation();
                currentFrame = (currentFrame + 1) % frameBuffers.length;
                updateFrameUI();
                renderMainCanvas();
            });
        }
        if (selectLoopMode) selectLoopMode.addEventListener('change', (e) => { loopMode = e.target.value; });

        if (btnFrameAdd) {
            btnFrameAdd.addEventListener('click', () => {
                if (!checkIsProActive()) { openProModal(); return; }
                pushHistoryState();
                const resX = engine.resX || 32;
                const resY = engine.resY || 32;
                const buf = engine.createBuffer(resX, resY);
                frameBuffers.push(buf);
                frameLayers.push([{
                    id: `layer_0_${Date.now()}`,
                    name: 'Layer 1 (Background)',
                    visible: true,
                    opacity: 1.0,
                    buffer: cloneBuffer(buf)
                }]);
                currentFrame = frameBuffers.length - 1;
                renderAll();
            });
        }

        if (btnFrameDuplicate) {
            btnFrameDuplicate.addEventListener('click', () => {
                if (!checkIsProActive()) { openProModal(); return; }
                pushHistoryState();
                initFrameLayers(currentFrame);
                const curLayers = frameLayers[currentFrame] || [];
                const clonedLayers = curLayers.map(l => ({
                    id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    name: l.name,
                    visible: l.visible,
                    opacity: l.opacity,
                    buffer: cloneBuffer(l.buffer)
                }));
                frameBuffers.splice(currentFrame + 1, 0, getCompositedFrameBuffer(currentFrame));
                frameLayers.splice(currentFrame + 1, 0, clonedLayers);
                currentFrame++;
                renderAll();
            });
        }

        if (btnFrameDelete) {
            btnFrameDelete.addEventListener('click', () => {
                if (!checkIsProActive()) { openProModal(); return; }
                if (frameBuffers.length <= 1) { showToast('⚠️ 至少保留一帧！'); return; }
                pushHistoryState();
                frameBuffers.splice(currentFrame, 1);
                frameLayers.splice(currentFrame, 1);
                currentFrame = Math.min(currentFrame, frameBuffers.length - 1);
                renderAll();
            });
        }

        if (btnToggleOnion) {
            btnToggleOnion.addEventListener('click', () => {
                if (!checkIsProActive()) { openProModal(); return; }
                showOnionSkin = !showOnionSkin;
                btnToggleOnion.classList.toggle('active', showOnionSkin);
                renderMainCanvas();
            });
        }

        if (checkOnionTint) {
            checkOnionTint.addEventListener('change', (e) => {
                onionSkinTint = e.target.checked;
                renderMainCanvas();
            });
        }

        if (inputFps) {
            inputFps.addEventListener('input', (e) => {
                fps = parseInt(e.target.value);
                if (valFps) valFps.textContent = `${fps} FPS`;
                if (isPlaying) restartAnimationTimer();
            });
        }

        // Modals
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
        if (slicerModalClose) slicerModalClose.addEventListener('click', closeSpriteSheetSlicer);
        if (btnSlicerCancel) btnSlicerCancel.addEventListener('click', closeSpriteSheetSlicer);
        if (slicerFileInput) slicerFileInput.addEventListener('change', handleSlicerFile);
        if (btnConfirmSlice) btnConfirmSlice.addEventListener('click', confirmSliceSpriteSheet);

        if (pixelateModalClose) pixelateModalClose.addEventListener('click', closePixelateConverter);
        if (btnPixelateCancel) btnPixelateCancel.addEventListener('click', closePixelateConverter);
        if (pixelateFileInput) pixelateFileInput.addEventListener('change', handlePixelateFile);
        if (btnConfirmPixelate) btnConfirmPixelate.addEventListener('click', confirmPixelateImage);
        if (paramQuantizeColors) {
            paramQuantizeColors.addEventListener('input', (e) => {
                if (valQuantizeColors) valQuantizeColors.textContent = `${e.target.value} 色`;
            });
        }

        if (btnUnlockProTimeline) btnUnlockProTimeline.addEventListener('click', openProModal);

        // Language Switcher Controls
        const langToggleBtn = document.getElementById('lang-toggle-btn');
        const langMenu = document.getElementById('lang-menu');
        if (langToggleBtn && langMenu) {
            langToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = (langMenu.style.display === 'flex');
                langMenu.style.display = isOpen ? 'none' : 'flex';
                langToggleBtn.classList.toggle('open', !isOpen);
            });

            document.querySelectorAll('.lang-option-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const selectedLang = btn.getAttribute('data-lang');
                    if (selectedLang) {
                        window.changeAppLanguage(selectedLang);
                    }
                    langMenu.style.display = 'none';
                    if (langToggleBtn) langToggleBtn.classList.remove('open');
                });
            });

            window.addEventListener('click', (e) => {
                if (langMenu && !langMenu.contains(e.target) && e.target !== langToggleBtn && !langToggleBtn.contains(e.target)) {
                    langMenu.style.display = 'none';
                    if (langToggleBtn) langToggleBtn.classList.remove('open');
                }
            });
        }

        // 🚀 绑定左上角 Logo 点击弹出关于窗口
        const appLogoTrigger = document.getElementById('app-logo-trigger');
        const aboutModal = document.getElementById('about-app-modal');
        const aboutModalClose = document.getElementById('about-modal-close');

        if (appLogoTrigger && aboutModal && aboutModalClose) {
            appLogoTrigger.addEventListener('click', () => {
                aboutModal.style.display = 'flex';
            });
            aboutModalClose.addEventListener('click', () => {
                aboutModal.style.display = 'none';
            });
            // 点击遮罩层也能关闭
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    aboutModal.style.display = 'none';
                }
            });
        }

        // 🚨 唯一真理：全局统一的下拉菜单点击逻辑
        const pill = document.getElementById('user-profile-pill');
        const dropdown = document.getElementById('user-profile-dropdown');

        if (pill && dropdown) {
            // 绝对提权
            pill.style.position = 'relative';
            pill.style.zIndex = '2147483647';
            pill.style.pointerEvents = 'auto';

            // 原生点击切换
            pill.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.style.zIndex = '2147483647';
                dropdown.style.position = 'absolute';
                dropdown.style.right = '0';
                dropdown.style.top = '100%';
                dropdown.classList.toggle('show');
            };

            // 点击菜单内不关闭
            dropdown.onclick = function (e) {
                e.stopPropagation();
            };

            // 点击页面空白处关闭
            document.addEventListener('click', function () {
                dropdown.classList.remove('show');
            });
        }
    }

    function switchTool(toolName) {
        if (!toolName) return;
        if (activeTool === 'select' && toolName !== 'select') {
            if (selection && selection.isFloating) {
                commitSelection();
            }
            if (selection && (selection.w <= 1 && selection.h <= 1)) {
                selection = null;
                updateSelectionToolbarUI();
            }
        }
        activeTool = toolName;
        drawToolBtns.forEach(b => b.classList.toggle('active', b.dataset.tool === toolName));
        if (canvasContainerBox) canvasContainerBox.style.cursor = (activeTool === 'move') ? 'move' : '';
        if (pixelCanvas) pixelCanvas.style.cursor = (activeTool === 'move') ? 'move' : '';

        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
        if (toolName === 'shading') {
            showToast(dict.tool_shading_hint || '☀️ 阴影/高光笔刷：左键加亮高光 (Lighten)，右键加深阴影 (Darken)');
        } else if (toolName === 'select') {
            showToast(dict.tool_select_hint || '✂️ 选区工具：按住左键拖拽即可框选区域，内部拖拽移动，手柄缩放');
        } else {
            // 🚨 自动去字典里找工具的翻译名字（比如 tool_pencil, tool_eraser）
            const toolKey = `tool_${toolName}`;
            const translatedToolName = dict[toolKey] ? dict[toolKey].replace(/\s*\(\d+\)$/, '') : toolName.toUpperCase(); // 去掉后面的 (1)(2) 快捷键提示
            showToast((dict.tool_switched || '🛠️ 已切换工具: {tool}').replace('{tool}', translatedToolName));
        }
        drawGridOverlay();
    }

    function updateCanvasDOMDimensions(xVal, yVal) {
        const resX = Math.max(4, Math.min(512, parseInt(xVal) || 32));
        const resY = Math.max(4, Math.min(512, parseInt(yVal) || 32));

        // 💥 绝对锁死：哪怕 128x128，每个格子也是 8px！
        // 128 * 8 = 1024px。如果屏幕装不下，父容器必须出滚动条。
        const FIXED_CELL_SIZE = 8;

        const displayW = resX * FIXED_CELL_SIZE;
        const displayH = resY * FIXED_CELL_SIZE;

        if (pixelCanvas) {
            pixelCanvas.width = displayW;
            pixelCanvas.height = displayH;
        }
        if (gridCanvas) {
            gridCanvas.width = displayW;
            gridCanvas.height = displayH;
        }
        if (symmetryCanvas) {
            symmetryCanvas.width = displayW;
            symmetryCanvas.height = displayH;
        }
        if (canvasWrapper) {
            canvasWrapper.style.width = displayW + 'px';
            canvasWrapper.style.height = displayH + 'px';
        }

        const zoomValueSpan = document.getElementById('zoom-value');
        if (zoomValueSpan) zoomValueSpan.textContent = '1x (100%)';
    }

    function applyCanvasResolution(xVal, yVal) {
        pushHistoryState();
        xVal = Math.max(4, Math.min(512, parseInt(xVal) || 32));
        yVal = Math.max(4, Math.min(512, parseInt(yVal) || 32));

        if (resCustomX) resCustomX.value = xVal;
        if (resCustomY) resCustomY.value = yVal;
        if (resolutionSelect) {
            const presetOpts = Array.from(resolutionSelect.options).map(o => o.value);
            resolutionSelect.value = (xVal === yVal && presetOpts.includes(String(xVal))) ? String(xVal) : 'custom';
        }

        engine.resX = xVal;
        engine.resY = yVal;
        engine.resolution = Math.max(xVal, yVal);

        updateCanvasDOMDimensions(xVal, yVal);

        // Resize all existing layer buffers across all frames anchoring existing drawing to top-left (0, 0)
        for (let f = 0; f < frameBuffers.length; f++) {
            initFrameLayers(f);
            const layers = frameLayers[f];
            if (layers && Array.isArray(layers)) {
                layers.forEach(layer => {
                    const newBuf = engine.createBuffer(xVal, yVal);
                    if (layer.buffer) {
                        const minH = Math.min(layer.buffer.length, yVal);
                        const minW = Math.min(layer.buffer[0] ? layer.buffer[0].length : 0, xVal);
                        for (let y = 0; y < minH; y++) {
                            for (let x = 0; x < minW; x++) {
                                newBuf[y][x] = layer.buffer[y][x];
                            }
                        }
                    }
                    layer.buffer = newBuf;
                });
            }
            frameBuffers[f] = engine.createBuffer(xVal, yVal);
        }

        syncCurrentFrameBuffer();
        renderAll();
        showToast(`📐 已调整画布与图层尺寸: ${xVal} × ${yVal} 像素`);
    }

    // ============================================================
    // EXPORTERS & PROJECT SAVING
    // ============================================================

    function closeModal() { if (exportModal) exportModal.style.display = 'none'; }

    // ============================================================
    // #region [R8] 导入导出与工程保存 (Export / Import)
    // ============================================================
    function showExportModal(dataUrlOrBlob, filename, badgeText, titleText, descText) {
        if (exportFilenameInput) exportFilenameInput.value = filename;

        const dataUrlStr = (typeof dataUrlOrBlob === 'string') ? dataUrlOrBlob : '';
        if (modalPreviewImg) {
            if (dataUrlStr) modalPreviewImg.src = dataUrlStr;
            else if (dataUrlOrBlob instanceof Blob) modalPreviewImg.src = URL.createObjectURL(dataUrlOrBlob);
        }

        if (modalTitle) modalTitle.textContent = titleText || '✨ 资产导出成功';
        if (modalBadge) modalBadge.textContent = badgeText || 'PNG | 512x512';
        if (modalDesc) modalDesc.textContent = descText || '可随时点击“浏览保存路径”选择 Windows 本地保存目录！';

        if (modalDownloadLink) {
            if (dataUrlStr) modalDownloadLink.href = dataUrlStr;
            else if (dataUrlOrBlob instanceof Blob) modalDownloadLink.href = URL.createObjectURL(dataUrlOrBlob);
            modalDownloadLink.download = filename;
        }

        if (exportModal) exportModal.style.display = 'flex';
    }
    window.showExportModal = showExportModal;   // 👈 新增


    async function promptSaveFilePicker(contentData, defaultFilename, fileTypes) {
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: defaultFilename,
                    types: fileTypes || [{ description: 'Pixel Art Export', accept: { 'application/octet-stream': ['.png', '.gif', '.json', '.pixelsprite'] } }]
                });
                const writable = await handle.createWritable();

                if (contentData instanceof Blob) await writable.write(contentData);
                else if (typeof contentData === 'string' && contentData.startsWith('data:')) {
                    const res = await fetch(contentData);
                    const blob = await res.blob();
                    await writable.write(blob);
                } else if (typeof contentData === 'string') await writable.write(contentData);

                await writable.close();
                showToast(`✨ 已存至本地: ${handle.name}`);
                return 'success'; // 👈 成功保存返回 'success'
            } catch (err) {
                if (err.name === 'AbortError') {
                    // 🚨 用户按了取消，我们直接返回 'cancel'，并且什么都不做
                    return 'cancel';
                }
                console.error('保存失败:', err);
                return 'error';
            }
        }
        return 'fallback';
    }
    window.promptSaveFilePicker = promptSaveFilePicker;  // 👈 新增

    async function exportPng() {
        commitSelection();
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;

        // 🚨 内存防爆护盾：动态计算安全的导出倍数
        let exportScale = 16;
        const maxSafeSize = 4096; // 浏览器安全上限 (4096x4096)

        if (resX * exportScale > maxSafeSize || resY * exportScale > maxSafeSize) {
            exportScale = 8; // 退一步，用 8 倍
            if (typeof showToast === 'function') {
                showToast('⚠️ 画布较大，已自动降低至 8x 高清导出以防崩溃');
            }
        }
        if (resX * exportScale > maxSafeSize || resY * exportScale > maxSafeSize) {
            exportScale = 4; // 再退一步，用 4 倍
            if (typeof showToast === 'function') {
                showToast('⚠️ 画布超大，已自动降低至 4x 导出');
            }
        }

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = resX * exportScale;
        exportCanvas.height = resY * exportScale;

        const activeBuf = getCompositedFrameBuffer(currentFrame);
        engine.renderToCanvas(activeBuf, exportCanvas, true);

        const filename = `pixel_art_${resX}x${resY}.png`;
        const dataUrl = exportCanvas.toDataURL('image/png');

        const status = await promptSaveFilePicker(dataUrl, filename, [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]);
        if (status === 'cancel') return;
        showExportModal(dataUrl, filename, `PNG 单图 | ${exportCanvas.width}x${exportCanvas.height}px`, '✨ PNG 图片导出成功！');
    }

    async function exportGif() {
        if (!checkIsProActive()) { openProModal(); return; }
        commitSelection();
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;

        // 🚨 动态防爆护盾
        let exportScale = 8;
        const maxSafeSize = 4096;

        if (Math.max(resX, resY) * exportScale > maxSafeSize) {
            exportScale = 4;
            if (typeof showToast === 'function') showToast('⚠️ 画布较大，GIF 已自动降级至 4x 导出');
        }
        if (Math.max(resX, resY) * exportScale > maxSafeSize) {
            exportScale = 2;
            if (typeof showToast === 'function') showToast('⚠️ 画布超大，GIF 已自动降级至 2x 导出');
        }

        const size = Math.max(resX, resY) * exportScale;
        const framesCanvas = [];

        for (let f = 0; f < frameBuffers.length; f++) {
            const fc = document.createElement('canvas');
            fc.width = size;
            fc.height = size;
            const buf = frameBuffers[f] || engine.createBuffer(resX, resY);
            engine.renderToCanvas(buf, fc, true);
            framesCanvas.push(fc);
        }

        const delayMs = Math.round(1000 / fps);
        const gifBlob = encodeGIF(framesCanvas, delayMs);

        if (gifBlob) {
            const gifUrl = URL.createObjectURL(gifBlob);
            const filename = `animated_${fps}fps.gif`;
            const status = await promptSaveFilePicker(gifBlob, filename, [{ description: 'GIF Animated Image', accept: { 'image/gif': ['.gif'] } }]);
            if (status === 'cancel') return; // 👈 用户取消

            showExportModal(gifUrl, filename, `GIF 动态图 | ${fps} FPS`, '✨ GIF 动态动画导出成功！');
        }
    }

    async function exportSpritesheet() {
        if (!checkIsProActive()) { openProModal(); return; }
        commitSelection();
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        const exportCanvas = document.createElement('canvas');
        const totalFrames = frameBuffers.length;
        exportCanvas.width = resX * 8 * totalFrames;
        exportCanvas.height = resY * 8;

        const ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let f = 0; f < totalFrames; f++) {
            const fc = document.createElement('canvas');
            fc.width = resX * 8;
            fc.height = resY * 8;
            const buf = frameBuffers[f] || engine.createBuffer(resX, resY);
            engine.renderToCanvas(buf, fc, true);
            ctx.drawImage(fc, f * resX * 8, 0);
        }

        const filename = `spritesheet_${totalFrames}frames.png`;
        const dataUrl = exportCanvas.toDataURL('image/png');
        const status = await promptSaveFilePicker(dataUrl, filename, [{ description: 'PNG Spritesheet', accept: { 'image/png': ['.png'] } }]);
        if (status === 'cancel') return; // 👈 用户取消

        showExportModal(dataUrl, filename, `PNG Spritesheet | ${exportCanvas.width}x${exportCanvas.height}px`, '✨ Sprite Sheet 图集导出成功！');
    }

    async function exportJsonAtlas() {
        if (!checkIsProActive()) { openProModal(); return; }
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        const atlasData = {
            frames: frameBuffers.map((buf, idx) => ({
                filename: `frame_${idx + 1}.png`,
                frame: { x: idx * resX, y: 0, w: resX, h: resY },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: resX, h: resY },
                sourceSize: { w: resX, h: resY }
            })),
            meta: {
                app: "PixelSprite Pro",
                version: "2.0",
                image: "spritesheet.png",
                format: "RGBA8888",
                size: { w: resX * frameBuffers.length, h: resY },
                scale: "1"
            }
        };

        const jsonStr = JSON.stringify(atlasData, null, 2);
        const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
        const filename = 'sprite_atlas.json';
        const status = await promptSaveFilePicker(dataUrl, filename, [{ description: 'JSON Atlas', accept: { 'application/json': ['.json'] } }]);
        if (status === 'cancel') return; // 👈 用户取消

        showExportModal(dataUrl, filename, 'JSON Metadata Atlas', '✨ Cocos / Unity JSON Atlas 导出成功！');
    }

    async function exportSvg() {
        if (!checkIsProActive()) { openProModal(); return; }
        const resX = engine.resX || 32;
        const resY = engine.resY || 32;
        const buf = frameBuffers[currentFrame] || engine.createBuffer(resX, resY);
        const pixelScale = 16;
        const sizeW = resX * pixelScale;
        const sizeH = resY * pixelScale;

        let rectsSvg = '';
        for (let y = 0; y < resY; y++) {
            for (let x = 0; x < resX; x++) {
                const color = buf[y][x];
                if (color) {
                    rectsSvg += `  <rect x="${x * pixelScale}" y="${y * pixelScale}" width="${pixelScale}" height="${pixelScale}" fill="${color}" />\n`;
                }
            }
        }

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${sizeW}" height="${sizeH}" viewBox="0 0 ${sizeW} ${sizeH}">\n${rectsSvg}</svg>`;
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
        const filename = `pixel_vector_${resX}x${resY}.svg`;
        const status = await promptSaveFilePicker(dataUrl, filename, [{ description: 'SVG Vector', accept: { 'image/svg+xml': ['.svg'] } }]);
        if (status === 'cancel') return; // 👈 用户取消

        showExportModal(dataUrl, filename, `SVG 矢量图 | ${sizeW}x${sizeH}px`, '✨ 矢量 SVG 导出成功！');
    }

    async function saveProject() {
        commitSelection();
        const projectData = {
            version: '2.0',
            app: 'PixelSprite Pro',
            isProProject: checkIsProActive(),
            resX: engine.resX || 32,
            resY: engine.resY || 32,
            fps: fps,
            currentFrame: currentFrame,
            frameBuffers: frameBuffers,
            frameLayers: frameLayers
        };

        const jsonStr = JSON.stringify(projectData, null, 2);
        const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
        const filename = `project_${engine.resX || 32}x${engine.resY || 32}_${frameBuffers.length}frames.pixelsprite`;
        const status = await promptSaveFilePicker(dataUrl, filename, [{ description: 'PixelSprite Project', accept: { 'application/json': ['.pixelsprite', '.json'] } }]);
        if (status === 'cancel') return; // 👈 用户取消

        showExportModal(dataUrl, filename, 'JSON 工程文件', '💾 像素工程文件保存成功！');
    }

    function restoreProjectData(data) {
        // 🚨 核心修复：如果读出来的值是 undefined，就给个默认值，防止报错
        const resX = data.resX || 32;
        const resY = data.resY || 32;

        engine.resX = resX;
        engine.resY = resY;
        engine.resolution = Math.max(resX, resY);

        // 修改变量之前先判断 DOM 存不存在，并且用 resX 兜底
        const inputX = document.getElementById('res-custom-x');
        const inputY = document.getElementById('res-custom-y');
        if (inputX) inputX.value = resX;
        if (inputY) inputY.value = resY;

        // FPS 兜底
        fps = data.fps || 12;
        const fpsInput = document.getElementById('param-fps');
        const fpsVal = document.getElementById('val-fps');
        if (fpsInput) fpsInput.value = fps;
        if (fpsVal) fpsVal.textContent = `${fps} FPS`;

        currentFrame = data.currentFrame || 0;

        frameBuffers = data.frameBuffers.map(buf => cloneBuffer(buf));
        frameLayers = cloneLayersStack(data.frameLayers);

        initFrameLayers(currentFrame);
        updateCanvasDOMDimensions(resX, resY);
        syncCurrentFrameBuffer();
        renderAll();
    }

    function detectPixelArtNativeScale(imgData, w, h) {
        if (w <= 32 || h <= 32) return 1;
        const candidateScales = [16, 12, 10, 8, 6, 5, 4, 3, 2];

        for (const scale of candidateScales) {
            if (w % scale !== 0 || h % scale !== 0) continue;
            const targetW = w / scale;
            const targetH = h / scale;
            if (targetW < 4 || targetH < 4) continue;

            let isPerfectGrid = true;
            const stepY = Math.max(1, Math.floor(targetH / 16));
            const stepX = Math.max(1, Math.floor(targetW / 16));

            for (let py = 0; py < targetH && isPerfectGrid; py += stepY) {
                for (let px = 0; px < targetW; px += stepX) {
                    const startX = px * scale;
                    const startY = py * scale;
                    const baseIdx = (startY * w + startX) * 4;
                    const r0 = imgData[baseIdx];
                    const g0 = imgData[baseIdx + 1];
                    const b0 = imgData[baseIdx + 2];
                    const a0 = imgData[baseIdx + 3];

                    for (let sy = 0; sy < scale && isPerfectGrid; sy++) {
                        for (let sx = 0; sx < scale; sx++) {
                            const idx = ((startY + sy) * w + (startX + sx)) * 4;
                            if (Math.abs(imgData[idx] - r0) > 15 ||
                                Math.abs(imgData[idx + 1] - g0) > 15 ||
                                Math.abs(imgData[idx + 2] - b0) > 15 ||
                                Math.abs(imgData[idx + 3] - a0) > 15) {
                                isPerfectGrid = false;
                                break;
                            }
                        }
                    }
                }
            }

            if (isPerfectGrid) {
                return scale;
            }
        }
        return 1;
    }

    function handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        pushHistoryState();

        const fileNameLower = file.name.toLowerCase();

        if (fileNameLower.endsWith('.pixelsprite') || fileNameLower.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    let importedW = data.resX || data.width;
                    let importedH = data.resY || data.height;

                    if (!importedW || !importedH) {
                        if (data.frameBuffers && data.frameBuffers[0] && Array.isArray(data.frameBuffers[0])) {
                            importedH = data.frameBuffers[0].length;
                            importedW = data.frameBuffers[0][0] ? data.frameBuffers[0][0].length : importedH;
                        } else if (data.frameLayers && data.frameLayers[0] && data.frameLayers[0][0] && data.frameLayers[0][0].buffer) {
                            importedH = data.frameLayers[0][0].buffer.length;
                            importedW = data.frameLayers[0][0].buffer[0] ? data.frameLayers[0][0].buffer[0].length : importedH;
                        }
                    }

                    importedW = Math.max(4, Math.min(512, parseInt(importedW) || 32));
                    importedH = Math.max(4, Math.min(512, parseInt(importedH) || 32));

                    if (data.frameBuffers && Array.isArray(data.frameBuffers)) {
                        frameBuffers = data.frameBuffers.map(buf => cloneBuffer(buf));
                        if (data.frameLayers && Array.isArray(data.frameLayers)) {
                            frameLayers = cloneLayersStack(data.frameLayers);
                        } else {
                            frameLayers = frameBuffers.map((buf, f) => [{
                                id: `layer_0_${Date.now()}_${f}`,
                                name: 'Layer 1 (Background)',
                                visible: true,
                                opacity: 1.0,
                                buffer: cloneBuffer(buf)
                            }]);
                        }
                        currentFrame = Math.min(data.currentFrame || 0, frameBuffers.length - 1);
                    }

                    applyCanvasResolution(importedW, importedH);
                    showToast(`✨ 成功载入 ${importedW} × ${importedH} 工程文件 (${frameBuffers.length} 帧)`);
                } catch (err) { alert('⚠️ 无法解析工程文件'); }
            };
            reader.readAsText(file);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    let targetW = img.naturalWidth || img.width || 32;
                    let targetH = img.naturalHeight || img.height || 32;

                    targetW = Math.max(4, Math.min(512, targetW));
                    targetH = Math.max(4, Math.min(512, targetH));

                    applyCanvasResolution(targetW, targetH);

                    const rawCanvas = document.createElement('canvas');
                    rawCanvas.width = targetW;
                    rawCanvas.height = targetH;
                    const rawCtx = rawCanvas.getContext('2d');
                    rawCtx.imageSmoothingEnabled = false;
                    rawCtx.drawImage(img, 0, 0, targetW, targetH);
                    const rawImgData = rawCtx.getImageData(0, 0, targetW, targetH).data;

                    const activeBuf = getCurrentActiveBuffer();

                    for (let y = 0; y < targetH; y++) {
                        for (let x = 0; x < targetW; x++) {
                            const idx = (y * targetW + x) * 4;
                            const a = rawImgData[idx + 3];
                            if (a > 20) {
                                activeBuf[y][x] = engine.rgbToHex([rawImgData[idx], rawImgData[idx + 1], rawImgData[idx + 2]]);
                            } else {
                                activeBuf[y][x] = null;
                            }
                        }
                    }

                    syncCurrentFrameBuffer();
                    renderAll();
                    showToast(`✨ 已自动将画布与图层尺寸调整为 ${targetW} × ${targetH}，成功导入图片！`);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    }
    // #endregion [R8] 导入导出与工程保存 (Export / Import)

    // ============================================================
    // TOAST & PAYPAL SUBSCRIPTION ENGINE (PRESERVED)
    // ============================================================

    function showToast(message) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
    }

    const PRO_TRIAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    // ============================================================
    // #region [R9] PRO 高级特权与彩蛋 (PRO Tools & Walker)
    // ============================================================
    // 🚨 防伪签名函数：把时间混淆一下
    function encodeTime(time) {
        // 将时间转成字符串，加点盐，然后 Base64 编码
        const salt = "PixelSprite_PRO_2026_";
        return btoa(salt + time.toString());
    }

    function decodeTime(str) {
        try {
            const decoded = atob(str);
            const salt = "PixelSprite_PRO_2026_";
            if (!decoded.startsWith(salt)) return null; // 盐不对，说明被篡改了
            const timeStr = decoded.replace(salt, "");
            return parseInt(timeStr, 10);
        } catch (e) {
            return null;
        }
    }

    function loadProState() {
        try {
            const saved = localStorage.getItem('pixelsprite_pro_state_v3');
            const validLicense = localStorage.getItem('pixelsprite_license_key');

            // 校验买断激活码（和之前一样）
            const isValidKeyFormat = validLicense && /^PRO-[A-F0-9]{4}-[A-F0-9]{4}$/.test(validLicense);

            if (saved) {
                const parsed = JSON.parse(saved);

                if (parsed.isLifetimePro === true) {
                    if (!isValidKeyFormat) {
                        proState.isLifetimePro = false;
                        localStorage.removeItem('pixelsprite_pro_state_v3');
                        localStorage.removeItem('pixelsprite_license_key');
                    } else {
                        proState.isLifetimePro = true;
                    }
                } else {
                    proState.isLifetimePro = false;

                    // 🚨 核心防御：解析防伪时间
                    const decodedStartTime = decodeTime(parsed.trialStartTime);
                    if (decodedStartTime === null) {
                        // 解析失败，说明用户改写了时间！直接判定为试用过期！
                        console.warn('🚨 检测到伪造的试用时间，已强制判定为过期！');
                        proState.trialStartTime = 0; // 0 代表很久以前，直接过期
                    } else {
                        proState.trialStartTime = decodedStartTime;
                    }
                }
            } else {
                // 首次加载，给一个加密过的当前时间
                proState.isLifetimePro = false;
                proState.trialStartTime = Date.now();
                saveProState();
            }
        } catch (e) {
            proState.isLifetimePro = false;
            proState.trialStartTime = Date.now();
        }
    }

    function saveProState() {
        try {
            // 🚨 核心：保存时把时间加密
            const stateToSave = {
                isLifetimePro: proState.isLifetimePro,
                trialStartTime: encodeTime(proState.trialStartTime) // 加密！
            };
            localStorage.setItem('pixelsprite_pro_state_v3', JSON.stringify(stateToSave));
        } catch (e) { }
    }

    function checkIsProActive() {
        if (proState.isLifetimePro) return true;
        const elapsed = Date.now() - (proState.trialStartTime || 0);
        // 🚨 严格判断，过了一秒都不行
        return elapsed < PRO_TRIAL_DURATION_MS;
    }
    window.checkIsProActive = checkIsProActive;

    function getProTrialRemainingMs() {
        if (proState.isLifetimePro) return 0;
        const elapsed = Date.now() - (proState.trialStartTime || 0);
        const remaining = PRO_TRIAL_DURATION_MS - elapsed;
        // 🚨 绝不能返回负数，避免 UI 显示 `-23:59:59`
        return remaining > 0 ? remaining : 0;
    }

    function updateProStatusAndUI() {
        const isLifetime = !!(proState.isLifetimePro);
        const remainingMs = getProTrialRemainingMs();
        const isTrialActive = !isLifetime && remainingMs > 0;
        const isProActive = isLifetime || isTrialActive;

        // 1. 如果彻底没权限了，强制关掉所有 PRO 功能
        if (!isProActive) {
            if (isPlaying) stopAnimation();
            if (isTileMode) { isTileMode = false; }
            if (ditherPattern !== 'none') { ditherPattern = 'none'; }
            if (showOnionSkin) { showOnionSkin = false; }
            renderMainCanvas(); // 刷新画布，清掉洋葱皮残留
        }

        const proWidget = document.getElementById('pro-floating-widget');
        const dropdownProBadge = document.getElementById('dropdown-pro-badge');
        const btnHeaderBuyPro = document.getElementById('btn-header-buy-pro');
        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

        // 2. 时间轴锁定
        if (timelineControlsWrapper && timelineProLockedBanner) {
            if (isProActive) {
                timelineControlsWrapper.style.display = 'flex';
                timelineProLockedBanner.style.display = 'none';
            } else {
                timelineControlsWrapper.style.display = 'none';
                timelineProLockedBanner.style.display = 'flex';
            }
        }

        if (proWidget) proWidget.style.display = 'none';

        // 3. 顶部大按钮 (强制三选一，绝不错乱)
        if (btnHeaderBuyPro) {
            if (isLifetime) {
                btnHeaderBuyPro.innerHTML = `👑 <span data-i18n="pro_btn_lifetime">${dict.pro_btn_lifetime || 'PRO 终身尊享版'}</span>`;
                btnHeaderBuyPro.style.background = 'rgba(255, 196, 57, 0.18)';
                btnHeaderBuyPro.style.color = '#ffc439';
                btnHeaderBuyPro.style.border = '1px solid rgba(255, 196, 57, 0.4)';
                btnHeaderBuyPro.style.boxShadow = 'none';
                btnHeaderBuyPro.title = dict.pro_btn_lifetime_title || '您已成功解锁 PRO 终身尊享版！';
            } else if (isTrialActive) {
                btnHeaderBuyPro.innerHTML = `👑 <span data-i18n="pro_btn_buy">${dict.pro_btn_buy || 'PayPal 升级 PRO ($19.99)'}</span>`;
                btnHeaderBuyPro.style.background = 'linear-gradient(135deg, #ffc439 0%, #ff9800 100%)';
                btnHeaderBuyPro.style.color = '#003087';
                btnHeaderBuyPro.style.border = 'none';
                btnHeaderBuyPro.style.boxShadow = '0 4px 12px rgba(255, 196, 57, 0.4)';
            } else {
                btnHeaderBuyPro.innerHTML = `🔒 <span data-i18n="pro_btn_locked">${dict.pro_btn_locked || '解锁 PRO 终身版 ($19.99)'}</span>`;
                btnHeaderBuyPro.style.background = 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)';
                btnHeaderBuyPro.style.color = '#ffffff';
                btnHeaderBuyPro.style.border = 'none';
                btnHeaderBuyPro.style.boxShadow = '0 4px 12px rgba(255, 71, 87, 0.4)';
            }
        }

        // 4. 下拉菜单小标签 (强制同频)
        if (dropdownProBadge) {
            if (isLifetime) {
                dropdownProBadge.textContent = dict.pro_lifetime_badge || '👑 PRO 终身尊享版';
                dropdownProBadge.style.color = '#ffc439';
            } else if (isTrialActive) {
                dropdownProBadge.textContent = dict.pro_trial_badge || '🎁 PRO 1天免费试用中';
                dropdownProBadge.style.color = '#00f2fe';
            } else {
                dropdownProBadge.textContent = dict.pro_trial_expired_title || '🔒 PRO 试用已结束 ($19.99)';
                dropdownProBadge.style.color = '#ff4757';
            }
        }

        // 5. 强制右侧功能区标签恢复为 "PRO"
        document.querySelectorAll('.pro-tools-vertical-list .pro-tag-badge').forEach(badge => {
            if (isProActive) {
                badge.textContent = 'PRO';
                badge.style.background = '';
                badge.style.color = '';
                badge.style.border = '';
            }
        });
    }

    // 🚨 专门处理底部那段绿字/青字的动态切换
    function updateProBottomHint() {
        // ⚠️ 请把这里的 id 换成你 HTML 里“那行绿字”真实包裹的 ID
        // 如果你用的是 class，就把 getElementById 换成 querySelector('.你的class')
        const hintEl = document.getElementById('paypal-bottom-tip');

        if (!hintEl) return;

        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

        if (window.proState && window.proState.isLifetimePro) {
            // 已买断：显示绿色已激活提示
            hintEl.textContent = dict.pro_status_lifetime || '👑 PRO 终身尊享版已激活，感谢支持！';
            hintEl.style.color = '#4ADE80'; // 绿色
        } else {
            // 未买断：显示青色刷新提示
            hintEl.textContent = dict.pro_status_refresh_hint || '🔄 刷新面板即可开启 PRO 之旅！';
            hintEl.style.color = '#00f2fe'; // 青色
        }
    }

    // Monitor 24-hour trial expiration continuously
    let lastProActiveState = checkIsProActive();
    setInterval(() => {
        const currentlyActive = checkIsProActive();
        if (lastProActiveState && !currentlyActive) {
            lastProActiveState = false;
            updateProStatusAndUI();
            showToast('⏳ 您的 24 小时 PRO 免费试用已结束，PRO 高级功能已关闭。如需继续使用请升级终身版！');
        }
    }, 10000);

    // ============================================================
    // HOURLY PIXEL PRO MASCOT WALKER SYSTEM (每小时像素小人巡游互动)
    // ============================================================
    let isWalkerAnimating = false;

    function play8BitChime(type = 'greeting') {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            if (type === 'greeting') {
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.08);
                osc.frequency.setValueAtTime(783.99, now + 0.16);
                osc.frequency.setValueAtTime(1046.50, now + 0.24);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'click') {
                osc.frequency.setValueAtTime(783.99, now);
                osc.frequency.setValueAtTime(1174.66, now + 0.06);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            }
        } catch (e) { }
    }

    function initPixelProWalkerSystem() {
        const walker = document.getElementById('pixel-pro-walker');
        const bubble = document.getElementById('walker-speech-bubble');
        if (!walker) return;

        // Click on mascot or bubble opens PRO modal
        walker.addEventListener('click', (e) => {
            e.stopPropagation();
            play8BitChime('click');
            openProModal();
            showToast('🎉 像素小人向您推荐了 PixelSprite PRO 终身尊享版！');
        });

        // Click on header PRO logo to summon walker anytime!
        const logoProTag = document.getElementById('logo-pro-tag');
        if (logoProTag) {
            logoProTag.style.cursor = 'pointer';
            logoProTag.title = '点击召唤 PRO 像素小人！';
            logoProTag.addEventListener('click', () => {
                startPixelProWalkerAnimation(true);
            });
        }

        // 10-second recurring interval check (10秒一次小像素人巡游)
        const WALKER_INTERVAL_MS = 10 * 1000;

        // Start shortly after page load so user sees it right away (1.5s delay)
        setTimeout(() => {
            if (!isWalkerAnimating) {
                startPixelProWalkerAnimation();
            }
        }, 1500);

        // Recurring check: every 3s checks if 10s have elapsed since last animation
        setInterval(() => {
            const checkNow = Date.now();
            const lastTime = parseInt(localStorage.getItem('pixelsprite_pro_walker_last') || '0', 10);
            if (checkNow - lastTime >= WALKER_INTERVAL_MS && !isWalkerAnimating) {
                startPixelProWalkerAnimation();
            }
        }, 3000);

        // Expose global test triggers
        window.triggerPixelProWalker = () => {
            startPixelProWalkerAnimation(true);
        };
        window.testProExpiration = () => {
            proState.trialStartTime = Date.now() - PRO_TRIAL_DURATION_MS - 1000;
            saveProState();
            updateProStatusAndUI();
            showToast('🧪 已模拟 24 小时 PRO 试用到期！');
        };
        window.testProRestore = () => {
            proState.trialStartTime = Date.now();
            saveProState();
            updateProStatusAndUI();
            showToast('🧪 已重置恢复 24 小时 PRO 试用！');
        };
    }
    // #endregion [R9] PRO 高级特权与彩蛋 (PRO Tools & Walker)

    function startPixelProWalkerAnimation(forced = false) {
        if (isWalkerAnimating && !forced) return;
        const walker = document.getElementById('pixel-pro-walker');
        const bubble = document.getElementById('walker-speech-bubble');
        const timerHint = document.getElementById('walker-timer-hint');
        if (!walker) return;

        isWalkerAnimating = true;

        // Update timer hint inside speech bubble
        if (timerHint) {
            const isPro = checkIsProActive();
            const remainingMs = getProTrialRemainingMs();
            if (proState.isLifetimePro) {
                timerHint.textContent = '👑 终身尊享版已激活 · 感谢支持！';
            } else if (remainingMs > 0) {
                const totalSec = Math.floor(remainingMs / 1000);
                const h = Math.floor(totalSec / 3600);
                const m = Math.floor((totalSec % 3600) / 60);
                timerHint.textContent = `⏳ 免费试用剩余: ${h}小时${m}分`;
            } else {
                timerHint.textContent = '🔒 24小时试用已结束 · 点击解锁永久版';
            }
        }

        // Reset classes and position
        walker.classList.remove('is-walking', 'is-waving', 'is-running');
        if (bubble) bubble.classList.remove('visible');

        walker.style.display = 'block';
        walker.style.transition = 'none';
        walker.style.transform = 'translateX(-110px)';

        const screenWidth = window.innerWidth || 1200;
        const targetStopX = Math.round(Math.min(screenWidth * 0.42, 540));
        const finalExitX = screenWidth + 140;

        // Force browser layout reflow
        walker.offsetHeight;

        // ==========================================
        // STAGE 1: WALKING IN (从左向右有规律地走)
        // ==========================================
        walker.classList.add('is-walking');
        const walkDurationSec = 5.2;
        walker.style.transition = `transform ${walkDurationSec}s linear`;
        walker.style.transform = `translateX(${targetStopX}px)`;

        // ==========================================
        // STAGE 2: PAUSE & WAVE (停下来挥挥手)
        // ==========================================
        setTimeout(() => {
            if (!isWalkerAnimating) return;
            walker.classList.remove('is-walking');
            walker.classList.add('is-waving');
            walker.style.transition = 'none';
            walker.style.transform = `translateX(${targetStopX}px)`;

            // Pop up speech bubble
            if (bubble) bubble.classList.add('visible');
            play8BitChime('greeting');

            // Wave for 4 seconds
            setTimeout(() => {
                if (!isWalkerAnimating) return;

                // ==========================================
                // STAGE 3: RUNNING & DISAPPEARING (最后用跑并消失)
                // ==========================================
                if (bubble) bubble.classList.remove('visible');
                walker.classList.remove('is-waving');
                walker.classList.add('is-running');

                // Rapid sprint across the remaining screen
                const remainingDist = finalExitX - targetStopX;
                const runDurationSec = Math.max(2.4, (remainingDist / screenWidth) * 4.2);
                walker.style.transition = `transform ${runDurationSec}s cubic-bezier(0.25, 1, 0.5, 1)`;
                walker.style.transform = `translateX(${finalExitX}px)`;

                // ==========================================
                // STAGE 4: CLEANUP
                // ==========================================
                setTimeout(() => {
                    walker.classList.remove('is-running');
                    walker.style.display = 'none';
                    walker.style.transform = 'translateX(-110px)';
                    isWalkerAnimating = false;
                    localStorage.setItem('pixelsprite_pro_walker_last', Date.now().toString());

                    // Auto-schedule next walk in 10 seconds (10秒一次小像素人)
                    setTimeout(() => {
                        if (!isWalkerAnimating) {
                            startPixelProWalkerAnimation();
                        }
                    }, 10000);
                }, runDurationSec * 1000 + 100);

            }, 4000); // 4 seconds waving
        }, walkDurationSec * 1000);
    }

    let MERCHANT_PAYPAL_CLIENT_ID = 'sb';

    function openProModal() {
        const proModal = document.getElementById('pro-modal');
        if (!proModal) return;

        // 🚨 终极防御：直接去本地缓存里挖最真实的买断状态，绝不信任内存里的变量！
        let isLifetime = false;
        try {
            const savedState = localStorage.getItem('pixelsprite_pro_state_v3');
            if (savedState && JSON.parse(savedState).isLifetimePro) {
                isLifetime = true;
            }
        } catch (e) { }

        // 如果缓存没有，再用 window.proState 兜底
        if (!isLifetime && window.proState && window.proState.isLifetimePro) {
            isLifetime = true;
        }

        const remainingMs = typeof getProTrialRemainingMs === 'function' ? getProTrialRemainingMs() : 0;
        const isTrialActive = !isLifetime && remainingMs > 0;

        // 🚨 获取当前语言字典
        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

        // 🚨 获取当前的动态折扣价格
        const promo = typeof window.getDynamicPrice === 'function' ? window.getDynamicPrice() : { isPromo: false, finalPrice: 19.99, originalPrice: 19.99, discount: 10 };

        // 🚨 动态更新弹窗标题
        const modalTitle = proModal.querySelector('.modal-header h3');
        if (modalTitle) {
            let baseTitle = dict.pro_modal_title || '👑 PixelSprite PRO 终身尊享版解锁 ($19.99 USD)';
            if (promo.isPromo) {
                // 把原本的 $19.99 替换成 划线原价 + 打折红字
                baseTitle = baseTitle.replace('$19.99', `<span style="text-decoration: line-through; opacity: 0.5; font-size: 14px;">$${promo.originalPrice}</span> <span style="color: #ffc439; font-size: 22px;">$${promo.finalPrice}</span> <span style="color: #ff4757; font-size: 12px; border: 1px solid #ff4757; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">限时 ${promo.discount} 折</span>`);
            }
            modalTitle.innerHTML = baseTitle;
        }

        const featureTable = proModal.querySelector('.pro-feature-comparison');
        const proBanner = proModal.querySelector('.pro-banner');
        const paypalBox = proModal.querySelector('.paypal-checkout-box');

        if (isLifetime) {
            // ==========================================
            // 👑 状态 1：已买断（只要走到这里，绝对显示感谢）
            // ==========================================
            if (featureTable) featureTable.style.display = 'none';
            if (paypalBox) paypalBox.style.display = 'none';
            if (proBanner) {
                proBanner.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; text-align: center; padding: 20px 0;">
                    <div class="pro-crown" style="font-size: 48px; line-height: 1; margin-bottom: 10px; filter: drop-shadow(0 0 15px rgba(255, 196, 57, 0.6));">👑</div>
                    <h2 style="color: #ffc439; font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 1px; width: 100%;">
                        ${dict.pro_thanks_title || '感谢您购买 PixelSprite PRO！'}
                    </h2>
                    <p style="color: var(--text-main); font-size: 14px; margin: 0 0 16px 0; width: 100%; font-weight: 500;">
                        ${dict.pro_thanks_desc || '您已永久解锁所有高级游戏开发与动画功能。'}
                    </p>
                    <div style="color: #00f2fe; font-size: 12px; font-family: monospace; background: rgba(0, 242, 254, 0.1); padding: 8px 16px; border-radius: 4px; border: 1px dashed rgba(0, 242, 254, 0.4); display: inline-block; margin: 0 auto;">
                        ${dict.pro_status_lifetime || '👑 尊贵的 PRO 终身版用户，所有高级功能已为您开启。'}
                    </div>
                </div>
            `;
            }
        } else {
            // ==========================================
            // 🎁 状态 2：未买断
            // ==========================================
            if (featureTable) featureTable.style.display = '';
            if (paypalBox) paypalBox.style.display = 'flex';

            if (proBanner) {
                if (isTrialActive) {
                    // 试用中
                    const totalSec = Math.floor(remainingMs / 1000);
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

                    proBanner.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; text-align: center; padding: 10px 0;">
                        <div class="pro-crown" style="font-size: 48px; line-height: 1; margin-bottom: 10px; filter: drop-shadow(0 0 15px rgba(0, 242, 254, 0.6));">⏳</div>
                        <h2 style="color: #00f2fe; margin: 0 0 10px 0; font-size: 20px;">${dict.pro_trial_banner_title || '您的 24 小时 PRO 免费试用正在进行中！'}</h2>
                        <p style="color: var(--text-main); margin: 0 0 10px 0; font-size: 14px;">${dict.pro_trial_banner_desc || '体验结束倒计时：'} <strong id="pro-trial-countdown" style="color: #ff4757; font-size: 22px; font-family: monospace;">${timeStr}</strong></p>
                        <p style="color: var(--text-muted); font-size: 12px; margin: 0; line-height: 1.5;">
                            ${promo.isPromo ? `🔥 本月限时特惠！现在买断只需 <strong style="color: #ffc439;">$${promo.finalPrice}</strong> 美金！` : (dict.pro_trial_banner_hint || '试用期结束后将恢复标准版功能。现在买断只需 $19.99！')}
                        </p>
                    </div>
                `;
                } else {
                    // 试用已过期
                    proBanner.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; text-align: center; padding: 10px 0;">
                        <div class="pro-crown" style="font-size: 48px; line-height: 1; margin-bottom: 10px; filter: drop-shadow(0 0 15px rgba(255, 71, 87, 0.6));">🔒</div>
                        <h2 style="color: #ff4757; margin: 0 0 10px 0; font-size: 20px;">${dict.pro_expired_title || '您的 PRO 免费试用已结束'}</h2>
                        <p style="color: var(--text-main); margin: 0; font-size: 14px;">${dict.pro_expired_desc || '解锁 PRO 终身尊享版，继续享受高级功能。'}</p>
                    </div>
                `;
                }
            }
        }

        // 更新底部按钮文字（如果存在的话）
        const btnStartProTrial = document.getElementById('btn-start-pro-trial');
        if (btnStartProTrial) {
            btnStartProTrial.textContent = dict.btn_pro_trial || '🎁 24 小时 PRO 免费试用体验中';
        }

        proModal.style.display = 'flex';
        if (typeof window.renderPayPalButtons === 'function') window.renderPayPalButtons();
    }

    function closeProModal() {
        const proModal = document.getElementById('pro-modal');
        if (proModal) proModal.style.display = 'none';
    }

    function activateLifetimePro() {
        proState.isLifetimePro = true;
        saveProState();
        updateProStatusAndUI();
        closeProModal();

        // 🚨 核心：加上撒花特效和高级 Toast
        if (typeof window.fireConfetti === 'function') window.fireConfetti();

        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
        // 把原来的普通 Toast 换成类似弹窗的高级感提示（如果你有自定义弹窗的话）
        showToast('🎉 尊贵的 PRO 终身会员，欢迎加入！');
    }

    function initProVIPSystem() {
        loadProState();

        const proModalClose = document.getElementById('pro-modal-close');
        const btnProWidgetAction = document.getElementById('btn-pro-widget-action');
        const btnHeaderBuyPro = document.getElementById('btn-header-buy-pro');

        const btnStartProTrial = document.getElementById('btn-start-pro-trial');
        const btnDropdownProUpgrade = document.getElementById('btn-dropdown-pro-upgrade');

        if (proModalClose) proModalClose.addEventListener('click', closeProModal);
        if (btnProWidgetAction) btnProWidgetAction.addEventListener('click', openProModal);
        if (btnHeaderBuyPro) btnHeaderBuyPro.addEventListener('click', openProModal);
        if (btnDropdownProUpgrade) btnDropdownProUpgrade.addEventListener('click', openProModal);
        if (btnStartProTrial) {
            btnStartProTrial.addEventListener('click', () => {
                if (checkIsProActive()) {
                    showToast('🎁 您的 24 小时 PRO 免费试用正在进行中！');
                    closeProModal();
                } else {
                    showToast('⏳ 您的 24 小时免费试用已结束，请通过 PayPal 升级解锁！');
                }
            });
        }

        window.resetProTrial = function () {
            proState.isLifetimePro = false;
            proState.trialStartTime = Date.now();
            saveProState();
            updateProStatusAndUI();
            showToast('🔄 已重置 24 小时 PRO 免费试用倒计时！');
        };
        window.expireProTrial = function () {
            proState.isLifetimePro = false;
            proState.trialStartTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            saveProState();
            updateProStatusAndUI();
            showToast('🔒 模拟：24 小时试用已过期，PRO 功能已锁定！');
        };
        window.activateLifetimePro = activateLifetimePro;

        updateProStatusAndUI();
    }

    let GOOGLE_CLIENT_ID = '507575159415-m4q68pnv2dkmll4osu59patd7fpdkp56.apps.googleusercontent.com';

    function initAdminMerchantConsole() {
        const adminAuthModal = document.getElementById('admin-auth-modal');
        const adminAuthModalClose = document.getElementById('admin-auth-modal-close');
        const btnConfirmAdminAuth = document.getElementById('btn-confirm-admin-auth');
        const adminPasswordInput = document.getElementById('admin-password-input');

        const merchantModal = document.getElementById('merchant-modal');
        const merchantModalClose = document.getElementById('merchant-modal-close');
        const btnSaveMerchantSettings = document.getElementById('btn-save-merchant-settings');
        const settingPaypalClientId = document.getElementById('setting-paypal-client-id');
        const settingGoogleClientId = document.getElementById('setting-google-client-id');
        const btnOpenAdminConsole = document.getElementById('btn-open-admin-console');

        try {
            const savedPaypal = localStorage.getItem('pixelsprite_paypal_client_id');
            if (savedPaypal && settingPaypalClientId) settingPaypalClientId.value = savedPaypal;
            const savedGoogle = localStorage.getItem('pixelsprite_google_client_id');
            if (savedGoogle && settingGoogleClientId) settingGoogleClientId.value = savedGoogle;
        } catch (e) { }

        const openAdminAuth = () => {
            if (adminAuthModal) adminAuthModal.style.display = 'flex';
        };

        const verifyAdmin = () => {
            const pwd = adminPasswordInput ? adminPasswordInput.value.trim() : '';
            if (pwd === 'ADMIN2026' || pwd === 'admin') {
                if (adminAuthModal) adminAuthModal.style.display = 'none';
                if (merchantModal) merchantModal.style.display = 'flex';
                showToast('🔑 站长验证成功！已进入 API 控制台');
            } else {
                alert('密码错误！默认站长密码为: ADMIN2026');
            }
        };

        if (btnOpenAdminConsole) btnOpenAdminConsole.addEventListener('click', openAdminAuth);
        if (adminAuthModalClose) adminAuthModalClose.addEventListener('click', () => { if (adminAuthModal) adminAuthModal.style.display = 'none'; });
        if (btnConfirmAdminAuth) btnConfirmAdminAuth.addEventListener('click', verifyAdmin);
        if (merchantModalClose) merchantModalClose.addEventListener('click', () => { if (merchantModal) merchantModal.style.display = 'none'; });

        if (btnSaveMerchantSettings) {
            btnSaveMerchantSettings.addEventListener('click', () => {
                const paypalVal = settingPaypalClientId ? settingPaypalClientId.value.trim() : 'sb';
                const googleVal = settingGoogleClientId ? settingGoogleClientId.value.trim() : GOOGLE_CLIENT_ID;

                try {
                    localStorage.setItem('pixelsprite_paypal_client_id', paypalVal);
                    localStorage.setItem('pixelsprite_google_client_id', googleVal);
                } catch (e) { }

                GOOGLE_CLIENT_ID = googleVal;
                if (merchantModal) merchantModal.style.display = 'none';
                showToast('💾 站长收款号与 Client ID 配置已保存在本地！');
            });
        }
    }

    // Initialize App Core with Fail-Safe Try-Catch Wrappers
    function initApp() {
        try {
            if (!frameBuffers || frameBuffers.length === 0) {
                resetAllFrameBuffersToTemplate();
            }
        } catch (e) { console.error('frameBuffers init error:', e); }

        try { bindEvents(); } catch (e) { console.error('bindEvents error:', e); }

        // 先渲染调色板和最近颜色
        try {
            updateRecentColorsUI();
            updatePaletteSwatchesUI();
        } catch (e) { console.error('Palette Init error:', e); }

        try { initColorSpectrum(); } catch (e) { console.error('initColorSpectrum error:', e); }
        try { initProVIPSystem(); } catch (e) { console.error('initProVIPSystem error:', e); }
        // ==========================================
        // 🚨 日间/夜间主题切换引擎
        // ==========================================
        const btnThemeToggle = document.getElementById('btn-theme-toggle');
        if (btnThemeToggle) {
            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
            const savedTheme = localStorage.getItem('pixelsprite_theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
                btnThemeToggle.innerHTML = dict.theme_dark || '🌙 夜间模式';
            } else {
                btnThemeToggle.innerHTML = dict.theme_light || '☀️ 白天模式';
            }

            btnThemeToggle.addEventListener('click', () => {
                const isLight = document.body.classList.toggle('light-theme');
                const d = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

                if (isLight) {
                    btnThemeToggle.innerHTML = d.theme_dark || '🌙 夜间模式';
                    localStorage.setItem('pixelsprite_theme', 'light');
                    showToast(d.theme_to_light || '☀️ 已切换到白天模式');
                } else {
                    btnThemeToggle.innerHTML = d.theme_light || '☀️ 白天模式';
                    localStorage.setItem('pixelsprite_theme', 'dark');
                    showToast(d.theme_to_dark || '🌙 已切换到夜间模式');
                }
                // ... 重绘画布 ...

                // 切换主题后，必须重新渲染画布，否则棋盘格还是旧颜色
                if (typeof renderMainCanvas === 'function') renderMainCanvas();
                if (typeof drawGridOverlay === 'function') drawGridOverlay();
            });
        }
        try { initAdminMerchantConsole(); } catch (e) { console.error('initAdminMerchantConsole error:', e); }

        try { renderAll(); } catch (e) { console.error('renderAll error:', e); }

        // 当用户关闭网页时，最后抢救一次
        window.addEventListener('beforeunload', () => {
            saveDraftToDB();
        });

        // 🚨 状态全权交给 addon - login - system.js 接管
        if (window.updateUserAuthUI) {
            window.updateUserAuthUI();
        }

        // 🚨 初始化时强制刷新 PRO 视觉状态
        updateProStatusAndUI();
        if (typeof window.updateProBottomHint === 'function') {
            window.updateProBottomHint();
        }

        setTimeout(() => {
            // 只保留侧边栏的滚动控制，其他全交给 CSS 控制
            const sidebar = document.querySelector('.right-sidebar');
            if (sidebar) {
                sidebar.style.setProperty('height', 'calc(100vh - 130px)', 'important');
                sidebar.style.setProperty('overflow-y', 'auto', 'important');
            }
        }, 50);
    }

    // 🚨 拦截刷新/关闭网页
    window.addEventListener('beforeunload', (e) => {
        // 只有当前画布上有东西，才提示
        let hasDrawing = false;
        const activeBuf = getCurrentActiveBuffer();
        if (activeBuf) {
            for (let y = 0; y < activeBuf.length; y++) {
                if (activeBuf[y].some(pixel => pixel !== null)) {
                    hasDrawing = true;
                    break;
                }
            }
        }

        // 如果画布不是空的，或者你有未保存的更改，强行弹窗
        if (hasDrawing) {
            // 🚨 顺便抢救一下，自动存进 IndexedDB
            if (typeof saveDraftToDB === 'function') saveDraftToDB();

            // 兼容现代浏览器，弹出原生拦截提示
            e.preventDefault();
            e.returnValue = '⚠️ 您的画作还未保存！点击“留在此页”，可免费获得原图高清无水印导出！';
            return e.returnValue;
        }
    });

    // 🚨 只针对弹窗的倒计时刷新器
    setInterval(() => {
        const proModal = document.getElementById('pro-modal');
        if (proModal && proModal.style.display === 'flex') {
            const isLifetime = window.proState && window.proState.isLifetimePro;
            if (!isLifetime) {
                const remainingMs = typeof getProTrialRemainingMs === 'function' ? getProTrialRemainingMs() : 0;
                const timeEl = document.getElementById('pro-trial-countdown');

                if (timeEl && remainingMs > 0) {
                    const totalSec = Math.floor(remainingMs / 1000);
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    timeEl.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
            }
        }
    }, 1000);

    // 🚨 封装赛博朋克机器人互动新手教程
    // 🚨 封装赛博朋克机器人互动新手教程 (Pro Max 强化版)
    function startCyberTour(forceShow = false) {
        if (!forceShow && localStorage.getItem('pixelsprite_has_seen_guide')) return;
        if (document.getElementById('cyber-tour-overlay')) return;

        const d = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

        // 教程步骤文案
        const tourSteps = [
            { selector: '#pixel-canvas', title: d.tour_step_title_1, desc: d.tour_step_desc_1, position: 'bottom' },
            { selector: '.left-sidebar, .left-panel', title: d.tour_step_title_2, desc: d.tour_step_desc_2, position: 'right' },
            { selector: '.right-sidebar, .right-panel', title: d.tour_step_title_3, desc: d.tour_step_desc_3, position: 'left' },
            { selector: '#btn-export-main', title: d.tour_step_title_4, desc: d.tour_step_desc_4, position: 'bottom' }
        ];

        let currentStep = 0;
        let overlay, spotlight, bubble, laserLine;

        // 1. 动态创建 DOM
        function initTourDOM() {
            overlay = document.createElement('div');
            overlay.id = 'cyber-tour-overlay';
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            // 🚨 1. 全屏半透明黑底（去掉了 blur，画面绝对清晰）
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
            // 🚨 2. 为了让底层元素不被点击拦截，依然是 none，真正的拦截交给聚光灯
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '999998';

            // 激光引导线 (SVG)
            laserLine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            laserLine.style.position = 'absolute';
            laserLine.style.top = '0'; laserLine.style.left = '0';
            laserLine.style.width = '100vw'; laserLine.style.height = '100vh';
            laserLine.style.pointerEvents = 'none';
            laserLine.style.zIndex = '999998';
            laserLine.innerHTML = `<line x1="0" y1="0" x2="0" y2="0" stroke="#00f2fe" stroke-width="2.5" stroke-dasharray="8,6" style="filter: drop-shadow(0 0 5px #00f2fe);" />`;

            // 聚光灯
            spotlight = document.createElement('div');
            spotlight.className = 'cyber-spotlight';
            // 🚨 3. 核心魔法：利用 box-shadow 形成“挖空”效果
            // 我们用巨大的阴影把四周填满黑色，只有中间是透明的
            spotlight.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)'; // 🚨 同样改成 0.4
            // 配合半透明的发光线
            spotlight.style.border = '2px solid #00f2fe';
            // 拦截用户在聚光灯区域的点击（可选，防止乱点）
            spotlight.style.pointerEvents = 'auto';

            // 机器人对话框
            bubble = document.createElement('div');
            bubble.id = 'cyber-robot-bubble';
            bubble.innerHTML = `
                <button class="cyber-tour-skip" id="cyber-skip-btn" style="position:absolute; top:-12px; right:-12px; width:28px; height:28px; border-radius:50%; background:#ff4757; color:#fff; border:2px solid #fff; font-weight:bold; cursor:pointer;">×</button>
                <div class="robot-avatar" style="font-size: 36px; position: absolute; top: -32px; left: 10px; animation: float 2s infinite;">🤖</div>
                <h3 id="tour-title" style="color:#00f2fe; margin:0 0 8px 0; font-size:18px; text-shadow: 0 0 10px rgba(0,242,254,0.5);">标题</h3>
                <p id="tour-desc" class="typing-cursor" style="color:#e2e8f0; font-size:13px; line-height:1.6; margin:0; min-height: 40px;">描述</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                    <span style="font-size:11px; color:#64748b; font-weight: 800;" id="cyber-step-counter">1 / 4</span>
                    <button class="cyber-tour-btn" id="cyber-next-btn">下一步 ➡</button>
                </div>
            `;

            overlay.appendChild(laserLine);
            overlay.appendChild(spotlight);
            overlay.appendChild(bubble);
            document.body.appendChild(overlay);

            document.getElementById('cyber-skip-btn').onclick = endTour;
            document.getElementById('cyber-next-btn').onclick = nextStep;

            window.addEventListener('keydown', handleTourKeydown);
        }

        function handleTourKeydown(e) {
            if (!overlay) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextStep(); }
            else if (e.key === 'Escape') { endTour(); }
        }

        // 打字机特效
        function typeWriter(element, text, speed = 20) {
            element.innerHTML = '';
            let i = 0;
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            type();
        }

        function updateStep() {
            if (!overlay) return;
            const step = tourSteps[currentStep];
            const target = document.querySelector(step.selector);

            if (!target) {
                if (currentStep < tourSteps.length - 1) { currentStep++; updateStep(); }
                else { endTour(); }
                return;
            }

            // 平滑滚动到目标
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                const rect = target.getBoundingClientRect();
                const padding = 10;

                // 1. 聚光灯动画
                spotlight.style.top = `${rect.top - padding}px`;
                spotlight.style.left = `${rect.left - padding}px`;
                spotlight.style.width = `${rect.width + padding * 2}px`;
                spotlight.style.height = `${rect.height + padding * 2}px`;

                // 2. 文字打字机
                document.getElementById('tour-title').innerHTML = step.title;
                typeWriter(document.getElementById('tour-desc'), step.desc);
                document.getElementById('cyber-step-counter').innerText = `${currentStep + 1} / ${tourSteps.length}`;

                // 3. 气泡定位
                let bTop = rect.top, bLeft = rect.left;
                let lStartX = 0, lStartY = 0, lEndX = 0, lEndY = 0;

                if (step.position === 'right') {
                    bLeft = rect.right + 30; bTop = rect.top + rect.height / 2 - 80;
                    lStartX = bLeft; lStartY = bTop + 40; lEndX = rect.right + padding; lEndY = rect.top + rect.height / 2;
                } else if (step.position === 'left') {
                    bLeft = rect.left - 360; bTop = rect.top + rect.height / 2 - 80;
                    lStartX = bLeft + 340; lStartY = bTop + 40; lEndX = rect.left - padding; lEndY = rect.top + rect.height / 2;
                } else if (step.position === 'bottom') {
                    bTop = rect.bottom + 30; bLeft = rect.left + rect.width / 2 - 170;
                    lStartX = bLeft + 170; lStartY = bTop; lEndX = rect.left + rect.width / 2; lEndY = rect.bottom + padding;
                }

                // 边界防溢出
                if (bLeft < 20) bLeft = 20;
                if (bLeft + 340 > window.innerWidth) bLeft = window.innerWidth - 360;
                if (bTop < 20) bTop = 20;
                if (bTop + 200 > window.innerHeight) bTop = window.innerHeight - 220;

                bubble.style.top = `${bTop}px`;
                bubble.style.left = `${bLeft}px`;

                // 4. 更新激光线
                const line = laserLine.querySelector('line');
                line.setAttribute('x1', lStartX); line.setAttribute('y1', lStartY);
                line.setAttribute('x2', lEndX); line.setAttribute('y2', lEndY);

                // 5. 更新按钮
                const btn = document.getElementById('cyber-next-btn');
                btn.innerText = (currentStep === tourSteps.length - 1) ? (d.tour_finish || '开始创作 🚀') : (d.tour_next || '下一步 ➡');

                currentStep++;
            }, 400); // 等滚动完再算坐标
        }

        function nextStep() {
            if (currentStep >= tourSteps.length) { endTour(); }
            else { updateStep(); }
        }

        function endTour() {
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s';
                window.removeEventListener('keydown', handleTourKeydown);
                setTimeout(() => { overlay.remove(); }, 300);
            }
            localStorage.setItem('pixelsprite_has_seen_guide', 'true');
        }

        initTourDOM();
        setTimeout(() => updateStep(), 100);
    }
    window.startCyberTour = startCyberTour;

    // 🚨 绑定重播按钮
    setTimeout(() => {
        const btnReplay = document.getElementById('btn-replay-tour');
        if (btnReplay) {
            btnReplay.addEventListener('click', () => {
                startCyberTour(true);
            });
        }
    }, 500);

    // ============================================================
    // 🎯 全球统一月度动态促销 (每月前 10 天，5-9 折随机)
    // ============================================================
    window.getDynamicPrice = function () {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const originalPrice = 19.99;
        let finalPrice = originalPrice;
        let discount = 10;
        let isPromo = false;

        // 🚨 核心修改：设定首发特别促销期（例如 2026年10月24日 到 10月31日）
        // 把这里的年份和月份换成你明天发布的真实时间
        if (year === 2026 && month === 10 && day >= 24 && day <= 31) {
            isPromo = true;
            discount = 5; // 首发直接打 5 折
            finalPrice = 9.99;
        }
        // 原本的常规促销（每月 1-10 号）
        else if (day >= 1 && day <= 10) {
            isPromo = true;
            const seed = (year * month) % 5;
            discount = seed + 5;
            finalPrice = Number((originalPrice * (discount / 10)).toFixed(2));
        }

        return { isPromo, discount, finalPrice, originalPrice };
    };

    // ============================================================
    // 🎯 全球统一月度动态促销 (每月前 10 天，5-9 折随机) - Lemon Squeezy 版
    // ============================================================
    window.getDynamicPrice = function () {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const originalPrice = 19.99;
        let finalPrice = originalPrice;
        let discount = 10;
        let isPromo = false;

        // 首发特别促销期（按你实际情况改年份/月份/日期）
        if (year === 2026 && month === 10 && day >= 24 && day <= 31) {
            isPromo = true;
            discount = 5;
            finalPrice = 9.99;
        }
        // 常规促销：每月 1-10 号，5-9 折随机（按年月做种子，同一个月内所有人看到同一个折扣）
        else if (day >= 1 && day <= 10) {
            isPromo = true;
            const seed = (year * month) % 5;
            discount = seed + 5;
            finalPrice = Number((originalPrice * (discount / 10)).toFixed(2));
        }

        return { isPromo, discount, finalPrice, originalPrice };
    };

    // 🚨 折扣力度 → Lemon Squeezy 折扣码 的映射
    // 你需要在 LS 后台 Discounts 里预建这几个码，有效期覆盖整个促销期
    const LS_DISCOUNT_CODE_MAP = {
        5: 'PIXEL50',   // 5 折
        6: 'PIXEL40',   // 6 折
        7: 'PIXEL30',   // 7 折
        8: 'PIXEL20',   // 8 折
        9: 'PIXEL10'    // 9 折
    };

    // 🚨 你的 Lemon Squeezy 结账基础链接（不带 ?discount=）
    const LS_CHECKOUT_BASE_URL = 'https://pixelsprite-pro.lemonsqueezy.com/checkout/buy/5eb10f41-09fe-4be9-bbbf-01ce5b909f26?embed=1';

    // 扫描全页文本节点，把 $19.99 替换成折后价（防止 i18n 静态翻译里残留原价）
    function replacePriceInTextNodes(newPrice) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            // 跳过 script/style 里的文本
            if (node.parentNode && /^(SCRIPT|STYLE)$/.test(node.parentNode.tagName)) continue;
            if (node.nodeValue && node.nodeValue.includes('$19.99')) {
                node.nodeValue = node.nodeValue.replace(/\$19\.99/g, `$${newPrice}`);
            }
        }
    }

    function applyGlobalPromotion() {
        const promo = window.getDynamicPrice();
        const displayPrice = promo.finalPrice;

        // ---------- 1. 顶栏 PRO 按钮 ----------
        const btnHeaderBuyPro = document.getElementById('btn-header-buy-pro');
        if (btnHeaderBuyPro) {
            if (promo.isPromo) {
                btnHeaderBuyPro.innerHTML = `
                👑 <span style="text-decoration: line-through; opacity: 0.6; font-size: 11px; margin-right: 4px;">$${promo.originalPrice}</span>
                <span style="color: #ff4757; font-weight: 900;">升级 PRO ($${promo.finalPrice})</span>
                <span style="position: absolute; top: -8px; right: -8px; background: #ff4757; color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); animation: pulseDot 1s infinite alternate;">${promo.discount}折</span>
            `;
                btnHeaderBuyPro.style.overflow = 'visible';
                btnHeaderBuyPro.style.position = 'relative';
                btnHeaderBuyPro.title = `通过 Lemon Squeezy 购买解锁 PRO 终身尊享版 ($${promo.finalPrice} USD，限时 ${promo.discount} 折)`;
            } else {
                btnHeaderBuyPro.title = `通过 Lemon Squeezy 购买解锁 PRO 终身尊享版 ($19.99 USD)`;
            }
        }

        // ---------- 2. 下拉菜单里的 PRO 按钮 ----------
        const btnDropdownPro = document.getElementById('btn-dropdown-pro-upgrade');
        if (btnDropdownPro) {
            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
            const upgradeText = (dict.btn_dropdown_pro_upgrade || '👑 Unlock PRO Lifetime ($19.99)').replace('$19.99', '$' + displayPrice);
            btnDropdownPro.innerHTML = `<span>${upgradeText}</span><span class="btn-shine-sparkle">✨</span>`;
        }

        // ---------- 3. Lemon Squeezy 弹窗购买按钮 ----------
        const lsBuyBtn = document.getElementById('ls-buy-btn');
        if (lsBuyBtn) {
            const code = promo.isPromo ? (LS_DISCOUNT_CODE_MAP[promo.discount] || '') : '';
            lsBuyBtn.href = code ? `${LS_CHECKOUT_BASE_URL}?discount=${code}` : LS_CHECKOUT_BASE_URL;

            const btnText = document.getElementById('ls-buy-btn-text');
            if (btnText) {
                btnText.textContent = promo.isPromo
                    ? `Buy PRO on Lemon Squeezy ($${promo.finalPrice} · ${promo.discount}折)`
                    : `Buy PRO on Lemon Squeezy ($19.99)`;
            }
        }

        // ---------- 4. 扫全页文本节点，替换残留的 $19.99 ----------
        if (promo.isPromo) {
            replacePriceInTextNodes(promo.finalPrice);
        }

        // ---------- 5. 同步到全局，供其他地方读取 ----------
        window.currentCheckoutPrice = displayPrice.toString();
        window.currentPromo = promo;
    }

    // 页面加载后自动执行打折（保留你原来的 1 秒延迟）
    setTimeout(applyGlobalPromotion, 1000);

    // 🚨 语言切换后也重新跑一次，防止 i18n 把价格文字重置回 $19.99
    const _origChangeAppLanguage = window.changeAppLanguage;
    if (typeof _origChangeAppLanguage === 'function') {
        window.changeAppLanguage = function (lang) {
            _origChangeAppLanguage(lang);
            // 等 i18n 把 DOM 刷完再改价格
            setTimeout(applyGlobalPromotion, 50);
        };
    }

    // ============================================================
    // 🚀 社区与公告控制中心 (集成到 Logo)
    // ============================================================
    window.APP_CONFIG = {
        version: 'v2.9.0',
        itchUrl: 'https://kenmaster-q2x.itch.io',
        discordUrl: 'https://discord.gg/kj8dRJzPg',
        xUrl: 'https://x.com/KenLoo424416'
    };

    // #endregion [R10] 事件总线与初始化 (Event Bus & Init)

    initApp();
});

// 辅助函数：把 RGB 格式转成 HEX 格式
function rgbToHex(rgbStr) {
    if (!rgbStr) return '#000000';
    if (rgbStr.startsWith('#')) return rgbStr.toUpperCase();
    const match = rgbStr.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    const r = parseInt(match[0]).toString(16).padStart(2, '0');
    const g = parseInt(match[1]).toString(16).padStart(2, '0');
    const b = parseInt(match[2]).toString(16).padStart(2, '0');
    return ('#' + r + g + b).toUpperCase();
}

// 🎉 专属多巴胺撒花特效
window.fireConfetti = function () {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#00f2fe', '#ffc439', '#7f00ff', '#ff007f', '#ffffff'];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2, y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
            size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360, opacity: 1
        });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.vx *= 0.98; p.opacity -= 0.015; p.rotation += 10;
            if (p.opacity > 0) {
                active = true;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
            }
        });
        if (active) requestAnimationFrame(animate);
        else canvas.style.display = 'none';
    }
    animate();
};

// ============================================================
// 🚀 登录成功专属欢迎仪式 (Cyber Welcome Sequence)
// ============================================================
window.showLoginWelcome = function (userName) {
    // 🚨 修复：如果之前有残留，先删掉
    const oldOverlay = document.getElementById('cyber-welcome-overlay');
    if (oldOverlay) oldOverlay.remove();

    // 1. 创建全屏遮罩
    const overlay = document.createElement('div');
    overlay.id = 'cyber-welcome-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 10000000;
        background: rgba(5, 7, 12, 0.95); backdrop-filter: blur(25px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.6s ease;
        pointer-events: none; /* 🚨 核心：就算它还在屏幕上，鼠标点击也直接穿透它！ */
    `;

    // 2. 获取当前语言字典
    const d = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;
    // 如果没有专门的欢迎词，直接用中英结合兜底
    const welcomeTitle = d.welcome_title || '欢迎来到 PixelSprite Pro';
    const welcomeSubtitle = d.welcome_subtitle || `认证成功，${userName}。正在为您装载画布...`;

    // 3. 插入炫酷的赛博元素
    overlay.innerHTML = `
        <!-- 背景扫描线 -->
        <div style="position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,242,254,0.03) 3px, rgba(0,242,254,0.03) 4px); pointer-events: none;"></div>
        
        <!-- 全息 3D 魔方 -->
        <div class="logo-icon-wrapper" style="width: 120px; height: 120px; margin-bottom: 20px; animation: welcomeFloat 3s ease-in-out infinite;">
            <svg class="cyber-logo" viewBox="0 0 100 100" width="120" height="120">
                <defs>
                    <linearGradient id="wel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#00f2fe" />
                        <stop offset="100%" stop-color="#7f00ff" />
                    </linearGradient>
                    <filter id="wel-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0, 242, 254, 0.4)" stroke-width="1.5" stroke-dasharray="10 15" class="spin-ring" style="animation-duration: 8s;" />
                <g filter="url(#wel-glow)">
                    <path d="M 50 15 L 80 35 L 50 55 L 20 35 Z" fill="url(#wel-grad)" opacity="0.9" />
                    <path d="M 20 35 L 50 55 L 50 85 L 20 65 Z" fill="#7f00ff" opacity="0.6" />
                    <path d="M 80 35 L 50 55 L 50 85 L 80 65 Z" fill="#00f2fe" opacity="0.8" />
                    <path d="M 50 15 L 80 35 L 80 65 L 50 85 L 20 65 L 20 35 Z" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.6" />
                </g>
            </svg>
        </div>

        <!-- 主标题打字机 -->
        <h1 id="wel-title" style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 2px; color: #fff; text-shadow: 0 0 20px rgba(0,242,254,0.5); margin: 0 0 10px 0; min-height: 40px;"></h1>
        
        <!-- 副标题 -->
        <p id="wel-subtitle" style="font-size: 14px; color: var(--accent-cyan); font-family: monospace; opacity: 0; transition: opacity 0.5s; margin: 0;"></p>
        
        <!-- 底部进度条 -->
        <div style="width: 300px; height: 3px; background: rgba(255,255,255,0.1); margin-top: 40px; border-radius: 2px; overflow: hidden;">
            <div id="wel-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00f2fe, #7f00ff); box-shadow: 0 0 10px #00f2fe; transition: width 1.5s ease-in-out;"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 淡入遮罩
    setTimeout(() => overlay.style.opacity = '1', 50);

    // 打字机逻辑
    let i = 0;
    const titleEl = document.getElementById('wel-title');
    function typeWriter() {
        if (i < welcomeTitle.length) {
            titleEl.innerHTML += welcomeTitle.charAt(i);
            i++;
            setTimeout(typeWriter, 70);
        } else {
            // 打完字显示副标题
            const subEl = document.getElementById('wel-subtitle');
            subEl.innerHTML = welcomeSubtitle;
            subEl.style.opacity = '1';
            // 进度条拉满
            setTimeout(() => {
                document.getElementById('wel-progress').style.width = '100%';
            }, 100);
        }
    }
    // 稍微延迟一下开始打字
    setTimeout(typeWriter, 600);

    // 3. 自动淡出并清理
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
    }, 3500); // 整个动画持续 3.5 秒
};

// ============================================================
// 🔑 真正的 Itch.io 激活逻辑 (连接你的本地/云端后端)
// ============================================================
function initItchActivation() {
    const btnActivate = document.getElementById('btn-activate-itch');
    const inputCode = document.getElementById('itch-activation-input');
    if (!btnActivate || !inputCode) return;

    // 先把旧的事件监听全部清空，防止叠加
    btnActivate.onclick = null;

    btnActivate.onclick = async () => {
        const licenseKey = inputCode.value.trim();
        if (!licenseKey) {
            if (typeof showToast === 'function') showToast('⚠️ 请输入激活码或完整链接');
            return;
        }

        const originalText = btnActivate.innerHTML;
        btnActivate.innerHTML = '⏳ ...';
        btnActivate.disabled = true;

        try {
            // 🚨 确保这里是你部署的 Render 地址！
            const BACKEND_URL = 'https://pixelsprite-backend.onrender.com';

            const response = await fetch(`${BACKEND_URL}/api/verify-license`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ licenseKey })
            });

            const result = await response.json();

            if (result.success) {
                if (!window.proState) window.proState = {};
                window.proState.isLifetimePro = true;

                // 存储状态
                localStorage.setItem('pixelsprite_pro_state_v3', JSON.stringify(window.proState));

                if (typeof updateProStatusAndUI === 'function') updateProStatusAndUI();
                if (typeof window.fireConfetti === 'function') window.fireConfetti();
                if (typeof closeProModal === 'function') closeProModal();
                if (typeof showToast === 'function') showToast('🎉 恭喜！PRO 终身尊享版已激活！');
            } else {
                if (typeof showToast === 'function') showToast('❌ ' + (result.error || '激活码无效'));
                btnActivate.innerHTML = originalText;
                btnActivate.disabled = false;
            }
        } catch (err) {
            console.error('后端验证请求失败:', err);
            if (typeof showToast === 'function') showToast('⚠️ 网络连接失败，请稍后重试');
            btnActivate.innerHTML = originalText;
            btnActivate.disabled = false;
        }
    };
}

// 延迟一秒加载，确保 DOM 准备好了
setTimeout(initItchActivation, 1000);

// ============================================================
// 🎯 全球统一月度动态促销 (每月前 10 天，5-9 折随机)
// ============================================================
window.getDynamicPrice = function () {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const originalPrice = 19.99;
    let finalPrice = originalPrice;
    let discount = 10;
    let isPromo = false;

    // 首发特别促销期（按实际情况改日期）
    if (year === 2026 && month === 10 && day >= 24 && day <= 31) {
        isPromo = true;
        discount = 5;
        finalPrice = 9.99;
    }
    else if (day >= 1 && day <= 10) {
        isPromo = true;
        const seed = (year * month) % 5;
        discount = seed + 5;
        finalPrice = Number((originalPrice * (discount / 10)).toFixed(2));
    }

    return { isPromo, discount, finalPrice, originalPrice };
};

function applyGlobalPromotion() {
    const promo = window.getDynamicPrice();
    if (!promo.isPromo) return;

    const btnHeaderBuyPro = document.getElementById('btn-header-buy-pro');
    if (btnHeaderBuyPro) {
        btnHeaderBuyPro.innerHTML = `
            👑 <span style="text-decoration: line-through; opacity: 0.6; font-size: 11px; margin-right: 4px;">$${promo.originalPrice}</span> 
            <span style="color: #ff4757; font-weight: 900;">升级 PRO ($${promo.finalPrice})</span>
            <span style="position: absolute; top: -8px; right: -8px; background: #ff4757; color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 4px; border: 1px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); animation: pulseDot 1s infinite alternate;">${promo.discount}折</span>
        `;
        btnHeaderBuyPro.style.overflow = 'visible';
        btnHeaderBuyPro.style.position = 'relative';
    }

    window.currentCheckoutPrice = promo.finalPrice.toString();
}

// 页面加载后自动执行打折
setTimeout(applyGlobalPromotion, 1000);