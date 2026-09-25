//Plugin by Elixir
import Jimp from 'jimp';

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

const parseColor = (input) => {
    const s = String(input || '').trim();
    if (/^rgba?\(/i.test(s)) {
        const m = s.match(/rgba?\(([^)]+)\)/i);
        const parts = m ? m[1].split(',').map((v) => parseFloat(v.trim())) : [0, 0, 0, 1];
        return {
            r: clamp255(Math.round(parts[0] || 0)),
            g: clamp255(Math.round(parts[1] || 0)),
            b: clamp255(Math.round(parts[2] || 0)),
            a: parts.length >= 4 ? clamp255(Math.round(parts[3] * 255)) : 255
        };
    }
    const h = s.replace('#', '');
    if (h.length === 3) {
        return {
            r: parseInt(h[0] + h[0], 16),
            g: parseInt(h[1] + h[1], 16),
            b: parseInt(h[2] + h[2], 16),
            a: 255
        };
    }
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255
    };
};

const mixColor = (c1, c2, t) => ({
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
    a: Math.round(c1.a + (c2.a - c1.a) * t)
});



const blendPixel = (img, x, y, color, alpha = 1) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= img.bitmap.width || py >= img.bitmap.height) return;
    const a = clamp255(Math.round(color.a * alpha)) / 255;
    if (a <= 0) return;
    const idx = (py * img.bitmap.width + px) * 4;
    const d = img.bitmap.data;
    const ia = 1 - a;
    d[idx] = clamp255(Math.round(color.r * a + d[idx] * ia));
    d[idx + 1] = clamp255(Math.round(color.g * a + d[idx + 1] * ia));
    d[idx + 2] = clamp255(Math.round(color.b * a + d[idx + 2] * ia));
    d[idx + 3] = 255;
};

const compositeBlend = (img, src, dx, dy) => {
    const sw = src.bitmap.width;
    const sh = src.bitmap.height;
    const sd = src.bitmap.data;
    const dd = img.bitmap.data;
    for (let y = 0; y < sh; y++) {
        const ty = dy + y;
        if (ty < 0 || ty >= img.bitmap.height) continue;
        for (let x = 0; x < sw; x++) {
            const tx = dx + x;
            if (tx < 0 || tx >= img.bitmap.width) continue;
            const si = (y * sw + x) * 4;
            const sa = sd[si + 3] / 255;
            if (sa <= 0) continue;
            const di = (ty * img.bitmap.width + tx) * 4;
            const ia = 1 - sa;
            dd[di] = clamp255(Math.round(sd[si] * sa + dd[di] * ia));
            dd[di + 1] = clamp255(Math.round(sd[si + 1] * sa + dd[di + 1] * ia));
            dd[di + 2] = clamp255(Math.round(sd[si + 2] * sa + dd[di + 2] * ia));
            dd[di + 3] = 255;
        }
    }
};



const sampleGradient = (stops, t) => {
    const pos = Math.max(0, Math.min(1, t));
    for (let i = 0; i < stops.length - 1; i++) {
        const s1 = stops[i];
        const s2 = stops[i + 1];
        if (pos >= s1.pos && pos <= s2.pos) {
            const local = s2.pos === s1.pos ? 0 : (pos - s1.pos) / (s2.pos - s1.pos);
            return mixColor(s1.color, s2.color, local);
        }
    }
    return pos <= stops[0].pos ? stops[0].color : stops[stops.length - 1].color;
};

const fillLinearGradient = (img, x1, y1, x2, y2, stops) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    for (let y = 0; y < img.bitmap.height; y++) {
        for (let x = 0; x < img.bitmap.width; x++) {
            const t = ((x - x1) * dx + (y - y1) * dy) / len2;
            blendPixel(img, x, y, sampleGradient(stops, t), 1);
        }
    }
};



const insideRoundRect = (px, py, x, y, w, h, r) => {
    if (px < x || px > x + w || py < y || py > y + h) return false;
    let ccx = null;
    let ccy = null;
    if (px < x + r) ccx = x + r;
    else if (px > x + w - r) ccx = x + w - r;
    if (py < y + r) ccy = y + r;
    else if (py > y + h - r) ccy = y + h - r;
    if (ccx === null || ccy === null) return true;
    const dx = px - ccx;
    const dy = py - ccy;
    return dx * dx + dy * dy <= r * r;
};

const fillRect = (img, x, y, w, h, color, alpha = 1) => {
    for (let py = Math.floor(y); py < y + h; py++) {
        for (let px = Math.floor(x); px < x + w; px++) {
            blendPixel(img, px, py, color, alpha);
        }
    }
};

