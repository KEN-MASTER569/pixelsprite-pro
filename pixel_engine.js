/**
 * PIXEL ENGINE - Ultra High Quality Procedural 2D Pixel Art Generator Engine
 * Features:
 * - HSL Hue-Shifted Color Palette Generation
 * - 2x2 Dithering Shader Patterns
 * - Pixel-Perfect RPG Asset Generators (Chest 6-Frame Anim, Sword, Potion, Gem, Shield)
 * - Light Beams, Particle FX, and Contact Shadows
 */

class PixelEngine {
    constructor() {
        this.resolution = 32;
        this.hueShiftFactor = 0.25;
        this.ditherStrength = 0.6;
        this.specularStrength = 0.8;
        this.particleDensity = 0.5;
        this.showShadow = true;
        this.showParticles = true;

        // Active Color Palette Ramps
        this.palette = {};
        this.setTheme('blue');
    }

    /**
     * Color Utility: Convert HSL to RGB array [r, g, b]
     */
    hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;

        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        let m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }

    rgbToHex([r, g, b]) {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * Generate HSL Hue-Shifted Color Ramp
     * Highlights shift towards warm yellow (+Hue), shadows shift towards cool purple/navy (-Hue)
     */
    makeHueShiftedRamp(baseH, baseS, baseL, steps = 5, hueShiftMax = 30) {
        const ramp = [];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1); // 0 (brightest highlight) to 1 (deep shadow)

            const hShift = (0.5 - t) * hueShiftMax * (this.hueShiftFactor * 1.5);
            const h = (baseH + hShift + 360) % 360;

            const s = Math.max(15, Math.min(100, baseS + (1 - Math.abs(t - 0.5) * 2) * 15));
            const l = Math.max(12, Math.min(94, baseL + (0.5 - t) * 65));

            const rgb = this.hslToRgb(h, s, l);
            ramp.push(this.rgbToHex(rgb));
        }
        return ramp;
    }

    /**
     * Theme Preset Initializer
     */
    setTheme(themeName) {
        let bodyH = 210, frameH = 45, gemH = 180;

        switch (themeName) {
            case 'blue':    // Azure & Gold
                bodyH = 215; frameH = 42; gemH = 175; break;
            case 'green':   // Emerald & Gold
                bodyH = 145; frameH = 45; gemH = 50; break;
            case 'red':     // Crimson & Gold
                bodyH = 355; frameH = 40; gemH = 48; break;
            case 'wood':    // Classic Wood & Brass
                bodyH = 28; frameH = 45; gemH = 120; break;
            case 'iron':    // Dark Iron & Silver
                bodyH = 220; frameH = 210; gemH = 0; break;
            case 'gold':    // Royal Pure Gold
                bodyH = 48; frameH = 38; gemH = 280; break;
            case 'skull':   // Shadow & Cursed Purple
                bodyH = 275; frameH = 250; gemH = 130; break;
        }

        this.palette = {
            body: this.makeHueShiftedRamp(bodyH, 70, 50, 5, 30),
            frame: this.makeHueShiftedRamp(frameH, 85, 55, 5, 25),
            gem: this.makeHueShiftedRamp(gemH, 90, 60, 5, 20),
            outline: '#080a12',
            shadow: 'rgba(0, 0, 0, 0.45)',
            lightGlow: this.rgbToHex(this.hslToRgb(gemH, 100, 75)),
            goldSparkle: '#ffea70',
            whiteHighlight: '#ffffff'
        };
    }

    /**
     * Set up pixel array buffer (resolution x resolution)
     */
    createBuffer(resX = (this.resX || this.resolution || 32), resY = (this.resY || this.resolution || 32)) {
        const grid = [];
        for (let y = 0; y < resY; y++) {
            grid[y] = new Array(resX).fill(null);
        }
        return grid;
    }

    setPixel(buffer, x, y, color) {
        x = Math.floor(x);
        y = Math.floor(y);
        const resY = buffer.length;
        const resX = buffer[0] ? buffer[0].length : resY;
        if (x >= 0 && x < resX && y >= 0 && y < resY) {
            buffer[y][x] = color;
        }
    }

    fillRect(buffer, x, y, w, h, color) {
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                this.setPixel(buffer, rx, ry, color);
            }
        }
    }

    fillDither(buffer, x, y, w, h, colorA, colorB) {
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                const useA = ((rx + ry) % 2 === 0);
                this.setPixel(buffer, rx, ry, useA ? colorA : colorB);
            }
        }
    }

    /**
     * Parse hex or rgba color into [r, g, b, a] array with caching
     */
    parseHexColor(col) {
        if (!col) return [0, 0, 0, 0];
        let str = col.toString().trim();
        let r = 0, g = 0, b = 0, a = 255;
        if (str.startsWith('#')) {
            if (str.length === 7) {
                r = parseInt(str.slice(1, 3), 16);
                g = parseInt(str.slice(3, 5), 16);
                b = parseInt(str.slice(5, 7), 16);
            } else if (str.length === 4) {
                r = parseInt(str[1] + str[1], 16);
                g = parseInt(str[2] + str[2], 16);
                b = parseInt(str[3] + str[3], 16);
            } else if (str.length === 9) {
                r = parseInt(str.slice(1, 3), 16);
                g = parseInt(str.slice(3, 5), 16);
                b = parseInt(str.slice(5, 7), 16);
                a = parseInt(str.slice(7, 9), 16);
            }
        } else if (str.startsWith('rgba')) {
            const parts = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (parts) {
                r = parseInt(parts[1], 10);
                g = parseInt(parts[2], 10);
                b = parseInt(parts[3], 10);
                a = parts[4] !== undefined ? Math.round(parseFloat(parts[4]) * 255) : 255;
            }
        }
        return [r, g, b, a];
    }

    /**
     * Render Buffer to HTML5 Canvas (Ultra Fast GPU-Accelerated ImageData)
     */
    renderToCanvas(buffer, canvas, clearFirst = true) {
        if (!buffer || !canvas) return;
        const ctx = canvas.getContext('2d');
        const resY = buffer.length;
        const resX = (buffer[0] && buffer[0].length) ? buffer[0].length : resY;

        if (clearFirst) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (!this._colorCache) this._colorCache = {};
        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
        }

        if (this._tempCanvas.width !== resX || this._tempCanvas.height !== resY) {
            this._tempCanvas.width = resX;
            this._tempCanvas.height = resY;
        }

        const tempCtx = this._tempCanvas.getContext('2d');
        const imgData = tempCtx.createImageData(resX, resY);
        const data = imgData.data;
        let hasPixels = false;

        for (let y = 0; y < resY; y++) {
            const row = buffer[y];
            if (!row) continue;
            const yOffset = y * resX * 4;
            for (let x = 0; x < resX; x++) {
                const hex = row[x];
                if (hex) {
                    hasPixels = true;
                    const idx = yOffset + x * 4;
                    let rgb = this._colorCache[hex];
                    if (!rgb) {
                        rgb = this.parseHexColor(hex);
                        this._colorCache[hex] = rgb;
                    }
                    data[idx] = rgb[0];
                    data[idx + 1] = rgb[1];
                    data[idx + 2] = rgb[2];
                    data[idx + 3] = rgb[3];
                }
            }
        }

        if (!hasPixels) return;

        tempCtx.putImageData(imgData, 0, 0);

        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.drawImage(this._tempCanvas, 0, 0, canvas.width, canvas.height);
    }

    // ============================================================
    // PROCEDURAL ASSET GENERATORS (Native 32x32 Pixel Art)
    // ============================================================

    /**
     * CHEST GENERATOR (6 Animation Frames)
     */
    generateChestFrame(frame = 0, res = this.resolution) {
        const buf = this.createBuffer(res);
        const p = this.palette;
        const cx = 16;

        // Ground Contact Shadow
        if (this.showShadow) {
            const shadowY = 27;
            for (let sy = 0; sy < 3; sy++) {
                const w = 11 - sy * 2;
                for (let sx = -w; sx <= w; sx++) {
                    this.setPixel(buf, cx + sx, shadowY + sy, 'rgba(0, 0, 0, 0.35)');
                }
            }
        }

        // Chest Dimensions
        const bodyW = 20; // X: 6..25
        const bodyH = 10; // Y: 16..25
        const bodyX = 6;
        let bodyY = 16;

        let lidLift = 0;
        let glowStrength = 0;

        switch (frame) {
            case 0: lidLift = 0; glowStrength = 0; break;
            case 1: bodyY = 17; lidLift = 0; glowStrength = 0.3; break; // Squat / Anticipation
            case 2: lidLift = 2; glowStrength = 0.5; break; // Micro Open
            case 3: lidLift = 4; glowStrength = 0.8; break; // Half Open
            case 4: lidLift = 6; glowStrength = 1.0; break; // Full Open
            case 5: lidLift = 7; glowStrength = 1.0; break; // Float & Loot
        }

        const lidH = 7;
        const lidY = bodyY - lidH - lidLift;

        // --- 1. CHEST LOWER BODY ---
        // Outer dark outline
        this.fillRect(buf, bodyX - 1, bodyY - 1, bodyW + 2, bodyH + 2, p.outline);

        // Horizontal Wooden Planks (4 planks)
        for (let ry = 0; ry < bodyH; ry++) {
            const plankIdx = Math.floor(ry / 2.5);
            let color = p.body[Math.min(p.body.length - 1, plankIdx)];
            if (ry % 3 === 0 && ry > 0) color = p.body[p.body.length - 1]; // Plank seam
            this.fillRect(buf, bodyX, bodyY + ry, bodyW, 1, color);
        }

        // Bottom Dithering
        if (this.ditherStrength > 0.2) {
            this.fillDither(buf, bodyX + 2, bodyY + bodyH - 2, bodyW - 4, 2, p.body[3], p.body[4]);
        }

        // Left & Right Metallic Edge Posts
        const postW = 3;
        // Left post
        this.fillRect(buf, bodyX, bodyY, postW, bodyH, p.frame[1]);
        this.fillRect(buf, bodyX, bodyY, 1, bodyH, p.frame[0]); // Highlight
        this.fillRect(buf, bodyX + postW - 1, bodyY, 1, bodyH, p.frame[3]); // Shadow
        // Right post
        this.fillRect(buf, bodyX + bodyW - postW, bodyY, postW, bodyH, p.frame[2]);
        this.fillRect(buf, bodyX + bodyW - postW, bodyY, 1, bodyH, p.frame[1]);
        this.fillRect(buf, bodyX + bodyW - 1, bodyY, 1, bodyH, p.frame[4]); // Dark shadow

        // Corner Rivets / Studs
        this.setPixel(buf, bodyX + 1, bodyY + 1, p.frame[0]);
        this.setPixel(buf, bodyX + 1, bodyY + bodyH - 2, p.frame[0]);
        this.setPixel(buf, bodyX + bodyW - 2, bodyY + 1, p.frame[1]);
        this.setPixel(buf, bodyX + bodyW - 2, bodyY + bodyH - 2, p.frame[1]);

        // Middle Lock Plate (5x5 gold plate)
        const lockX = cx - 2;
        const lockY = bodyY + 2;
        this.fillRect(buf, lockX - 1, lockY - 1, 6, 6, p.outline);
        this.fillRect(buf, lockX, lockY, 4, 4, p.frame[0]);
        this.fillRect(buf, lockX + 1, lockY + 1, 2, 2, p.frame[2]);
        // Keyhole
        this.setPixel(buf, cx - 1, lockY + 2, p.outline);
        this.setPixel(buf, cx, lockY + 2, p.outline);

        // --- 2. INNER TREASURE CHAMBER & LIGHT BEAMS ---
        if (frame >= 2) {
            const chamberY = bodyY - lidLift;
            const chamberH = lidLift;

            // Velvet Dark Chamber Background
            this.fillRect(buf, bodyX + 2, chamberY, bodyW - 4, chamberH, '#1a0926');

            // Gold Coins inside chamber
            for (let cy = chamberY; cy < chamberY + chamberH; cy++) {
                for (let cxp = bodyX + 3; cxp < bodyX + bodyW - 3; cxp++) {
                    if ((cxp + cy) % 2 === 0) {
                        this.setPixel(buf, cxp, cy, p.frame[0]);
                    }
                }
            }

            // Upward Light Beams
            if (this.showParticles) {
                for (let by = chamberY - 6; by < chamberY; by++) {
                    if (by < 0) continue;
                    for (let bx = cx - 5; bx <= cx + 5; bx++) {
                        if (Math.abs(bx - cx) < 3 && Math.random() < 0.6) {
                            this.setPixel(buf, bx, by, p.lightGlow);
                        } else if (Math.random() < 0.25) {
                            this.setPixel(buf, bx, by, p.goldSparkle);
                        }
                    }
                }
            }
        }

        // --- 3. ARCED CHEST LID ---
        const lidW = bodyW + 2; // 22 wide: X=5..26
        const lidX = 5;

        // Lid Outline
        // Arced top rows
        this.fillRect(buf, lidX + 2, lidY - 1, lidW - 4, 1, p.outline); // Top cap outline
        this.fillRect(buf, lidX + 1, lidY, 1, 1, p.outline);
        this.fillRect(buf, lidX + lidW - 2, lidY, 1, 1, p.outline);
        this.fillRect(buf, lidX - 1, lidY + 1, 1, lidH, p.outline);
        this.fillRect(buf, lidX + lidW, lidY + 1, 1, lidH, p.outline);
        this.fillRect(buf, lidX - 1, lidY + lidH, lidW + 2, 1, p.outline); // Bottom lid rim outline

        // Arced Lid Wood Fill
        for (let ry = 0; ry < lidH; ry++) {
            let rowX = lidX;
            let rowW = lidW;
            if (ry === 0) { rowX = lidX + 2; rowW = lidW - 4; }
            else if (ry === 1) { rowX = lidX + 1; rowW = lidW - 2; }

            const cIdx = Math.min(p.body.length - 1, Math.floor((ry / lidH) * p.body.length));
            this.fillRect(buf, rowX, lidY + ry, rowW, 1, p.body[cIdx]);
        }

        // Lid Highlights & Top Specular
        this.fillRect(buf, lidX + 3, lidY, lidW - 6, 1, p.body[0]);

        // Metallic Rim around Bottom of Lid
        this.fillRect(buf, lidX, lidY + lidH - 2, lidW, 2, p.frame[1]);
        this.fillRect(buf, lidX, lidY + lidH - 2, lidW, 1, p.frame[0]); // Top rim highlight

        // Center Metal Strap on Lid
        this.fillRect(buf, cx - 2, lidY, 4, lidH, p.frame[1]);
        this.fillRect(buf, cx - 2, lidY, 1, lidH, p.frame[0]); // Left highlight
        this.fillRect(buf, cx + 1, lidY, 1, lidH, p.frame[3]); // Right shadow

        // Side Metal Straps on Lid
        this.fillRect(buf, lidX + 1, lidY + 1, 2, lidH - 1, p.frame[1]);
        this.fillRect(buf, lidX + lidW - 3, lidY + 1, 2, lidH - 1, p.frame[2]);

        // --- 4. FLOATING LEGENDARY LOOT (Frame 5) ---
        if (frame === 5) {
            const lootY = lidY - 6;
            // Floating Gem Crown
            this.setPixel(buf, cx, lootY, p.gem[0]);
            this.setPixel(buf, cx - 1, lootY + 1, p.gem[0]);
            this.setPixel(buf, cx + 1, lootY + 1, p.gem[1]);
            this.setPixel(buf, cx - 2, lootY + 2, p.gem[1]);
            this.setPixel(buf, cx + 2, lootY + 2, p.gem[2]);
            this.setPixel(buf, cx - 1, lootY + 3, p.gem[2]);
            this.setPixel(buf, cx, lootY + 3, p.gem[3]);

            // Sparkle Stars
            this.setPixel(buf, cx - 5, lootY + 1, p.goldSparkle);
            this.setPixel(buf, cx + 5, lootY - 1, p.goldSparkle);
            this.setPixel(buf, cx + 1, lootY - 3, p.whiteHighlight);
        }

        return buf;
    }

    /**
     * LEGENDARY SWORD GENERATOR
     */
    generateSword(res = this.resolution) {
        const buf = this.createBuffer(res);
        const p = this.palette;

        // Ground Contact Shadow
        if (this.showShadow) {
            this.fillRect(buf, 6, 27, 8, 2, 'rgba(0, 0, 0, 0.35)');
        }

        // Diagonal Sword line drawing (from bottom-left (6,26) to top-right (25,7))
        for (let i = 0; i < 18; i++) {
            const x = 7 + i;
            const y = 25 - i;

            // Blade Edge Bevel (Top-Left side bright highlight, Bottom-Right side shadow)
            this.setPixel(buf, x - 1, y, p.body[0]);
            this.setPixel(buf, x, y - 1, p.whiteHighlight);
            this.setPixel(buf, x, y, p.body[1]);
            this.setPixel(buf, x + 1, y, p.body[2]);
            this.setPixel(buf, x, y + 1, p.body[3]);

            // Outer Outline
            this.setPixel(buf, x - 1, y - 1, p.outline);
            this.setPixel(buf, x + 2, y + 1, p.outline);
        }

        // Blade Tip (25, 7)
        this.setPixel(buf, 25, 7, p.whiteHighlight);
        this.setPixel(buf, 26, 7, p.outline);
        this.setPixel(buf, 25, 6, p.outline);

        // Winged Crossguard (at X=11, Y=21)
        const gx = 11, gy = 21;
        this.fillRect(buf, gx - 3, gy + 1, 5, 2, p.frame[0]);
        this.fillRect(buf, gx - 1, gy + 3, 2, 5, p.frame[2]);
        this.fillRect(buf, gx - 4, gy, 7, 1, p.frame[1]);

        // Guard Outline
        this.setPixel(buf, gx - 5, gy, p.outline);
        this.setPixel(buf, gx + 3, gy + 2, p.outline);

        // Gem Pommel (bottom-left end X=6, Y=26)
        this.setPixel(buf, 6, 26, p.gem[0]);
        this.setPixel(buf, 5, 26, p.outline);
        this.setPixel(buf, 6, 27, p.outline);

        // Magic Aura Sparkles
        if (this.showParticles) {
            this.setPixel(buf, 18, 11, p.lightGlow);
            this.setPixel(buf, 22, 7, p.goldSparkle);
            this.setPixel(buf, 20, 16, p.lightGlow);
        }

        return buf;
    }

    /**
     * MAGIC POTION GENERATOR
     */
    generatePotion(res = this.resolution) {
        const buf = this.createBuffer(res);
        const p = this.palette;
        const cx = 16, cy = 18;
        const radius = 7;

        // Ground shadow
        if (this.showShadow) {
            this.fillRect(buf, cx - radius, cy + radius + 1, radius * 2, 2, 'rgba(0, 0, 0, 0.35)');
        }

        // Glass Bulb Fill & Liquid Shader
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const distSq = x * x + y * y;
                if (distSq <= radius * radius) {
                    const py = cy + y;
                    const px = cx + x;

                    // Liquid level (70% height filled)
                    if (y > -radius * 0.3) {
                        const depthRatio = (y + radius * 0.3) / (radius * 1.3);
                        const gemIdx = Math.min(p.gem.length - 1, Math.floor(depthRatio * p.gem.length));
                        this.setPixel(buf, px, py, p.gem[gemIdx]);

                        // Surface Meniscus Highlight
                        if (Math.abs(y - Math.floor(-radius * 0.3)) <= 0.5) {
                            this.setPixel(buf, px, py, p.gem[0]);
                        }
                    } else {
                        // Empty Glass Reflection
                        this.setPixel(buf, px, py, 'rgba(255, 255, 255, 0.12)');
                    }

                    // Curved Glass Specular Arc (Top-Left)
                    if (x <= -2 && y <= -2 && distSq > radius * radius * 0.4) {
                        this.setPixel(buf, px, py, p.whiteHighlight);
                    }
                } else if (distSq <= (radius + 1) * (radius + 1)) {
                    // Dark Outer Outline
                    this.setPixel(buf, cx + x, cy + y, p.outline);
                }
            }
        }

        // Flask Neck
        const neckY = cy - radius - 4;
        this.fillRect(buf, cx - 3, neckY, 6, 5, p.outline);
        this.fillRect(buf, cx - 2, neckY + 1, 4, 4, 'rgba(255, 255, 255, 0.2)');
        this.fillRect(buf, cx - 3, neckY, 6, 1, p.frame[0]); // Glass Rim

        // Wooden Cork Stopper
        this.fillRect(buf, cx - 2, neckY - 3, 4, 3, p.frame[1]);
        this.fillRect(buf, cx - 2, neckY - 3, 4, 1, p.frame[0]);
        this.fillRect(buf, cx - 3, neckY - 4, 6, 1, p.outline);

        // Floating Bubbles
        if (this.showParticles) {
            this.setPixel(buf, cx - 2, cy + 2, p.gem[0]);
            this.setPixel(buf, cx + 3, cy + 4, p.whiteHighlight);
            this.setPixel(buf, cx + 1, cy - 1, p.goldSparkle);
        }

        return buf;
    }

    /**
     * CRYSTAL GEM GENERATOR
     */
    generateGem(res = this.resolution) {
        const buf = this.createBuffer(res);
        const p = this.palette;
        const cx = 16, cy = 16;

        // Ground shadow
        if (this.showShadow) {
            this.fillRect(buf, cx - 7, cy + 10, 14, 2, 'rgba(0, 0, 0, 0.35)');
        }

        // Faceted Octagon / Diamond Geometry
        const size = 9;

        for (let y = -size; y <= size; y++) {
            const rw = Math.floor(size - Math.abs(y) * 0.5);
            for (let x = -rw; x <= rw; x++) {
                const px = cx + x;
                const py = cy + y;

                // Color based on facet quadrants
                let color = p.gem[2];
                if (x < 0 && y < 0) color = p.gem[0]; // Top-Left (Brightest Highlight)
                else if (x >= 0 && y < 0) color = p.gem[1]; // Top-Right (Mid Highlight)
                else if (x < 0 && y >= 0) color = p.gem[3]; // Bottom-Left (Shadow)
                else color = p.gem[4]; // Bottom-Right (Deep Shadow)

                this.setPixel(buf, px, py, color);
            }

            // Outline
            this.setPixel(buf, cx - rw - 1, cy + y, p.outline);
            this.setPixel(buf, cx + rw + 1, cy + y, p.outline);
        }

        // Top and Bottom Caps Outline
        this.fillRect(buf, cx - 4, cy - size - 1, 9, 1, p.outline);
        this.fillRect(buf, cx - 4, cy + size + 1, 9, 1, p.outline);

        // Center Facet Seams
        for (let i = -size + 2; i <= size - 2; i++) {
            this.setPixel(buf, cx + i, cy, p.gem[0]);
            this.setPixel(buf, cx, cy + i, p.gem[1]);
        }

        // Star Specular Highlight (Top-Left Facet)
        this.setPixel(buf, cx - 4, cy - 4, p.whiteHighlight);
        this.setPixel(buf, cx - 3, cy - 4, p.whiteHighlight);
        this.setPixel(buf, cx - 4, cy - 3, p.whiteHighlight);

        return buf;
    }

    /**
     * KNIGHT SHIELD GENERATOR
     */
    generateShield(res = this.resolution) {
        const buf = this.createBuffer(res);
        const p = this.palette;
        const cx = 16;
        const topY = 6;
        const width = 18;
        const height = 20;

        // Ground shadow
        if (this.showShadow) {
            this.fillRect(buf, cx - 6, topY + height + 1, 12, 2, 'rgba(0, 0, 0, 0.35)');
        }

        // Shield Body Geometry
        for (let y = 0; y < height; y++) {
            let rowW = width / 2;
            if (y > height * 0.45) {
                const t = (y - height * 0.45) / (height * 0.55);
                rowW = (width / 2) * (1 - t);
            }
            rowW = Math.max(1, Math.floor(rowW));

            // Outer Outline
            this.setPixel(buf, cx - rowW - 1, topY + y, p.outline);
            this.setPixel(buf, cx + rowW + 1, topY + y, p.outline);

            // Shield Face Colors (Quartered Split)
            for (let x = -rowW; x <= rowW; x++) {
                const px = cx + x;
                const py = topY + y;

                let color = p.body[1];
                if ((x < 0 && y < height / 2) || (x >= 0 && y >= height / 2)) {
                    color = p.body[0]; // Highlight diagonal quarters
                } else {
                    color = p.body[3]; // Shadow diagonal quarters
                }

                this.setPixel(buf, px, py, color);
            }

            // Metallic Rim (1px on left highlight, 1px on right shadow)
            this.setPixel(buf, cx - rowW, topY + y, p.frame[0]);
            this.setPixel(buf, cx + rowW, topY + y, p.frame[3]);
        }

        // Top & Bottom Cap Outlines
        this.fillRect(buf, cx - width / 2 - 1, topY - 1, width + 3, 1, p.outline);
        this.setPixel(buf, cx, topY + height, p.outline);

        // Heraldic Crest: Gold Cross in Center
        const crossW = 4;
        const crossH = 10;
        this.fillRect(buf, cx - crossW / 2, topY + 4, crossW, crossH, p.frame[0]);
        this.fillRect(buf, cx - 5, topY + 6, 11, 3, p.frame[0]);
        this.fillRect(buf, cx - crossW / 2, topY + 4, 1, crossH, p.whiteHighlight); // Cross Highlight

        // Center Gem Inlay
        this.fillRect(buf, cx - 1, topY + 7, 3, 3, p.gem[0]);
        this.setPixel(buf, cx, topY + 8, p.whiteHighlight);

        return buf;
    }
}

window.PixelEngine = PixelEngine;
