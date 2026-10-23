/* gif-decoder.js - 工业级 GIF 离线解析库 */
(function (global) {
    function parseGIF(arrayBuffer) {
        var bytes = new Uint8Array(arrayBuffer);
        var pos = 6; // skip "GIF89a"
        var width = bytes[pos++] | (bytes[pos++] << 8);
        var height = bytes[pos++] | (bytes[pos++] << 8);
        var packed = bytes[pos++];
        pos += 2; // bg color + aspect

        var gct = [];
        if (packed & 0x80) {
            var gctSize = 2 << (packed & 7);
            for (var i = 0; i < gctSize; i++) {
                gct.push([bytes[pos++], bytes[pos++], bytes[pos++]]);
            }
        }

        var frames = [];
        var currentPixels = new Uint8Array(width * height);
        var transIndex = -1;

        function lzwDecode(minCodeSize, data) {
            var clearCode = 1 << minCodeSize;
            var eofCode = clearCode + 1;
            var codeSize = minCodeSize + 1;
            var dict = [];
            var resetDict = function () {
                dict = [];
                for (var i = 0; i < clearCode; i++) dict.push([i]);
                dict.push(null, null);
                codeSize = minCodeSize + 1;
            };
            resetDict();
            var output = [];
            var bitBuf = 0, bitCount = 0, ptr = 0, prevCode = null;
            while (ptr < data.length) {
                while (bitCount < codeSize && ptr < data.length) {
                    bitBuf |= data[ptr++] << bitCount;
                    bitCount += 8;
                }
                if (bitCount < codeSize) break;
                var code = bitBuf & ((1 << codeSize) - 1);
                bitBuf >>= codeSize;
                bitCount -= codeSize;
                if (code === clearCode) { resetDict(); prevCode = null; continue; }
                if (code === eofCode) break;
                if (prevCode === null) {
                    output.push.apply(output, dict[code]);
                    prevCode = code;
                } else {
                    var entry = dict[code] ? dict[code] : dict[prevCode].concat([dict[prevCode][0]]);
                    output.push.apply(output, entry);
                    dict.push(dict[prevCode].concat([entry[0]]));
                    prevCode = code;
                    if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
                }
            }
            return output;
        }

        while (pos < bytes.length) {
            var blockType = bytes[pos++];
            if (blockType === 0x3B) break; // Trailer

            if (blockType === 0x21) { // Extension
                var label = bytes[pos++];
                if (label === 0xF9) { // Graphic Control
                    pos++;
                    var p = bytes[pos++];
                    transIndex = (p & 1) ? bytes[pos] : -1;
                    pos += 2;
                    pos++;
                } else {
                    pos++;
                    while (bytes[pos] !== 0) pos += bytes[pos] + 1;
                    pos++;
                }
            } else if (blockType === 0x2C) { // Image Descriptor
                var left = bytes[pos++] | (bytes[pos++] << 8);
                var top = bytes[pos++] | (bytes[pos++] << 8);
                var w = bytes[pos++] | (bytes[pos++] << 8);
                var h = bytes[pos++] | (bytes[pos++] << 8);
                var imgPacked = bytes[pos++];

                var lct = gct;
                if (imgPacked & 0x80) {
                    var lctSize = 2 << (imgPacked & 7);
                    lct = [];
                    for (var i = 0; i < lctSize; i++) {
                        lct.push([bytes[pos++], bytes[pos++], bytes[pos++]]);
                    }
                }

                var minCodeSize = bytes[pos++];
                var lzwData = [];
                while (bytes[pos] !== 0) {
                    var size = bytes[pos++];
                    for (var i = 0; i < size; i++) lzwData.push(bytes[pos++]);
                }
                pos++;

                var decoded = lzwDecode(minCodeSize, lzwData);
                var pIdx = 0;
                for (var y = 0; y < h; y++) {
                    for (var x = 0; x < w; x++) {
                        var px = left + x;
                        var py = top + y;
                        if (px < width && py < height) {
                            currentPixels[py * width + px] = decoded[pIdx++];
                        }
                    }
                }

                var framePixels = new Uint8Array(width * height);
                framePixels.set(currentPixels);

                frames.push({
                    width: width,
                    height: height,
                    pixels: framePixels,
                    colorTable: lct,
                    transparentIndex: transIndex
                });
            } else {
                break;
            }
        }
        return frames;
    }

    global.parseGIF = parseGIF;
})(window);