const fillRoundRect = (img, x, y, w, h, r, color, alpha = 1) => {
    for (let py = Math.floor(y); py <= Math.ceil(y + h); py++) {
        for (let px = Math.floor(x); px <= Math.ceil(x + w); px++) {
            if (insideRoundRect(px + 0.5, py + 0.5, x, y, w, h, r)) {
                blendPixel(img, px, py, color, alpha);
            }
        }
    }
};

const fillRoundRectGradient = (img, x, y, w, h, r, stops, gx1, gy1, gx2, gy2) => {
    const dx = gx2 - gx1;
    const dy = gy2 - gy1;
    const len2 = dx * dx + dy * dy || 1;
    for (let py = Math.floor(y); py <= Math.ceil(y + h); py++) {
        for (let px = Math.floor(x); px <= Math.ceil(x + w); px++) {
            const fx = px + 0.5;
            const fy = py + 0.5;
            if (!insideRoundRect(fx, fy, x, y, w, h, r)) continue;
            const t = ((fx - gx1) * dx + (fy - gy1) * dy) / len2;
            blendPixel(img, px, py, sampleGradient(stops, t), 1);
        }
    }
};

const fillRoundRectRadial = (img, x, y, w, h, r, cx, cy, radius, inner, outer) => {
    const c1 = typeof inner === 'string' ? parseColor(inner) : inner;
    const c2 = typeof outer === 'string' ? parseColor(outer) : outer;
    for (let py = Math.floor(y); py <= Math.ceil(y + h); py++) {
        for (let px = Math.floor(x); px <= Math.ceil(x + w); px++) {
            const fx = px + 0.5;
            const fy = py + 0.5;
            if (!insideRoundRect(fx, fy, x, y, w, h, r)) continue;
            const ddx = fx - cx;
            const ddy = fy - cy;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            blendPixel(img, px, py, mixColor(c1, c2, Math.min(1, dist / (radius || 1))), 1);
        }
    }
};

const strokeRoundRect = (img, x, y, w, h, r, lineWidth, color, alpha = 1) => {
    const half = lineWidth / 2;
    const innerR = Math.max(0, r - half);
    for (let py = Math.floor(y - half); py <= Math.ceil(y + h + half); py++) {
        for (let px = Math.floor(x - half); px <= Math.ceil(x + w + half); px++) {
            const fx = px + 0.5;
            const fy = py + 0.5;
            const outer = insideRoundRect(fx, fy, x - half, y - half, w + lineWidth, h + lineWidth, r + half);
            const inner = insideRoundRect(fx, fy, x + half, y + half, w - lineWidth, h - lineWidth, innerR);
            if (outer && !inner) blendPixel(img, px, py, color, alpha);
        }
    }
};

const distanceToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const ox = px - cx;
    const oy = py - cy;
    return Math.sqrt(ox * ox + oy * oy);
};

const drawThickLine = (img, x1, y1, x2, y2, width, color, alpha = 1) => {
    const half = width / 2;
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - half - 1));
    const maxX = Math.min(img.bitmap.width - 1, Math.ceil(Math.max(x1, x2) + half + 1));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - half - 1));
    const maxY = Math.min(img.bitmap.height - 1, Math.ceil(Math.max(y1, y2) + half + 1));
    for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
            const dist = distanceToSegment(px + 0.5, py + 0.5, x1, y1, x2, y2);
            if (dist <= half + 0.5) {
                const aa = Math.min(1, half + 0.5 - dist);
                blendPixel(img, px, py, color, alpha * aa);
            }
        }
    }
};

const fillCircle = (img, cx, cy, radius, color, alpha = 1) => {
    const r = radius + 0.5;
    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(img.bitmap.width - 1, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(img.bitmap.height - 1, Math.ceil(cy + r));
    for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
            const dx = px + 0.5 - cx;
            const dy = py + 0.5 - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= r) {
                const aa = Math.min(1, r - dist);
                blendPixel(img, px, py, color, alpha * aa);
            }
        }
    }
};

const strokeCircle = (img, cx, cy, radius, width, color, alpha = 1) => {
    const half = width / 2;
    const r = radius + half + 0.5;
    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(img.bitmap.width - 1, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(img.bitmap.height - 1, Math.ceil(cy + r));
    for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
            const dx = px + 0.5 - cx;
            const dy = py + 0.5 - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const delta = Math.abs(dist - radius);
            if (delta <= half + 0.5) {
                const aa = Math.min(1, half + 0.5 - delta);
                blendPixel(img, px, py, color, alpha * aa);
            }
        }
    }
};

const glowShape = (img, drawFn, blurRadius = 10) => {
    try {
        const layer = new Jimp(img.bitmap.width, img.bitmap.height, 0x00000000);
        drawFn(layer);
        layer.blur(blurRadius);
        compositeBlend(img, layer, 0, 0);
    } catch (e) {
        
    }
};



let FONTS = null;

