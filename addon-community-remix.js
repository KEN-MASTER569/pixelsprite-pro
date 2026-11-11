/**
 * PixelSprite - 全球社区画廊与一键 Remix 二创互动系统 (Global Community & Social Hub)
 * 支持世界各地像素作品浏览、发布新作品、点赞、收藏、发表评论与一键 Remix 二创。
 */
(function () {
    'use strict';
    // i18n Translation Helper
    function tr(key, vars) {
        if (typeof window.t === 'function') {
            return window.t(key, vars);
        }
        const lang = window.currentLang || 'zh';
        const dict = (window.I18N_TRANSLATIONS && window.I18N_TRANSLATIONS[lang]) || (window.I18N_TRANSLATIONS && window.I18N_TRANSLATIONS.zh) || {};
        let s = dict[key] || key;
        if (vars) {
            Object.keys(vars).forEach(k => { s = s.split(`{${k}}`).join(vars[k]); });
        }
        return s;
    }


    // 本地持久化存储 Key
    const STORAGE_KEY_PUBLISHED = 'pixelsprite_global_published_works';
    const STORAGE_KEY_LIKES = 'pixelsprite_user_likes';
    const STORAGE_KEY_BOOKMARKS = 'pixelsprite_user_bookmarks';
    const STORAGE_KEY_COMMENTS = 'pixelsprite_user_comments';

    // 读取存储数据
    function getStoredJson(key, defaultVal = []) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function setStoredJson(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {
            console.error('setStoredJson error:', e);
        }
    }

    // ============================================================
    // 🎨 世界各地创作者精选作品库 (Global Showcase Works)
    // ============================================================
// Helper: 将 Palette 字典字符映射转换为 2D 颜色数组
    function parsePaletteArt(asciiRows, paletteMap, resX = 16, resY = 16) {
        const grid = [];
        for (let y = 0; y < resY; y++) {
            const row = [];
            const line = asciiRows[y] || '';
            for (let x = 0; x < resX; x++) {
                const ch = line[x] || '.';
                row.push(paletteMap[ch] || null);
            }
            grid.push(row);
        }
        return grid;
    }

    // ============================================================
    // 🎨 世界各地创作者精选作品库 (Global Showcase Works)
    // ============================================================
    const pSamurai = { '.': null, 'K': '#0a0c14', 'C': '#00f2fe', 'M': '#ff007f', 'W': '#ffffff', 'P': '#7f00ff', 'B': '#1a2035', 'G': '#2c3e50' };
    const samuraiFrames = [
        parsePaletteArt([
            "....MMMMMM......",
            "...MWWWWWWM.....",
            "..MCCCCCCWMK....",
            "..MCCWWCWMKK....",
            "...MPPPPMKK.....",
            "....PPKKK.......",
            "...CCCCCCM......",
            "..MCCCCCCWM.....",
            "..MCCBKKKK......",
            "...PBKKKK.......",
            "....BKBK........",
            "....GGGG........",
            "...MM..MM.......",
            "..CC....CC......",
            "................",
            "................"
        ], pSamurai)
    ];

    const pPaladin = { '.': null, 'K': '#050b14', 'W': '#ffffff', 'S': '#bdc3c7', 'G': '#7f8c8d', 'D': '#2c3e50', 'Y': '#f1c40f', 'O': '#e67e22', 'B': '#3498db' };
    const paladinFrames = [
        parsePaletteArt([
            ".....KKKKK......",
            "....KWWWWWK.....",
            "...KWWKKWWK.....",
            "...KWKBBKWK.....",
            "...KWWKKWWK.....",
            "....KSSSSK......",
            "...KGGYYGGK.....",
            "..KSDYYYYDSK....",
            "..KSBSSSSBSK....",
            "..KGGDDDDGGK....",
            "...KDDDDDK......",
            "...KDDDDDK......",
            "...KSS..SSK.....",
            "..KGG....GGK....",
            "..KK......KK....",
            "................"
        ], pPaladin),
        parsePaletteArt([
            ".....KKKKK......",
            "....KWWWWWK.....",
            "...KWWKKWWK.....",
            "...KWKBBKWK.....",
            "...KWWKKWWK.....",
            "....KSSSSK......",
            "...KGGYYGGK.....",
            "..KSDYYYYDSK....",
            "..KSBSSSSBSK....",
            "..KGGDDDDGGK....",
            "...KDDDDDK......",
            "...KDDDDDK......",
            "...KSS..SSK.....",
            "..KGG....GGK....",
            "................",
            "................"
        ], pPaladin)
    ];

    const pMeadow = { '.': null, 'G': '#27ae60', 'L': '#2ecc71', 'D': '#1e8449', 'F': '#145a32', 'Y': '#f1c40f', 'W': '#ffffff', 'R': '#e74c3c' };
    const meadowFrames = [
        parsePaletteArt([
            "GLGGDFLGLDGLGDFL",
            "LLGLFDLLGLFDFDLL",
            "GGDLLGDGGDLLGGDG",
            "GDLGLYWYDLLGLGDL",
            "DFLGGYWYGDFLGGDF",
            "GGLGGDFLGGLGGDFL",
            "LGDGLDFLGDGLDFLL",
            "GDLGLGDLGDLGLGDL",
            "GLDGGLLDGLDGGLLD",
            "DFLLRRFFDFLLRRFF",
            "FLLRWWLLFLLRWWLL",
            "GDLFRRFFGDLFRRFF",
            "GGDGLDFLGGDGLDFL",
            "DFLGLGDFDFLGLGDF",
            "FLLGLDFFFLLGLDFF",
            "GLGGDFLGLDGLGDFL"
        ], pMeadow)
    ];

    const pFighter = { '.': null, 'K': '#0a0c14', 'W': '#ffffff', 'C': '#3498db', 'R': '#e74c3c', 'D': '#c0392b', 'Y': '#f1c40f', 'O': '#e67e22', 'G': '#7f8c8d' };
    const fighterFrames = [
        parsePaletteArt([
            ".......WW.......",
            "......KCCK......",
            "......KCCK......",
            ".....KRCCRK.....",
            ".....KRCCRK.....",
            "....KRRCCRRK....",
            "...KRRWCCWRRK...",
            "..KRRCCDDCCRRK..",
            ".KRRCCDDDDCCRRK.",
            "KRRWWDDDDDDWWKKK",
            "KDDWWDDDDDDWWKKK",
            "KKKKGGKKKKGGKKKK",
            "....KYY..YYK....",
            "....KOO..OOK....",
            ".....KR..RK.....",
            "................"
        ], pFighter),
        parsePaletteArt([
            ".......WW.......",
            "......KCCK......",
            "......KCCK......",
            ".....KRCCRK.....",
            ".....KRCCRK.....",
            "....KRRCCRRK....",
            "...KRRWCCWRRK...",
            "..KRRCCDDCCRRK..",
            ".KRRCCDDDDCCRRK.",
            "KRRWWDDDDDDWWKKK",
            "KDDWWDDDDDDWWKKK",
            "KKKKGGKKKKGGKKKK",
            ".....KYYKYY.....",
            ".....KOOKOO.....",
            "......KRKKR.....",
            ".......KK......."
        ], pFighter)
    ];

    const pSlime = { '.': null, 'K': '#050b14', 'L': '#2ecc71', 'D': '#27ae60', 'H': '#a3e4d7', 'W': '#ffffff', 'F': '#145a32' };
    const slimeFrames = [
        parsePaletteArt([
            "................",
            "......KKKK......",
            "....KLLLLLLK....",
            "...KLLLLLLLLK...",
            "..KLLLLLLLLLLK..",
            "..KLLKWKLLKWKK..",
            ".KLLLKWKLLKWKKK.",
            ".KLLHLLLLLLLLLK.",
            ".KDLLLLLLLLLLDK.",
            ".KDDLLLLLLLLDDK.",
            "..KDDDDDDDDDDK..",
            "...KFFFFFFFFK...",
            "................",
            "................",
            "................",
            "................"
        ], pSlime),
        parsePaletteArt([
            "................",
            "................",
            "................",
            "................",
            "................",
            "....KKKKKKKK....",
            "...KLLLLLLLLK...",
            "..KLLKWKLLKWKK..",
            ".KLLLKWKLLKWKKK.",
            ".KLLHLLLLLLLLLK.",
            ".KDLLLLLLLLLLDK.",
            ".KDDDDDDDDDDDDK.",
            "..KFFFFFFFFFFK..",
            "...KKKKKKKKKK...",
            "................",
            "................"
        ], pSlime)
    ];

    const pSword = { '.': null, 'K': '#050b14', 'W': '#ffffff', 'S': '#bdc3c7', 'G': '#95a5a6', 'Y': '#f1c40f', 'O': '#f39c12', 'R': '#e74c3c', 'B': '#3498db' };
    const swordFrames = [
        parsePaletteArt([
            "..............WW",
            "............KWKW",
            "...........KWSK.",
            "..........KWSK..",
            ".........KWSK...",
            "........KWSK....",
            ".......KWSK.....",
            "......KWSK......",
            "....KYYWSK......",
            "..KYOBYYK.......",
            ".KYRRKYY........",
            "KYYKKYOBK.......",
            "KOBKKYY.........",
            ".KK.KOBK........",
            ".....KK.........",
            "................"
        ], pSword)
    ];

    const GLOBAL_PRESET_WORKS = [
        {
            id: 'work_samurai_tokyo',
            title: '秋叶原赛博武士 (Cyber Samurai)',
            author: 'Kenji_Pixel',
            country: '🇯🇵 日本',
            category: 'character',
            resX: 16,
            resY: 16,
            fps: 4,
            likes: 248,
            bookmarks: 86,
            tags: ['赛博朋克', '武士', '动作', '动画'],
            desc: '流浪于 2088 年新东京雨夜的仿生浪人，配有高频等离子双刃与流光面罩。',
            palette: ['#0a0c14', '#00f2fe', '#ff007f', '#ffffff', '#7f00ff', '#1a2035', '#2c3e50'],
            comments: [
                { author: 'Sakura_Dev', country: '🇯🇵', text: '色使いがとても素晴らしい！配色太惊艳了！', time: '10分钟前' },
                { author: 'NeonRider', country: '🇺🇸', text: 'Used this in my Godot cyber action demo, thanks!', time: '1小时前' },
                { author: '老六像素', country: '🇨🇳', text: '面罩的高光细节处理得特别棒，已一键 Remix 临摹！', time: '3小时前' }
            ],
            frames: samuraiFrames
        },
        {
            id: 'work_paladin_paris',
            title: '圣殿光明圣骑士 (Holy Paladin)',
            author: 'PixelKnight_FR',
            country: '🇫🇷 法国',
            category: 'character',
            resX: 16,
            resY: 16,
            fps: 3,
            likes: 312,
            bookmarks: 104,
            tags: ['RPG', '骑士', '动画', '角色'],
            desc: '经典法式复古奇幻圣骑士，附带呼吸与待机微动作，适合中世纪地牢冒险。',
            palette: ['#050b14', '#ffffff', '#2c3e50', '#7f8c8d', '#bdc3c7', '#f1c40f', '#e67e22', '#3498db'],
            comments: [
                { author: 'Artisan_Pixel', country: '🇫🇷', text: 'Magnifique animation subtile sur la respiration !', time: '2小时前' },
                { author: 'GameDev_Alex', country: '🇨🇦', text: 'Perfect idle frame for retro adventure platformers.', time: '5小时前' }
            ],
            frames: paladinFrames
        },
        {
            id: 'work_seamless_meadow',
            title: '3×3 无缝繁花草地 (Seamless Meadow)',
            author: 'TerraViva_Rio',
            country: '🇧🇷 巴西',
            category: 'tile',
            resX: 16,
            resY: 16,
            fps: 1,
            likes: 198,
            bookmarks: 92,
            tags: ['地块', '无缝平铺', '自然', '地图'],
            desc: '专为最新 3×3 无缝 Tile Mode 打造的草坪与野花瓦片，上下左右接缝 100% 严丝合缝。',
            palette: ['#27ae60', '#2ecc71', '#1e8449', '#145a32', '#f1c40f', '#ffffff', '#e74c3c'],
            comments: [
                { author: 'TileCrafter', country: '🇺🇸', text: 'The wrapping in Tile Mode looks seamless and smooth!', time: '40分钟前' },
                { author: '独立独立鸭', country: '🇨🇳', text: '配合新版 3x3 平铺预览简直绝配，省了好多拼接时间！', time: '2小时前' }
            ],
            frames: meadowFrames
        },
        {
            id: 'work_starfighter_austin',
            title: '复古雷电太空战机 (Arcade Starfighter)',
            author: 'RetroGamer_88',
            country: '🇺🇸 美国',
            category: 'arcade',
            resX: 16,
            resY: 16,
            fps: 5,
            likes: 275,
            bookmarks: 118,
            tags: ['街机', '战机', '飞行射击', '动画'],
            desc: '经典纵向街机飞行射击战机，机翼镀金防反光，尾喷推进器动态喷射火焰。',
            palette: ['#0a0c14', '#ffffff', '#e74c3c', '#c0392b', '#3498db', '#f1c40f', '#e67e22', '#7f8c8d'],
            comments: [
                { author: 'ShmupFan', country: '🇬🇧', text: 'Classic Raiden aesthetic, looks sweet!', time: '1小时前' }
            ],
            frames: fighterFrames
        },
        {
            id: 'work_slime_berlin',
            title: 'Q弹小史莱姆 (Bouncing Slime)',
            author: 'DungeonMaster_DE',
            country: '🇩🇪 德国',
            category: 'animated',
            resX: 16,
            resY: 16,
            fps: 4,
            likes: 410,
            bookmarks: 165,
            tags: ['怪物', '史莱姆', '动画', 'RPG'],
            desc: '挤压与拉伸的经典史莱姆蹦跳动画，手感极其 Q 弹。',
            palette: ['#050b14', '#2ecc71', '#27ae60', '#a3e4d7', '#ffffff', '#145a32'],
            comments: [
                { author: 'IndieGamer', country: '🇩🇪', text: 'Sehr süß! Die Animation ist sehr lebendig.', time: '15分钟前' },
                { author: 'PixelBoi', country: '🇨🇦', text: 'Remixed with purple shade, perfect toxic slime!', time: '1小时前' }
            ],
            frames: slimeFrames
        },
        {
            id: 'work_sword_london',
            title: '传奇王者圣剑 (Excalibur)',
            author: 'Arthurian_Pixel',
            country: '🇬🇧 英国',
            category: 'item',
            resX: 16,
            resY: 16,
            fps: 1,
            likes: 226,
            bookmarks: 88,
            tags: ['武器', '圣剑', '装备', '黄金'],
            desc: '对角线经典构图的传奇像素大剑，镀金剑柄与发光锋刃，可直接作为 RPG 顶级装备。',
            palette: ['#050b14', '#ffffff', '#bdc3c7', '#95a5a6', '#f1c40f', '#f39c12', '#e74c3c', '#3498db'],
            comments: [
                { author: 'Lancelot', country: '🇬🇧', text: 'The golden crossguard details are sharp!', time: '3小时前' }
            ],
            frames: swordFrames
        }
    ];


    // Helper: 将 ASCII / HEX 字符串帧转化为 2D 颜色数组
    function parseAsciiFrame(strArray, resX, resY) {
        const grid = [];
        for (let y = 0; y < resY; y++) {
            const row = [];
            const line = strArray[y] || '';
            if (line.includes(' ')) {
                const parts = line.trim().split(/\s+/);
                for (let x = 0; x < resX; x++) {
                    const p = parts[x];
                    if (!p || p === '.' || p === '0') row.push(null);
                    else row.push(p.startsWith('#') ? p : '#' + p);
                }
            } else {
                for (let x = 0; x < resX; x++) {
                    const ch = line[x] || '.';
                    if (ch === '.') row.push(null);
                    else if (ch === '#') row.push('#1a1c23');
                    else if (ch === 'f') row.push('#ffffff');
                    else row.push('#00f2fe');
                }
            }
            grid.push(row);
        }
        return grid;
    }

    // 将预置作品处理为完整缓冲数据
    function buildWorkBufferData(w) {
        const resX = w.resX || 16;
        const resY = w.resY || 16;
        let frames = [];

        if (Array.isArray(w.frames) && w.frames.length) {
            if (Array.isArray(w.frames[0]) && Array.isArray(w.frames[0][0])) {
                frames = w.frames;
            } else {
                w.frames.forEach((fStr) => {
                    frames.push(parseAsciiFrame(fStr, resX, resY));
                });
            }
        }

        return {
            id: w.id,
            title: w.title,
            author: w.author,
            country: w.country || '🌐 全球',
            category: w.category || 'other',
            resX,
            resY,
            fps: w.fps || 4,
            likes: w.likes || 0,
            bookmarks: w.bookmarks || 0,
            tags: w.tags || ['PixelArt'],
            desc: w.desc || '',
            palette: w.palette || [],
            comments: w.comments || [],
            frames: frames,
            createdAt: w.createdAt || '刚刚'
        };
    }

    // 获取合成后的全球作品列表（预置 + 用户发布）
    function getAllGlobalWorks() {
        const userPublished = getStoredJson(STORAGE_KEY_PUBLISHED, []);
        const presets = GLOBAL_PRESET_WORKS.map(w => buildWorkBufferData(w));
        return [...userPublished, ...presets];
    }

    // ============================================================
    // 🚀 一键 Remix 核心注入逻辑 (Inject into Studio Canvas)
    // ============================================================
    function remixIntoCanvas(workData) {
        if (!workData || !workData.frames || !workData.frames.length) return;

        const resX = workData.resX || 16;
        const resY = workData.resY || 16;

        if (typeof window.applyCanvasResolution === 'function') {
            window.applyCanvasResolution(resX, resY);
        } else {
            if (window.engine) {
                window.engine.resX = resX;
                window.engine.resY = resY;
                window.engine.resolution = resX;
            }
            if (typeof window.updateCanvasDOMDimensions === 'function') {
                window.updateCanvasDOMDimensions(resX, resY);
            }
        }

        const resSelect = document.getElementById('resolution-select');
        if (resSelect) {
            const matchOpt = Array.from(resSelect.options).find(o => o.value == resX);
            if (matchOpt && resX === resY) resSelect.value = resX;
            else resSelect.value = 'custom';
        }

        const rxInput = document.getElementById('res-custom-x');
        const ryInput = document.getElementById('res-custom-y');
        if (rxInput) rxInput.value = resX;
        if (ryInput) ryInput.value = resY;

        // 注入帧与图层
        const frames = workData.frames;
        window.frameBuffers = [];
        window.frameLayers = [];

        frames.forEach((fBuf, idx) => {
            const clonedBuf = JSON.parse(JSON.stringify(fBuf));
            window.frameBuffers.push(clonedBuf);
            window.frameLayers.push([
                {
                    id: 'layer_remix_' + Date.now() + '_' + idx,
                    name: 'Remix ' + (workData.title || 'Layer'),
                    visible: true,
                    opacity: 1.0,
                    buffer: JSON.parse(JSON.stringify(fBuf))
                }
            ]);
        });

        window.currentFrame = 0;
        window.activeLayerIndex = 0;

        // 注入调色板
        if (workData.palette && workData.palette.length && window.customPalette) {
            workData.palette.forEach(col => {
                const hex = col.startsWith('#') ? col : '#' + col;
                if (!window.customPalette.includes(hex)) {
                    window.customPalette.push(hex);
                }
            });
            if (typeof window.renderPaletteUI === 'function') window.renderPaletteUI();
        }

        // 刷新撤销栈与主界面
        if (typeof window.pushHistoryState === 'function') window.pushHistoryState();
        if (typeof window.renderAll === 'function') window.renderAll();
        if (typeof window.renderFilmstripThumbnails === 'function') window.renderFilmstripThumbnails();
        if (typeof window.renderLayersUI === 'function') window.renderLayersUI();

        // 提示反馈
        const msg = tr('remix_success', { title: workData.title });
        if (typeof window.showToast === 'function') window.showToast(msg);

        closeCommunityModal();
    }
    window.remixIntoCanvas = remixIntoCanvas;

    // ============================================================
    // ❤️ 点赞与 ⭐ 收藏交互系统
    // ============================================================
    function toggleLikeWork(workId) {
        const likedIds = getStoredJson(STORAGE_KEY_LIKES, []);
        const isLiked = likedIds.includes(workId);
        let newLikedIds;

        if (isLiked) {
            newLikedIds = likedIds.filter(id => id !== workId);
        } else {
            newLikedIds = [...likedIds, workId];
        }
        setStoredJson(STORAGE_KEY_LIKES, newLikedIds);

        // 更新用户发布的列表中点赞计数
        const userPublished = getStoredJson(STORAGE_KEY_PUBLISHED, []);
        const target = userPublished.find(w => w.id === workId);
        if (target) {
            target.likes = (target.likes || 0) + (isLiked ? -1 : 1);
            setStoredJson(STORAGE_KEY_PUBLISHED, userPublished);
        }

        renderCommunityCards(activeCategory);
        if (typeof window.showToast === 'function') {
            window.showToast(isLiked ? '💔 取消点赞' : '❤️ 点赞成功！感谢对创作者的支持！');
        }
    }

    function toggleBookmarkWork(workId) {
        const bookmarkedIds = getStoredJson(STORAGE_KEY_BOOKMARKS, []);
        const isBookmarked = bookmarkedIds.includes(workId);
        let newIds;

        if (isBookmarked) {
            newIds = bookmarkedIds.filter(id => id !== workId);
        } else {
            newIds = [...bookmarkedIds, workId];
        }
        setStoredJson(STORAGE_KEY_BOOKMARKS, newIds);

        renderCommunityCards(activeCategory);
        if (typeof window.showToast === 'function') {
            window.showToast(isBookmarked ? '⭐ 已移出收藏' : '⭐ 已收藏至「我的收藏」！');
        }
    }

    function addWorkComment(workId, commentText) {
        if (!commentText || !commentText.trim()) return;

        const currentAuthor = (window.userState && window.userState.user && window.userState.user.name) || 'PixelArtist';
        const newComment = {
            id: 'c_' + Date.now(),
            author: currentAuthor,
            country: '🌐',
            text: commentText.trim(),
            time: '刚刚'
        };

        const commentsMap = getStoredJson(STORAGE_KEY_COMMENTS, {});
        if (!commentsMap[workId]) commentsMap[workId] = [];
        commentsMap[workId].unshift(newComment);
        setStoredJson(STORAGE_KEY_COMMENTS, commentsMap);

        renderCommunityCards(activeCategory);
        if (typeof window.showToast === 'function') {
            window.showToast('💬 评论发表成功！');
        }
    }

    // ============================================================
    // ➕ 发布新作品弹窗系统 (Publish Artwork Modal)
    // ============================================================
    function openPublishModal() {
        let modal = document.getElementById('publish-artwork-modal');
        if (!modal) {
            modal = createPublishModalDOM();
        }

        // 截取当前画布作为预览图
        const previewCanvas = document.getElementById('publish-preview-canvas');
        const mainCanvas = document.getElementById('pixel-canvas');
        if (previewCanvas && mainCanvas) {
            const ctx = previewCanvas.getContext('2d');
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(mainCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
        }

        // 自动填入当前画板的分辨率
        const resX = (window.engine && window.engine.resX) || 32;
        const resY = (window.engine && window.engine.resY) || 32;
        const frameCount = (window.frameBuffers && window.frameBuffers.length) || 1;
        const infoBadge = document.getElementById('publish-spec-badge');
        if (infoBadge) infoBadge.textContent = `${resX}×${resY} 像素 • ${frameCount} 帧序列`;

        // 自动填入作者名
        const authorInput = document.getElementById('publish-input-author');
        if (authorInput && (!authorInput.value || authorInput.value === 'PixelArtist')) {
            const author = (window.userState && window.userState.user && window.userState.user.name) || 'PixelArtist';
            authorInput.value = author;
        }

        modal.style.display = 'flex';
    }
    window.openPublishModal = openPublishModal;

    function closePublishModal() {
        const modal = document.getElementById('publish-artwork-modal');
        if (modal) modal.style.display = 'none';
    }

    function createPublishModalDOM() {
        const modal = document.createElement('div');
        modal.id = 'publish-artwork-modal';
        modal.className = 'modal-backdrop';
        modal.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(4, 8, 16, 0.88); backdrop-filter: blur(16px);
            z-index: 100060; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;
        `;

        modal.innerHTML = `
            <div style="
                width: 520px; max-width: 95vw; background: #0c1220; border: 1px solid #00f2fe;
                border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.25);
                display: flex; flex-direction: column; overflow: hidden;
            ">
                <!-- 头部 Header -->
                <div style="padding: 18px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: space-between; background: rgba(0, 242, 254, 0.04);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 22px;">🚀</span>
                        <h3 id="publish-modal-title-text" style="margin: 0; font-size: 17px; font-weight: 800; color: #ffffff;">${tr('publish_modal_title')}</h3>
                    </div>
                    <button id="btn-close-publish-x" class="btn btn-secondary btn-xs" style="padding: 4px 8px; font-size: 14px;">✖</button>
                </div>

                <!-- 内容表单 Form -->
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <!-- 预览缩略图 -->
                    <div style="display: flex; gap: 16px; align-items: center; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                        <canvas id="publish-preview-canvas" width="128" height="128" style="
                            width: 80px; height: 80px; image-rendering: pixelated; background: #07090e;
                            border: 1px solid rgba(0, 242, 254, 0.4); border-radius: 6px; box-shadow: 0 0 15px rgba(0,242,254,0.2);
                        "></canvas>
                        <div style="flex: 1;">
                            <div style="font-size: 11px; color: #00f2fe; font-family: monospace; letter-spacing: 1px;">CANVAS SCREENSHOT</div>
                            <div id="publish-snapshot-label" style="font-size: 14px; font-weight: 800; color: #fff; margin-top: 2px;">${tr('publish_current_snapshot')}</div>
                            <div id="publish-spec-badge" style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">32×32 像素 • 1 帧</div>
                        </div>
                    </div>

                    <!-- 作品标题 -->
                    <div>
                        <label id="publish-title-label" style="font-size: 12px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px;">${tr('publish_label_title')}</label>
                        <input id="publish-input-title" type="text" placeholder="${tr('publish_title_placeholder')}" style="
                            width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
                            color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; outline: none;
                        ">
                    </div>

                    <!-- 作者昵称 -->
                    <div>
                        <label id="publish-author-label" style="font-size: 12px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px;">${tr('publish_label_author')}</label>
                        <input id="publish-input-author" type="text" value="PixelArtist" style="
                            width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
                            color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; outline: none;
                        ">
                    </div>

                    <!-- 分类标签 -->
                    <div>
                        <label id="publish-cat-label" style="font-size: 12px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px;">${tr('publish_label_cat')}</label>
                        <select id="publish-select-category" style="
                            width: 100%; box-sizing: border-box; background: #141a29; border: 1px solid var(--border-color);
                            color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; outline: none; cursor: pointer;
                        ">
                            <option value="character">${tr('publish_cat_character')}</option>
                            <option value="item">${tr('publish_cat_item')}</option>
                            <option value="tile">${tr('publish_cat_tile')}</option>
                            <option value="arcade">${tr('publish_cat_arcade')}</option>
                            <option value="animated">${tr('publish_cat_animated')}</option>
                            <option value="other">${tr('publish_cat_other')}</option>
                        </select>
                    </div>

                    <!-- 作品简介 -->
                    <div>
                        <label id="publish-desc-label" style="font-size: 12px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px;">${tr('publish_label_desc')}</label>
                        <textarea id="publish-input-desc" placeholder="${tr('publish_desc_placeholder')}" rows="3" style="
                            width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
                            color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; outline: none; resize: none;
                        "></textarea>
                    </div>

                    <!-- 确认发布按钮 -->
                    <button id="btn-submit-publish" class="btn btn-primary" style="
                        width: 100%; padding: 12px; font-size: 14px; font-weight: 800; margin-top: 6px;
                        background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #000;
                        box-shadow: 0 0 25px rgba(0, 242, 254, 0.4);
                    ">
                        ${tr('publish_btn_submit')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-publish-x').onclick = closePublishModal;

        document.getElementById('btn-submit-publish').onclick = () => {
            const titleInput = document.getElementById('publish-input-title');
            const authorInput = document.getElementById('publish-input-author');
            const catSelect = document.getElementById('publish-select-category');
            const descInput = document.getElementById('publish-input-desc');

            const title = (titleInput && titleInput.value.trim()) || 'Untitled Artwork';
            const author = (authorInput && authorInput.value.trim()) || 'PixelArtist';
            const category = (catSelect && catSelect.value) || 'character';
            const desc = (descInput && descInput.value.trim()) || '由创作者在 PixelSprite 制作并公开发布的像素作品。';

            const resX = (window.engine && window.engine.resX) || 32;
            const resY = (window.engine && window.engine.resY) || 32;
            const frames = JSON.parse(JSON.stringify(window.frameBuffers || []));

            const newWork = {
                id: 'work_user_' + Date.now(),
                title: title,
                author: author,
                country: '🌐 全球',
                category: category,
                resX: resX,
                resY: resY,
                fps: window.animFps || 4,
                likes: 1,
                bookmarks: 0,
                tags: [category, `${resX}x${resY}`, 'UserCreation'],
                desc: desc,
                palette: (window.customPalette || []).slice(0, 16),
                comments: [],
                frames: frames,
                createdAt: '刚刚'
            };

            const publishedList = getStoredJson(STORAGE_KEY_PUBLISHED, []);
            publishedList.unshift(newWork);
            setStoredJson(STORAGE_KEY_PUBLISHED, publishedList);

            closePublishModal();
            renderCommunityCards(activeCategory);

            if (typeof window.showToast === 'function') {
                window.showToast(`🎉 作品「${title}」已发布至全球社区画廊！大家都可以为你点赞和二创！`);
            }
        };

        return modal;
    }

    // ============================================================
    // 🌐 全球社区弹窗主 UI
    // ============================================================
    let activeCategory = 'all';

    function openCommunityModal() {
        let modal = document.getElementById('community-remix-modal');
        if (!modal) {
            modal = createCommunityModalDOM();
        }
        modal.style.display = 'flex';
        renderCommunityCards(activeCategory);
    }

    // 🌐 多语言热刷新支持 (Multi-language Hot Update)
    window.updateCommunityI18n = function () {
        const commModal = document.getElementById('community-remix-modal');
        if (commModal) {
            const titleEl = document.getElementById('comm-main-title');
            const subEl = document.getElementById('comm-main-subtitle');
            const badgeEl = document.getElementById('comm-badge-global');
            const btnCreate = document.getElementById('btn-community-create-new');
            const searchInput = document.getElementById('community-search-input');

            if (titleEl) titleEl.textContent = tr('comm_modal_title');
            if (subEl) subEl.textContent = tr('comm_modal_subtitle');
            if (badgeEl) badgeEl.textContent = tr('comm_global_feed');
            if (btnCreate) btnCreate.textContent = tr('comm_btn_publish');
            if (searchInput) searchInput.placeholder = tr('comm_search_placeholder');

            const pills = commModal.querySelectorAll('.cat-pill');
            pills.forEach(p => {
                const cat = p.dataset.cat;
                if (cat === 'all') p.textContent = tr('comm_tab_all');
                else if (cat === 'character') p.textContent = tr('comm_tab_character');
                else if (cat === 'item') p.textContent = tr('comm_tab_item');
                else if (cat === 'tile') p.textContent = tr('comm_tab_tile');
                else if (cat === 'arcade') p.textContent = tr('comm_tab_arcade');
                else if (cat === 'animated') p.textContent = tr('comm_tab_animated');
                else if (cat === 'my_bookmarks') p.textContent = tr('comm_tab_bookmarks');
                else if (cat === 'my_works') p.textContent = tr('comm_tab_my_works');
            });

            if (commModal.style.display !== 'none') {
                renderCommunityCards(activeCategory);
            }
        }

        const pubModal = document.getElementById('publish-artwork-modal');
        if (pubModal) {
            const pTitle = document.getElementById('publish-modal-title-text');
            const sLabel = document.getElementById('publish-snapshot-label');
            const tLabel = document.getElementById('publish-title-label');
            const tInput = document.getElementById('publish-input-title');
            const aLabel = document.getElementById('publish-author-label');
            const cLabel = document.getElementById('publish-cat-label');
            const dLabel = document.getElementById('publish-desc-label');
            const dInput = document.getElementById('publish-input-desc');
            const sBtn = document.getElementById('btn-submit-publish');

            if (pTitle) pTitle.textContent = tr('publish_modal_title');
            if (sLabel) sLabel.textContent = tr('publish_current_snapshot');
            if (tLabel) tLabel.textContent = tr('publish_label_title');
            if (tInput) tInput.placeholder = tr('publish_title_placeholder');
            if (aLabel) aLabel.textContent = tr('publish_label_author');
            if (cLabel) cLabel.textContent = tr('publish_label_cat');
            if (dLabel) dLabel.textContent = tr('publish_label_desc');
            if (dInput) dInput.placeholder = tr('publish_desc_placeholder');
            if (sBtn) sBtn.textContent = tr('publish_btn_submit');

            const cSelect = document.getElementById('publish-select-category');
            if (cSelect) {
                const optMap = {
                    character: tr('publish_cat_character'),
                    item: tr('publish_cat_item'),
                    tile: tr('publish_cat_tile'),
                    arcade: tr('publish_cat_arcade'),
                    animated: tr('publish_cat_animated'),
                    other: tr('publish_cat_other')
                };
                Array.from(cSelect.options).forEach(opt => {
                    if (optMap[opt.value]) opt.textContent = optMap[opt.value];
                });
            }
        }
    };

    window.openCommunityModal = openCommunityModal;

    function closeCommunityModal() {
        const modal = document.getElementById('community-remix-modal');
        if (modal) modal.style.display = 'none';
    }
    window.closeCommunityModal = closeCommunityModal;

    function createCommunityModalDOM() {
        const modal = document.createElement('div');
        modal.id = 'community-remix-modal';
        modal.className = 'modal-backdrop';
        modal.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(4, 8, 16, 0.88); backdrop-filter: blur(16px);
            z-index: 100050; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;
        `;

        modal.innerHTML = `
            <div class="community-modal-box" style="
                width: 1060px; max-width: 96vw; height: 88vh; max-height: 850px;
                background: #0b101c; border: 1px solid rgba(0, 242, 254, 0.4);
                border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 242, 254, 0.2);
                display: flex; flex-direction: column; overflow: hidden; position: relative;
            ">
                <!-- 头部 Header -->
                <div style="padding: 16px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; background: rgba(0, 242, 254, 0.03);">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="font-size: 28px; filter: drop-shadow(0 0 8px #ff007f);">🌐</span>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3 id="comm-main-title" style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                                    ${tr('comm_modal_title')}
                                </h3>
                                <span id="comm-badge-global" style="background: rgba(255, 0, 127, 0.2); color: #ff007f; border: 1px solid rgba(255, 0, 127, 0.4); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">${tr('comm_global_feed')}</span>
                            </div>
                            <p id="comm-main-subtitle" style="margin: 4px 0 0; font-size: 12px; color: var(--text-muted);">
                                ${tr('comm_modal_subtitle')}
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button id="btn-community-create-new" class="btn" style="
                            font-weight: 800; font-size: 13px; padding: 8px 16px; gap: 6px; border: none; border-radius: 8px;
                            background: linear-gradient(135deg, #ff007f 0%, #7f00ff 100%); color: #ffffff;
                            box-shadow: 0 0 20px rgba(255, 0, 127, 0.4); cursor: pointer; transition: all 0.2s;
                        " onmouseover="this.style.boxShadow='0 0 28px rgba(255, 0, 127, 0.6)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.boxShadow='0 0 20px rgba(255, 0, 127, 0.4)'; this.style.transform='';">
                            ${tr('comm_btn_publish')}
                        </button>
                        <button id="btn-close-community" class="btn btn-secondary btn-xs" style="padding: 6px 12px; font-size: 15px;">✖</button>
                    </div>
                </div>

                <!-- 分类筛选与搜索条 -->
                <div style="padding: 12px 24px; background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div id="community-cat-pills" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <button class="cat-pill active" data-cat="all">${tr('comm_tab_all')}</button>
                        <button class="cat-pill" data-cat="character">${tr('comm_tab_character')}</button>
                        <button class="cat-pill" data-cat="item">${tr('comm_tab_item')}</button>
                        <button class="cat-pill" data-cat="tile">${tr('comm_tab_tile')}</button>
                        <button class="cat-pill" data-cat="arcade">${tr('comm_tab_arcade')}</button>
                        <button class="cat-pill" data-cat="animated">${tr('comm_tab_animated')}</button>
                        <button class="cat-pill" data-cat="my_bookmarks">${tr('comm_tab_bookmarks')}</button>
                        <button class="cat-pill" data-cat="my_works">${tr('comm_tab_my_works')}</button>
                    </div>
                    <input type="text" id="community-search-input" placeholder="${tr('comm_search_placeholder')}" style="
                        background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); color: #fff;
                        padding: 6px 14px; border-radius: 20px; font-size: 12px; width: 200px; outline: none;
                    ">
                </div>

                <!-- 作品展示网格 (滚动区域) -->
                <div id="community-cards-grid" style="
                    flex: 1; overflow-y: auto; padding: 20px 24px;
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px;
                ">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-community').onclick = closeCommunityModal;
        document.getElementById('btn-community-create-new').onclick = openPublishModal;

        const pills = modal.querySelectorAll('.cat-pill');
        pills.forEach(p => {
            p.onclick = () => {
                pills.forEach(x => x.classList.remove('active'));
                p.classList.add('active');
                activeCategory = p.dataset.cat;
                renderCommunityCards(activeCategory);
            };
        });

        const searchInput = document.getElementById('community-search-input');
        searchInput.oninput = () => {
            renderCommunityCards(activeCategory, searchInput.value.trim().toLowerCase());
        };

        return modal;
    }

    // 渲染卡片网格
    function renderCommunityCards(cat = 'all', keyword = '') {
        const grid = document.getElementById('community-cards-grid');
        if (!grid) return;
        grid.innerHTML = '';

        let allWorks = getAllGlobalWorks();

        const likedIds = getStoredJson(STORAGE_KEY_LIKES, []);
        const bookmarkedIds = getStoredJson(STORAGE_KEY_BOOKMARKS, []);
        const commentsMap = getStoredJson(STORAGE_KEY_COMMENTS, {});

        if (cat === 'my_bookmarks') {
            allWorks = allWorks.filter(w => bookmarkedIds.includes(w.id));
        } else if (cat === 'my_works') {
            allWorks = allWorks.filter(w => w.id && w.id.startsWith('work_user_'));
        } else if (cat !== 'all') {
            allWorks = allWorks.filter(w => w.category === cat);
        }

        if (keyword) {
            allWorks = allWorks.filter(w => {
                return (w.title && w.title.toLowerCase().includes(keyword)) ||
                    (w.author && w.author.toLowerCase().includes(keyword)) ||
                    (w.desc && w.desc.toLowerCase().includes(keyword)) ||
                    (w.tags && w.tags.some(t => t.toLowerCase().includes(keyword)));
            });
        }

        if (allWorks.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: var(--text-muted);">
                    <div style="font-size: 48px; margin-bottom: 14px;">🎨</div>
                    <div style="font-size: 16px; color: #fff; font-weight: 800;">${tr('comm_empty_title')}</div>
                    <div style="font-size: 13px; margin-top: 6px;">${tr('comm_empty_desc')}</div>
                </div>
            `;
            return;
        }

        allWorks.forEach((item, index) => {
            const isLiked = likedIds.includes(item.id);
            const isBookmarked = bookmarkedIds.includes(item.id);
            const localComments = commentsMap[item.id] || [];
            const totalComments = [...localComments, ...(item.comments || [])];

            const totalLikes = (item.likes || 0) + (isLiked ? 1 : 0);
            const frameCount = (item.frames && item.frames.length) || 1;
            const canvasId = `comm_cvs_${item.id}_${index}`;
            const commentsContainerId = `comm_section_${item.id}_${index}`;

            const card = document.createElement('div');
            card.className = 'community-artwork-card';
            card.style.cssText = `
                background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px; padding: 14px; display: flex; flex-direction: column;
                gap: 12px; transition: all 0.25s ease; position: relative; overflow: hidden;
            `;

            card.innerHTML = `
                <!-- 像素画面展示区 -->
                <div style="
                    width: 100%; height: 160px; background: #07090e; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center; position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.05); overflow: hidden;
                ">
                    <canvas id="${canvasId}" width="128" height="128" style="
                        image-rendering: pixelated; width: 120px; height: 120px; max-width: 90%; max-height: 90%;
                    "></canvas>
                    <div style="
                        position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
                        color: #00f2fe; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
                        border: 1px solid rgba(0, 242, 254, 0.2);
                    ">
                        ${item.resX}×${item.resY} • ${frameCount} 帧
                    </div>
                    <div style="
                        position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.65);
                        color: #cbd5e1; font-size: 10px; padding: 2px 8px; border-radius: 4px;
                    ">
                        ${item.country || '🌐'}
                    </div>
                </div>

                <!-- 标题与作者信息 -->
                <div>
                    <div style="font-weight: 800; font-size: 15px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.title || 'Untitled'}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; justify-content: space-between;">
                        <span>👤 by <b>${item.author || 'Artist'}</b></span>
                        <span style="font-size: 11px; opacity: 0.8;">${item.createdAt || '刚刚'}</span>
                    </div>
                    <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin: 6px 0 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${item.desc || 'No description provided.'}
                    </p>
                </div>

                <!-- 互动数据栏：点赞 / 收藏 / 评论 -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                    <!-- 点赞按钮 -->
                    <button class="btn-interact btn-like ${isLiked ? 'active' : ''}" style="
                        background: ${isLiked ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255,255,255,0.04)'};
                        border: 1px solid ${isLiked ? '#ff4757' : 'rgba(255,255,255,0.1)'};
                        color: ${isLiked ? '#ff4757' : '#cbd5e1'}; font-size: 11px; font-weight: 700;
                        padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;
                    ">
                        <span>${isLiked ? '❤️' : '🤍'}</span> <span>${totalLikes}</span>
                    </button>

                    <!-- 收藏按钮 -->
                    <button class="btn-interact btn-bookmark ${isBookmarked ? 'active' : ''}" style="
                        background: ${isBookmarked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.04)'};
                        border: 1px solid ${isBookmarked ? '#fbbf24' : 'rgba(255,255,255,0.1)'};
                        color: ${isBookmarked ? '#fbbf24' : '#cbd5e1'}; font-size: 11px; font-weight: 700;
                        padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;
                    ">
                        <span>${isBookmarked ? '⭐' : '☆'}</span> <span>${item.bookmarks || 0}</span>
                    </button>

                    <!-- 展开评论按钮 -->
                    <button class="btn-interact btn-toggle-comments" style="
                        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
                        color: #cbd5e1; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
                        cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;
                    ">
                        <span>💬</span> <span>${totalComments.length}</span>
                    </button>
                </div>

                <!-- 动作按钮：一键 Remix & 复制链接 -->
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-do-remix" style="
                        flex: 1; font-weight: 800; font-size: 12px; padding: 8px; gap: 4px;
                        background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #000;
                        box-shadow: 0 0 15px rgba(0, 242, 254, 0.3);
                    ">
                        ${tr('comm_btn_remix')}
                    </button>
                    <button class="btn btn-secondary btn-copy-share-url" title="复制 Remix 专属分享链接" style="padding: 8px 10px; font-size: 12px;">
                        🔗
                    </button>
                </div>

                <!-- 展开的评论互动区域 (默认折叠) -->
                <div id="${commentsContainerId}" class="comments-section" style="
                    display: none; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;
                    flex-direction: column; gap: 8px; max-height: 200px;
                ">
                    <!-- 评论输入框 -->
                    <div style="display: flex; gap: 6px;">
                        <input type="text" class="input-card-comment" placeholder="${tr('comm_comment_placeholder')}" style="
                            flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
                            color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 11px; outline: none;
                        ">
                        <button class="btn btn-secondary btn-submit-comment" style="padding: 6px 10px; font-size: 11px; font-weight: 700; color: #00f2fe;">
                            ${tr('comm_btn_send')}
                        </button>
                    </div>

                    <!-- 评论列表 -->
                    <div class="comments-list" style="overflow-y: auto; max-height: 120px; display: flex; flex-direction: column; gap: 6px;">
                        ${totalComments.length ? totalComments.map(c => `
                            <div style="background: rgba(0,0,0,0.3); padding: 6px 8px; border-radius: 6px; font-size: 11px;">
                                <div style="color: #00f2fe; font-weight: 700; display: flex; justify-content: space-between;">
                                    <span>${c.country || '🌐'} @${c.author}</span>
                                    <span style="color: var(--text-muted); font-size: 9px;">${c.time || ''}</span>
                                </div>
                                <div style="color: #cbd5e1; margin-top: 2px;">${c.text}</div>
                            </div>
                        `).join('') : `<div style="font-size: 10px; color: var(--text-muted); text-align: center; padding: 6px;">${tr("comm_no_comments")}</div>`}
                    </div>
                </div>
            `;

            grid.appendChild(card);

            setTimeout(() => {
                const cvs = document.getElementById(canvasId);
                if (cvs) renderThumbnailToCanvas(cvs, item);
            }, 10);

            card.querySelector('.btn-like').onclick = () => toggleLikeWork(item.id);
            card.querySelector('.btn-bookmark').onclick = () => toggleBookmarkWork(item.id);

            const commSection = document.getElementById(commentsContainerId);
            card.querySelector('.btn-toggle-comments').onclick = () => {
                if (commSection.style.display === 'none') {
                    commSection.style.display = 'flex';
                } else {
                    commSection.style.display = 'none';
                }
            };

            const commentInput = card.querySelector('.input-card-comment');
            const submitCommentBtn = card.querySelector('.btn-submit-comment');
            const submitHandler = () => {
                if (commentInput && commentInput.value.trim()) {
                    addWorkComment(item.id, commentInput.value.trim());
                    commentInput.value = '';
                }
            };
            submitCommentBtn.onclick = submitHandler;
            commentInput.onkeydown = (e) => {
                if (e.key === 'Enter') submitHandler();
            };

            card.querySelector('.btn-do-remix').onclick = () => {
                if (confirm(tr('comm_remix_confirm', { title: item.title }))) {
                    remixIntoCanvas(item);
                }
            };

            card.querySelector('.btn-copy-share-url').onclick = () => {
                try {
                    const jsonStr = JSON.stringify(item);
                    const base64 = btoa(encodeURIComponent(jsonStr));
                    const link = window.location.origin + window.location.pathname + '#remix=' + base64;
                    navigator.clipboard.writeText(link).then(() => {
                        if (typeof window.showToast === 'function') window.showToast(tr('comm_share_link_copied'));
                    });
                } catch (e) {
                    if (typeof window.showToast === 'function') window.showToast('✅ 作品已就绪');
                }
            };
        });
    }

    function renderThumbnailToCanvas(canvas, item) {
        const ctx = canvas.getContext('2d');
        const frames = item.frames || [];
        if (!frames.length) return;

        let frameIdx = 0;
        const resX = item.resX || 16;
        const resY = item.resY || 16;

        // 🚨 保证像素为 1:1 绝对正方形，居中排布，彻底消除任何拉伸形变
        const maxDim = Math.max(resX, resY);
        const cellSize = Math.floor(Math.min(canvas.width, canvas.height) / maxDim);
        const drawW = resX * cellSize;
        const drawH = resY * cellSize;
        const offsetX = Math.floor((canvas.width - drawW) / 2);
        const offsetY = Math.floor((canvas.height - drawH) / 2);

        const drawFrame = (fBuf) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let y = 0; y < resY; y++) {
                for (let x = 0; x < resX; x++) {
                    const col = fBuf[y] ? fBuf[y][x] : null;
                    if (col && col !== 'transparent') {
                        ctx.fillStyle = col;
                        ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
                    }
                }
            }
        };

        drawFrame(frames[0]);

        if (frames.length > 1) {
            const interval = 1000 / (item.fps || 4);
            const timer = setInterval(() => {
                if (!document.body.contains(canvas)) {
                    clearInterval(timer);
                    return;
                }
                frameIdx = (frameIdx + 1) % frames.length;
                drawFrame(frames[frameIdx]);
            }, interval);
        }
    }

    // ============================================================
    // 🌐 URL Hash 自动感应与外部分享一键载入
    // ============================================================
    function checkUrlRemixPayload() {
        if (!window.location.hash || !window.location.hash.startsWith('#remix=')) return;

        try {
            const base64 = window.location.hash.replace('#remix=', '');
            const jsonStr = decodeURIComponent(atob(base64));
            const data = JSON.parse(jsonStr);

            if (data && data.frames && data.frames.length) {
                setTimeout(() => {
                    if (confirm(`🌟 检测到来自社区分享的像素作品：\n「${data.title || 'Untitled'}」 (by ${data.author || 'Anonymous'})\n\n是否立即一键载入画板进行 Remix 二创？`)) {
                        remixIntoCanvas(data);
                    }
                }, 800);
            }
        } catch (e) {
            console.warn('[Remix] Parse URL hash error:', e);
        }
    }

    // ============================================================
    // 📲 PWA 桌面版安装引导逻辑
    // ============================================================
    let deferredInstallPrompt = null;

    function initPWA() {
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js').then((reg) => {
                    console.log('[PWA] Service Worker registered with scope:', reg.scope);
                }).catch((err) => {
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
            });
        }

        const btnPwa = document.getElementById('btn-pwa-install');
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            console.log('[PWA] Install prompt ready!');
            if (btnPwa) btnPwa.style.display = 'inline-flex';
        });

        if (btnPwa) {
            btnPwa.addEventListener('click', async () => {
                if (!deferredInstallPrompt) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('💻 提示：如需安装桌面版，也可点击浏览器地址栏右侧的「安装」图标！');
                    }
                    return;
                }

                deferredInstallPrompt.prompt();
                const choice = await deferredInstallPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    if (typeof window.showToast === 'function') window.showToast('🎉 PixelSprite 桌面版安装成功！');
                    btnPwa.style.display = 'none';
                }
                deferredInstallPrompt = null;
            });
        }

        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            console.log('[PWA] Running in standalone desktop mode.');
            if (btnPwa) btnPwa.style.display = 'none';
        }
    }

    // 页面启动初始化
    window.addEventListener('DOMContentLoaded', () => {
        initPWA();
        checkUrlRemixPayload();

        // 绑定顶部社区按钮
        const btnOpenComm = document.getElementById('btn-open-community');
        if (btnOpenComm) {
            btnOpenComm.addEventListener('click', openCommunityModal);
        }

        // 绑定左侧面板的社区画廊与作品分享按钮
        const btnLeftComm = document.getElementById('btn-left-share-community');
        if (btnLeftComm) {
            btnLeftComm.addEventListener('click', openCommunityModal);
        }
    });

})();
