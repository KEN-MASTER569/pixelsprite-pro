/**
 * GIF ENCODER - Pure JavaScript GIF89a LZW Animated GIF Encoder
 * Features:
 * - Color palette extraction & quantization
 * - Transparency support
 * - Animated GIF frame sequence generation
 */

function encodeGIF(canvases, delayMs = 125) {
    if (!canvases || canvases.length === 0) return null;

    const width = canvases[0].width;
    const height = canvases[0].height;

    // 1. Build Global Color Palette across all frames
    const palette = [];
    const colorMap = new Map();

    for (let c = 0; c < canvases.length; c++) {
        const ctx = canvases[c].getContext('2d');
        const imgData = ctx.getImageData(0, 0, width, height).data;
        for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];

            const key = (a < 128) ? 'trans' : `${r},${g},${b}`;
            if (!colorMap.has(key)) {
                if (palette.length < 256) {
                    colorMap.set(key, palette.length);
                    palette.push(a < 128 ? [0, 0, 0, 0] : [r, g, b, 255]);
                } else {
                    colorMap.set(key, 0); // fallback
                }
            }
        }
    }

    // Pad Palette size to power of 2
    let pow = 1;
    while ((1 << pow) < palette.length) pow++;
    pow = Math.max(1, Math.min(8, pow));
    const palSize = 1 << pow;
    while (palette.length < palSize) {
        palette.push([0, 0, 0, 255]);
    }

    const bytes = [];

    // Header: GIF89a
    bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

    // Logical Screen Descriptor
    bytes.push(width & 0xFF, (width >> 8) & 0xFF);
    bytes.push(height & 0xFF, (height >> 8) & 0xFF);
    bytes.push(0x80 | 0x70 | (pow - 1)); // Global Color Table Flag + Color Depth
    bytes.push(0); // BG color index
    bytes.push(0); // Pixel aspect ratio

    // Global Color Table
    for (let i = 0; i < palSize; i++) {
        const [r, g, b] = palette[i];
        bytes.push(r, g, b);
    }

    // Netscape Application Extension (Infinite Loop)
    bytes.push(0x21, 0xFF, 0x0B);
    const appExt = "NETSCAPE2.0";
    for (let i = 0; i < appExt.length; i++) bytes.push(appExt.charCodeAt(i));
    bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

    const transIdx = colorMap.get('trans');
    const hasTrans = (transIdx !== undefined);
    const delay100th = Math.max(1, Math.round(delayMs / 10));

    // Encode Frames
    for (let f = 0; f < canvases.length; f++) {
        const ctx = canvases[f].getContext('2d');
        const imgData = ctx.getImageData(0, 0, width, height).data;

        // Graphic Control Extension
        bytes.push(0x21, 0xF9, 0x04);
        bytes.push(hasTrans ? 0x09 : 0x04); // Disposal method 2 + transparency flag
        bytes.push(delay100th & 0xFF, (delay100th >> 8) & 0xFF);
        bytes.push(hasTrans ? transIdx : 0);
        bytes.push(0);

        // Image Descriptor
        bytes.push(0x2C);
        bytes.push(0, 0, 0, 0); // Left, Top
        bytes.push(width & 0xFF, (width >> 8) & 0xFF);
        bytes.push(height & 0xFF, (height >> 8) & 0xFF);
        bytes.push(0); // No LCT

        // Indexed Pixels
        const indexedPixels = new Uint8Array(width * height);
        let ptr = 0;
        for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];
            const key = (a < 128) ? 'trans' : `${r},${g},${b}`;
            indexedPixels[ptr++] = colorMap.get(key) || 0;
        }

        // LZW Compression
        const minCodeSize = Math.max(2, pow);
        bytes.push(minCodeSize);

        const lzwData = lzwEncode(indexedPixels, minCodeSize);
        let offset = 0;
        while (offset < lzwData.length) {
            const blockSize = Math.min(255, lzwData.length - offset);
            bytes.push(blockSize);
            for (let b = 0; b < blockSize; b++) {
                bytes.push(lzwData[offset + b]);
            }
            offset += blockSize;
        }
        bytes.push(0); // Block terminator
    }

    bytes.push(0x3B); // GIF Trailer
    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

function lzwEncode(pixels, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const eofCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eofCode + 1;
    const maxNextCode = 4095;

    const dictionary = new Map();
    function initDict() {
        dictionary.clear();
        for (let i = 0; i < clearCode; i++) {
            dictionary.set(String(i), i);
        }
        codeSize = minCodeSize + 1;
        nextCode = eofCode + 1;
    }

    initDict();

    const output = [];
    let bitBuf = 0;
    let bitCount = 0;

    function writeCode(code) {
        bitBuf |= (code << bitCount);
        bitCount += codeSize;
        while (bitCount >= 8) {
            output.push(bitBuf & 0xFF);
            bitBuf >>= 8;
            bitCount -= 8;
        }
    }

    writeCode(clearCode);

    let current = String(pixels[0]);
    for (let i = 1; i < pixels.length; i++) {
        const k = pixels[i];
        const combined = current + ',' + k;
        if (dictionary.has(combined)) {
            current = combined;
        } else {
            writeCode(dictionary.get(current));
            if (nextCode <= maxNextCode) {
                dictionary.set(combined, nextCode++);
                if (nextCode === (1 << codeSize) + 1 && codeSize < 12) {
                    codeSize++;
                }
            } else {
                writeCode(clearCode);
                initDict();
            }
            current = String(k);
        }
    }
    writeCode(dictionary.get(current));
    writeCode(eofCode);

    if (bitCount > 0) {
        output.push(bitBuf & 0xFF);
    }

    return new Uint8Array(output);
}

window.encodeGIF = encodeGIF;