const getFonts = async () => {
    if (FONTS) return FONTS;
    const load = async (name, fallback) => {
        try {
            return await Jimp.loadFont(Jimp[name] || Jimp[fallback]);
        } catch (e) {
            return await Jimp.loadFont(Jimp[fallback]);
        }
    };
    FONTS = {
        xl: await load('FONT_SANS_64_WHITE', 'FONT_SANS_32_WHITE'),
        lg: await load('FONT_SANS_32_WHITE', 'FONT_SANS_16_WHITE'),
        md: await load('FONT_SANS_16_WHITE', 'FONT_SANS_8_WHITE')
    };
    return FONTS;
};

const sanitizeName = (name) => {
    const clean = String(name || '').replace(/[^\x20-\x7E]/g, '').trim();
    return clean || 'Player';
};

const shortenName = (name) => {
    const clean = sanitizeName(name);
    return clean.length > 12 ? clean.slice(0, 12) + '...' : clean;
};

const printCentered = (img, font, text, centerX, centerY, alpha = 1) => {
    const w = Jimp.measureText(font, text);
    const h = Jimp.measureTextHeight(font, text, img.bitmap.width);
    const x = Math.round(centerX - w / 2);
    const y = Math.round(centerY - h / 2);
    if (alpha >= 1) {
        img.print(font, x, y, text);
        return;
    }
    const layer = new Jimp(img.bitmap.width, img.bitmap.height, 0x00000000);
    layer.print(font, x, y, text);
    layer.scan(0, 0, layer.bitmap.width, layer.bitmap.height, function (px, py, idx) {
        this.bitmap.data[idx + 3] = Math.round(this.bitmap.data[idx + 3] * alpha);
    });
    compositeBlend(img, layer, 0, 0);
};



const drawX = (img, x, y, size, color, withGlow = true) => {
    const padding = size * 0.25;
    const lineWidth = size * 0.12;
    const c = typeof color === 'string' ? parseColor(color) : color;
    const ax = x + padding;
    const ay = y + padding;
    const bx = x + size - padding;
    const by = y + size - padding;
    if (withGlow) {
        drawThickLine(img, ax, ay, bx, by, lineWidth + size * 0.12, c, 0.22);
        drawThickLine(img, bx, ay, ax, by, lineWidth + size * 0.12, c, 0.22);
    }
    drawThickLine(img, ax, ay, bx, by, lineWidth, c, 1);
    drawThickLine(img, bx, ay, ax, by, lineWidth, c, 1);
};

const drawO = (img, x, y, size, color, withGlow = true) => {
    const radius = size * 0.35;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const lineWidth = size * 0.12;
    const c = typeof color === 'string' ? parseColor(color) : color;
    if (withGlow) strokeCircle(img, cx, cy, radius, lineWidth + size * 0.12, c, 0.22);
    strokeCircle(img, cx, cy, radius, lineWidth, c, 1);
};



const applyCircleMask = (img) => {
    const size = img.bitmap.width;
    const r = size / 2;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x + 0.5 - r;
            const dy = y + 0.5 - r;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const aa = Math.min(1, Math.max(0, r - dist + 0.5));
            const idx = (y * size + x) * 4;
            if (aa <= 0) {
                img.bitmap.data[idx + 3] = 0;
                continue;
            }
            img.bitmap.data[idx + 3] = Math.round(img.bitmap.data[idx + 3] * aa);
        }
    }
    return img;
};

const createPlaceholderImage = (size) => {
    const img = new Jimp(size, size, 0x667eeaff);
    fillRect(img, 0, 0, size, size, parseColor('#667eea'), 1);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x + 0.5 - size / 2;
            const dy = y + 0.5 - size / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const t = Math.min(1, dist / (size / 2));
            blendPixel(img, x, y, mixColor(parseColor('#667eea'), parseColor('#764ba2'), t), 1);
        }
    }
    const white = parseColor('#ffffff');
    // persona stilizzata: testa + spalle
    fillCircle(img, size / 2, size * 0.36, size * 0.15, white, 1);
    const bodyCy = size * 0.88;
    const bodyR = size * 0.34;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x + 0.5 - size / 2;
            const dy = y + 0.5 - bodyCy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (y + 0.5 <= bodyCy && dist <= bodyR) {
                blendPixel(img, x, y, white, Math.min(1, bodyR - dist));
            }
        }
    }
    strokeCircle(img, size / 2, size / 2, size / 2 - 1.5, 3, white, 0.9);
    return applyCircleMask(img);
};

const loadAvatar = async (url, size) => {
    if (!url) return null;
    try {
        const raw = await Jimp.read(url);
        const side = Math.min(raw.bitmap.width, raw.bitmap.height);
        const out = raw.clone().crop(
            Math.floor((raw.bitmap.width - side) / 2),
            Math.floor((raw.bitmap.height - side) / 2),
            side,
            side
        ).resize(size, size);
        return applyCircleMask(out);
    } catch (e) {
        return null;
    }
};



const W = 600;
const H = 600;
const CELL = 120;
const BOARD_X = 120;
const BOARD_Y = 200;
const P1_COLOR = '#ff4757';
const P2_COLOR = '#3742fa';

const countRemainingPositions = (board) => board.filter((cell) => !cell).length;

async function renderBoard(title, p1, p2, game, status, p1PicUrl, p2PicUrl, showHelp = false) {
    const fonts = await getFonts();
    const img = new Jimp(W, H, 0x0f0f23ff);
    const boardArr = game.board;
    const turn = game.turn;

  
    fillLinearGradient(img, 0, 0, W, H, [
        { pos: 0, color: parseColor('#0f0f23') },
        { pos: 0.3, color: parseColor('#1a1a2e') },
        { pos: 0.7, color: parseColor('#16213e') },
        { pos: 1, color: parseColor('#0f3460') }
    ]);


    const checker = parseColor('rgba(255,255,255,0.05)');
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            if ((i + j) % 2 === 0) fillRect(img, i * 30, j * 30, 15, 15, checker, 1);
        }
    }

  
    const vsX = 30;
    const vsY = 20;
    const vsW = W - 60;
    const vsH = 140;
    fillRoundRectGradient(img, vsX, vsY, vsW, vsH, 25, [
        { pos: 0, color: parseColor('rgba(255,255,255,0.10)') },
        { pos: 1, color: parseColor('rgba(255,255,255,0.05)') }
    ], 0, vsY, 0, vsY + vsH);
    strokeRoundRect(img, vsX, vsY, vsW, vsH, 25, 1.5, parseColor('rgba(255,255,255,0.2)'), 1);

   
    let p1Img = await loadAvatar(p1PicUrl, 80);
    let p2Img = await loadAvatar(p2PicUrl, 80);
    if (!p1Img) p1Img = createPlaceholderImage(80);
    if (!p2Img) p2Img = createPlaceholderImage(80);

    const p1Color = parseColor(P1_COLOR);
    const p2Color = parseColor(P2_COLOR);
    const p1ImgX = vsX + 90;
    const p1ImgY = vsY + vsH / 2 - 10;
    const p2ImgX = vsX + vsW - 90;
    const p2ImgY = vsY + vsH / 2 - 10;

    const drawPlayer = (avatarImg, centerX, centerY, ringColor, active, symbol) => {
        const r = 40;
        compositeBlend(img, avatarImg, Math.round(centerX - r), Math.round(centerY - r));
        if (active && !game.isFinished) {
            glowShape(img, (layer) => {
                strokeCircle(layer, centerX, centerY, r + 2, 6, ringColor, 1);
            }, 8);
            strokeCircle(img, centerX, centerY, r + 2, 4, ringColor, 1);
        } else {
            strokeCircle(img, centerX, centerY, r + 2, 3, parseColor('rgba(255,255,255,0.5)'), 1);
        }
        const nameY = vsY + vsH - 15;
        if (symbol === 'X') drawX(img, centerX - 44, nameY - 8, 20, ringColor, false);
        else drawO(img, centerX - 44, nameY - 8, 20, ringColor, false);
    };

    drawPlayer(p1Img, p1ImgX, p1ImgY, p1Color, turn === game.p1, 'X');
    drawPlayer(p2Img, p2ImgX, p2ImgY, p2Color, turn === game.p2, 'O');

   
    printCentered(img, fonts.lg, 'CONTRO', W / 2, vsY + vsH / 2 - 15);
    printCentered(img, fonts.md, shortenName(p1), p1ImgX, vsY + vsH - 15);
    printCentered(img, fonts.md, shortenName(p2), p2ImgX, vsY + vsH - 15);

  
    const boardX = BOARD_X - 20;
    const boardY = BOARD_Y - 20;
    const boardW = CELL * 3 + 40;
    const boardH = CELL * 3 + 40;
    glowShape(img, (layer) => {
        strokeRoundRect(layer, boardX, boardY, boardW, boardH, 25, 4, parseColor('#ffffff'), 0.28);
    }, 8);
    fillRoundRectRadial(img, boardX, boardY, boardW, boardH, 25, BOARD_X + CELL * 1.5, BOARD_Y + CELL * 1.5, CELL * 2, 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.30)');
    strokeRoundRect(img, boardX, boardY, boardW, boardH, 25, 3, parseColor('#ffffff'), 1);

   
    const gridColor = parseColor('rgba(255,255,255,0.6)');
    for (let i = 1; i < 3; i++) {
        drawThickLine(img, BOARD_X + i * CELL, BOARD_Y, BOARD_X + i * CELL, BOARD_Y + 3 * CELL, 3, gridColor, 1);
        drawThickLine(img, BOARD_X, BOARD_Y + i * CELL, BOARD_X + 3 * CELL, BOARD_Y + i * CELL, 3, gridColor, 1);
    }

    const remaining = countRemainingPositions(boardArr);
    const showButtons = remaining <= 5 && remaining > 0 && !game.isFinished;
    const buttons = [];

    
    for (let i = 0; i < 9; i++) {
        const symbol = boardArr[i];
        const cellX = BOARD_X + (i % 3) * CELL;
        const cellY = BOARD_Y + Math.floor(i / 3) * CELL;
        const centerX = cellX + CELL / 2;
        const centerY = cellY + CELL / 2;

        if (symbol === 'X') {
            drawX(img, cellX, cellY, CELL, p1Color, true);
        } else if (symbol === 'O') {
            drawO(img, cellX, cellY, CELL, p2Color, true);
        } else if (showButtons) {
            const bx = centerX - 25;
            const by = centerY - 25;
            fillRoundRectRadial(img, bx, by, 50, 50, 15, centerX, centerY, 25, 'rgba(102,126,234,0.8)', 'rgba(118,75,162,0.8)');
            glowShape(img, (layer) => {
                strokeRoundRect(layer, bx, by, 50, 50, 15, 2.5, parseColor('#667eea'), 1);
            }, 6);
            strokeRoundRect(img, bx, by, 50, 50, 15, 2, parseColor('#ffffff'), 1);
            printCentered(img, fonts.lg, String(i + 1), centerX, centerY);
            buttons.push({ number: i + 1, x: bx, y: by, width: 50, height: 50 });
        } else if (showHelp) {
            printCentered(img, fonts.lg, String(i + 1), centerX, centerY, 0.4);
        }
    }

   
    if (game.isFinished && game.winningLine) {
        const [start, , end] = game.winningLine;
        const sx = BOARD_X + (start % 3) * CELL + CELL / 2;
        const sy = BOARD_Y + Math.floor(start / 3) * CELL + CELL / 2;
        const ex = BOARD_X + (end % 3) * CELL + CELL / 2;
        const ey = BOARD_Y + Math.floor(end / 3) * CELL + CELL / 2;
        const winnerColor = boardArr[start] === 'X' ? p1Color : p2Color;

        glowShape(img, (layer) => {
            drawThickLine(layer, sx, sy, ex, ey, 30, winnerColor, 1);
        }, 14);

        drawThickLine(img, sx, sy, ex, ey, 30, winnerColor, 0.4);
        drawThickLine(img, sx, sy, ex, ey, 12, parseColor('#ffffff'), 0.9);
        drawThickLine(img, sx, sy, ex, ey, 6, winnerColor, 1);
    }

    const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
    return { buffer, buttons: showButtons ? buttons : [] };
}

class TrisGame {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.board = Array(9).fill(null);
        this.turn = p1;
        this.isFinished = false;
        this.winningLine = null;
    }

    move(pos) {
        if (pos < 0 || pos > 8 || this.board[pos] || this.isFinished) {
            return false;
        }
        this.board[pos] = this.turn === this.p1 ? 'X' : 'O';
        this.turn = this.turn === this.p1 ? this.p2 : this.p1;
        return true;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return { winner: this.board[a], line: pattern };
            }
        }
        if (!this.board.includes(null)) {
            return { winner: 'draw', line: null };
        }
        return null;
    }
}

const games = new Map();
const timeoutMap = new Map();
const playerStats = new Map();

const getNameFromJid = jid => jid.split('@')[0];

const getSafeName = async (conn, jid) => {
    try {
        const name = await Promise.resolve(conn.getName ? conn.getName(jid) : null);
        if (typeof name === 'string' && name) return name;
    } catch {}
    return getNameFromJid(jid);
};

const updatePlayerStats = (jid, won = false, played = true) => {
    if (!playerStats.has(jid)) {
        playerStats.set(jid, { wins: 0, games: 0, streak: 0 });
    }
    const stats = playerStats.get(jid);
    if (played) stats.games++;
    if (won) {
        stats.wins++;
        stats.streak++;
    } else if (played) {
        stats.streak = 0;
    }
};

const getPlayerStats = (jid) => {
    return playerStats.get(jid) || { wins: 0, games: 0, streak: 0 };
};

const getVictoryMessage = (winner, loser) => {
    const messages = [
        `${winner} 𝐡𝐚 𝐬𝐜𝐨𝐧𝐟𝐢𝐭𝐭𝐨 ${loser}, 𝐜𝐨𝐦𝐩𝐥𝐢𝐦𝐞𝐧𝐭𝐢! 🏆`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};



const sendGameMessage = async (conn, chat, game, status, isFirstMessage = false) => {
    const p1Name = await getSafeName(conn, game.p1);
    const p2Name = await getSafeName(conn, game.p2);
    const p1Pic = await conn.profilePictureUrl(game.p1, 'image').catch(() => null);
    const p2Pic = await conn.profilePictureUrl(game.p2, 'image').catch(() => null);

    const { buffer, buttons } = await renderBoard(
        game.isFinished ? '𝐏𝐀𝐑𝐓𝐈𝐓𝐀 𝐓𝐄𝐑𝐌𝐈𝐍𝐀𝐓𝐀.' : '𝐏𝐀𝐑𝐓𝐈𝐓𝐀 𝐈𝐍 𝐂𝐎𝐑𝐒𝐎',
        p1Name,
        p2Name,
        game,
        status,
        p1Pic,
        p2Pic,
        isFirstMessage
    );

    let movesGuide = '';
    if (isFirstMessage) {
        movesGuide += `╭─────────╮\n │\`🎮 𝐏𝐀𝐑𝐓𝐈𝐓𝐀 𝐈𝐍𝐈𝐙𝐈𝐀𝐓𝐀!\`\n │🔢 𝐑𝐢𝐬𝐩𝐨𝐧𝐝𝐢 𝐜𝐨𝐧 𝐮𝐧 𝐧𝐮𝐦𝐞𝐫𝐨 𝐝𝐚 𝟏 𝐚 𝟗\n │\n`;
    }

    if (!game.isFinished) {
        const currentPlayerName = await getSafeName(conn, game.turn);
        const remainingMoves = countRemainingPositions(game.board);
        movesGuide += ` │ 👤 𝐄̀ 𝐢𝐥 𝐭𝐮𝐫𝐧𝐨 𝐝𝐢: *${currentPlayerName}*\n`;
        movesGuide += ` │ 🕹️ 𝐌𝐨𝐬𝐬𝐞 𝐫𝐢𝐦𝐚𝐧𝐞𝐧𝐭𝐢: *${remainingMoves}*\n │\n`;
        if (buttons.length > 0) {
            movesGuide += ` │ ⌨️ 𝐔𝐬𝐚 𝐢 𝐛𝐨𝐭𝐭𝐨𝐧𝐢 𝐬𝐨𝐭𝐭𝐨𝐬𝐭𝐚𝐧𝐭𝐢 𝐨 𝐫𝐢𝐬𝐩𝐨𝐧𝐝𝐢 𝐜𝐨𝐧 𝐮𝐧 𝐧𝐮𝐦𝐞𝐫𝐨!\n`;
        }
    }

    movesGuide += ` │ 👥 𝐆𝐢𝐨𝐜𝐚𝐭𝐨𝐫𝐢:\n` +
        ` │ *${p1Name}*: ❌ 𝐂𝐫𝐨𝐜𝐞\n` +
        ` │ *${p2Name}*: ⭕ 𝐂𝐞𝐫𝐜𝐡𝐢𝐨:\n │\n` +
        ` │ ⌛️ 𝟒𝟓 𝐬𝐞𝐜𝐨𝐧𝐝𝐢 𝐝𝐢𝐬𝐩𝐨𝐧𝐢𝐛𝐢𝐥𝐢 𝐩𝐞𝐫 𝐦𝐨𝐬𝐬𝐚\n╰─────────╯`;

    if (buttons.length > 0) {
        const buttonList = buttons.map(btn => ({
            buttonId: `tris_move_${btn.number}`,
            buttonText: { displayText: btn.number.toString() },
            type: 1
        }));
        await conn.sendMessage(chat, {
            image: buffer,
            caption: movesGuide,
            mentions: [game.p1, game.p2],
            footer: '𝟴𝟴𝟴 𝗕𝗢𝗧',
            buttons: buttonList,
            headerType: 4
        });
    } else {
        await conn.sendMessage(chat, {
            image: buffer,
            caption: movesGuide,
            mentions: [game.p1, game.p2]
        });
    }
};



let handler = async (m, { conn }) => {
    const { chat, sender, mentionedJid, quoted } = m;
    let opponent;
    if (mentionedJid?.length > 0) {
        opponent = mentionedJid[0];
    } else if (quoted) {
        opponent = quoted.sender;
    } else {
        return m.reply('𝐃𝐞𝐯𝐢 𝐭𝐚𝐠𝐠𝐚𝐫𝐞 𝐪𝐮𝐚𝐥𝐜𝐮𝐧𝐨 𝐩𝐞𝐫 𝐠𝐢𝐨𝐜𝐚𝐫𝐞!\n𝐄𝐬𝐞𝐦𝐩𝐢𝐨: .𝐭𝐫𝐢𝐬 @𝐮𝐬𝐞𝐫');
    }

    if (opponent === sender) return m.reply('𝐒𝐩𝐢𝐞𝐠𝐚, 𝐜𝐨𝐦𝐞 𝐟𝐚𝐢 𝐚 𝐠𝐢𝐨𝐜𝐚𝐫𝐞 𝐝𝐚 𝐬𝐨𝐥𝐨/𝐚?😅');
    if (opponent === conn.user.jid) return m.reply('𝐢𝐥 𝐠𝐢𝐨𝐫𝐧𝐨 𝐢𝐧 𝐜𝐮𝐢 𝐝𝐢𝐯𝐞𝐧𝐭𝐞𝐫𝐨̀ 𝐮𝐦𝐚𝐧𝐨 𝐠𝐢𝐨𝐜𝐡𝐞𝐫𝐞𝐦𝐨😅');
    if (games.has(chat)) return m.reply('𝐂’𝐞̀ 𝐠𝐢𝐚̀ 𝐮𝐧𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚 𝐢𝐧 𝐜𝐨𝐫𝐬𝐨! 𝐀𝐭𝐭𝐞𝐧𝐝𝐢 𝐜𝐡𝐞 𝐟𝐢𝐧𝐢𝐬𝐜𝐚 𝐩𝐫𝐢𝐦𝐚 𝐝𝐢 𝐢𝐧𝐢𝐳𝐢𝐚𝐫𝐧𝐞 𝐮𝐧𝐚 𝐧𝐮𝐨𝐯𝐚.');

    const game = new TrisGame(sender, opponent);
    games.set(chat, game);
    await sendGameMessage(conn, chat, game, `╭─────────╮\n👤 𝐓𝐮𝐫𝐧𝐨 𝐝𝐢: ${await getSafeName(conn, sender)}`, true);

    clearTimeout(timeoutMap.get(chat));
    timeoutMap.set(chat, setTimeout(async () => {
        if (games.has(chat) && !games.get(chat).isFinished) {
            const currentGame = games.get(chat);
            const loser = currentGame.turn;
            const winner = loser === currentGame.p1 ? currentGame.p2 : currentGame.p1;
            updatePlayerStats(loser, false, true);
            updatePlayerStats(winner, true, true);
            games.delete(chat);
            conn.sendMessage(chat, {
                text: `╭─────────╮\n │ ⏰ 𝐓𝐄𝐌𝐏𝐎 𝐒𝐂𝐀𝐃𝐔𝐓𝐎!\n │\n` +
                    ` │ ⌛️${await getSafeName(conn, loser)} 𝐡𝐚 𝐬𝐮𝐩𝐞𝐫𝐚𝐭𝐨 𝟒𝟓 𝐬𝐞𝐜𝐨𝐧𝐝𝐢!\n` +
                    ` │ 🏆 𝐕𝐢𝐧𝐜𝐢𝐭𝐨𝐫𝐞: ${await getSafeName(conn, winner)}! \n╰─────────╯`,
                mentions: [loser, winner]
            });
        }
    }, 45000));
};

handler.before = async (m, { conn }) => {
    const { chat, sender, text, isButtonResponse } = m;
    if (!games.has(chat)) return;

    const game = games.get(chat);
    if (sender !== game.turn || game.isFinished) return;

    let pos;
    const buttonPayload = (m.buttonId || text || '').toString();
    if (buttonPayload.startsWith('tris_move_')) {
        pos = parseInt(buttonPayload.replace('tris_move_', '')) - 1;
    } else if (/^[1-9]$/.test(text)) {
        pos = parseInt(text) - 1;
    } else {
        return;
    }

    if (!game.move(pos)) return m.reply('𝐌𝐨𝐬𝐬𝐚 𝐞𝐫𝐫𝐚𝐭𝐚!\n𝐒𝐞𝐥𝐞𝐳𝐢𝐨𝐧𝐚 𝐬𝐨𝐥𝐨 𝐮𝐧 𝐧𝐮𝐦𝐞𝐫𝐨 𝐝𝐚 𝟏 𝐚 𝟗 𝐞 𝐥𝐞 𝐜𝐚𝐬𝐞𝐥𝐥𝐞 𝐥𝐢𝐛𝐞𝐫𝐞!');

    let result = game.checkWin();
    let status = '';

    if (result) {
        game.isFinished = true;
        if (result.winner === 'draw') {
            status = '𝐏𝐚𝐫𝐞𝐠𝐠𝐢𝐨!\n𝐍𝐞𝐬𝐬𝐮𝐧𝐨 𝐡𝐚 𝐯𝐢𝐧𝐭𝐨, 𝐥𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚 𝐞̀ 𝐟𝐢𝐧𝐢𝐭𝐚 𝐢𝐧 𝐩𝐚𝐫𝐢𝐭𝐚̀.';
            updatePlayerStats(game.p1, false, true);
            updatePlayerStats(game.p2, false, true);
        } else {
            const winner = result.winner === 'X' ? game.p1 : game.p2;
            const loser = result.winner === 'X' ? game.p2 : game.p1;
            const winnerName = await getSafeName(conn, winner);
            const loserName = await getSafeName(conn, loser);
            status = getVictoryMessage(winnerName, loserName);
            game.winningLine = result.line;
            updatePlayerStats(winner, true, true);
            updatePlayerStats(loser, false, true);
        }
    } else {
        const currentPlayerName = await getSafeName(conn, game.turn);
        const remainingMoves = countRemainingPositions(game.board);
        status = `╭─────────╮\n👤 𝐓𝐮𝐫𝐧𝐨 𝐝𝐢: ${currentPlayerName} - 𝐑𝐢𝐦𝐚𝐧𝐠𝐨𝐧𝐨 𝐚𝐧𝐜𝐨𝐫𝐚 ${remainingMoves} 𝐦𝐨𝐬𝐬𝐞`;
    }

    await sendGameMessage(conn, chat, game, status);
    clearTimeout(timeoutMap.get(chat));

    if (game.isFinished) {
        games.delete(chat);
        if (result && result.winner !== 'draw') {
            const winner = result.winner === 'X' ? game.p1 : game.p2;
            const loser = result.winner === 'X' ? game.p2 : game.p1;
            const winnerStats = getPlayerStats(winner);
            const loserStats = getPlayerStats(loser);
            setTimeout(async () => {
                await conn.sendMessage(chat, {
                    text: `╭─────────╮\n │ 𝐏𝐀𝐑𝐓𝐈𝐓𝐀 𝐓𝐄𝐑𝐌𝐈𝐍𝐀𝐓𝐀! 🎮\n╰─────────╯\n` +
                        `╭─────────╮\n │ 🏆 𝐕𝐢𝐧𝐜𝐢𝐭𝐨𝐫𝐞: *${await getSafeName(conn, winner)}*\n` +
                        ` │ 🎖️ ${winnerStats.wins}/${winnerStats.games} 𝐯𝐢𝐭𝐭𝐨𝐫𝐢𝐞 (${Math.round((winnerStats.wins/winnerStats.games)*100)}%)\n` +
                        ` │ 🥉 𝐒𝐜𝐨𝐧𝐟𝐢𝐭𝐭𝐨: *${await getSafeName(conn, loser)}*\n` +
                        ` │ 🎖️ ${loserStats.wins}/${loserStats.games} 𝐯𝐢𝐭𝐭𝐨𝐫𝐢𝐞 (${Math.round((loserStats.wins/loserStats.games)*100)}%)\n╰─────────╯\n` +
                        `𝐮𝐬𝐚 𝐢𝐥 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 ’’.𝐭𝐫𝐢𝐬’’ 𝐩𝐞𝐫 𝐜𝐨𝐦𝐢𝐧𝐜𝐢𝐚𝐫𝐞 𝐮𝐧𝐚 𝐧𝐮𝐨𝐯𝐚 𝐩𝐚𝐫𝐭𝐢𝐭𝐚\n> 𝟴𝟴𝟴 𝗕𝗢𝗧`,
                    mentions: [winner, loser]
                });
            }, 2000);
        }
    } else {
        timeoutMap.set(chat, setTimeout(async () => {
            if (games.has(chat) && !games.get(chat).isFinished) {
                const currentGame = games.get(chat);
                const loser = currentGame.turn;
                const winner = loser === currentGame.p1 ? currentGame.p2 : currentGame.p1;
                updatePlayerStats(loser, false, true);
                updatePlayerStats(winner, true, true);
                games.delete(chat);
                conn.sendMessage(chat, {
                    text: `╭─────────╮\n │ ⏰ 𝐓𝐄𝐌𝐏𝐎 𝐒𝐂𝐀𝐃𝐔𝐓𝐎!\n │\n` +
                        ` │ ⌛️${await getSafeName(conn, loser)} 𝐡𝐚 𝐬𝐮𝐩𝐞𝐫𝐚𝐭𝐨 𝟒𝟓 𝐬𝐞𝐜𝐨𝐧𝐝𝐢!\n` +
                        ` │ 🏆 𝐕𝐢𝐧𝐜𝐢𝐭𝐨𝐫𝐞: ${await getSafeName(conn, winner)}! \n╰─────────╯`,
                    mentions: [loser, winner]
                });
            }
        }, 45000));
    }
};

handler.command = ['tris'];
handler.help = ['𝐭𝐫𝐢𝐬 @𝐭𝐚𝐠'];
handler.tags = ['fun'];
handler.group = true;

export default handler;
