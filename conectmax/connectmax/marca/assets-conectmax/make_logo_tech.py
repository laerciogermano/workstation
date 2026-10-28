"""Gera o logo CONECTTECH a partir dos PNGs oficiais ConectMax.

Troca só MAX por TECH: T, E e C são recortados do próprio CONECT (mesma fonte);
o H é montado com a inclinação e a espessura de haste medidas no N e a barra do meio do E.
A cor de TECH é amostrada linha a linha do MAX original (preserva gradiente/brilho).
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SS = 4  # supersampling do H


def components(alpha, min_h):
    lab, _ = nd.label(alpha > 40)
    out = []
    for i, s in enumerate(nd.find_objects(lab)):
        h = s[0].stop - s[0].start
        if h >= min_h:
            out.append(dict(id=i + 1, x0=s[1].start, x1=s[1].stop, y0=s[0].start, y1=s[0].stop))
    return lab, sorted(out, key=lambda c: c['x0'])


def glyph_mask(alpha, lab, ids):
    m = np.isin(lab, ids)
    m = nd.binary_dilation(m, iterations=2)  # inclui a borda antialiased
    return np.where(m, alpha, 0).astype(np.float32)


def crop(mask):
    ys, xs = np.nonzero(mask > 0)
    return mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1], xs.min(), ys.min()


def left_edge_fit(alpha_bin, x0, x1, ys):
    pts = []
    for y in ys:
        r = np.nonzero(alpha_bin[y, x0:x1])[0]
        if len(r):
            pts.append((y, x0 + r[0]))
    pts = np.array(pts, float)
    b, a = np.polyfit(pts[:, 0], pts[:, 1], 1)
    return a, b  # x = a + b*y


def run(src, dst, word_h_frac=0.12):
    im = Image.open(src).convert('RGBA')
    a = np.array(im).astype(np.float32)
    alpha = a[..., 3]
    H, W = alpha.shape
    lab, comps = components(alpha, int(H * word_h_frac))
    # letras grandes: as 6 de CONECT (E inferior conta como 1) + 3 de MAX; o globo é descartado
    letters = [c for c in comps if (c['x1'] - c['x0']) < W * 0.2]
    ytop = min(c['y0'] for c in letters)
    ybot = max(c['y1'] for c in letters)
    letters = [c for c in letters if c['y1'] >= ybot - 3]
    assert len(letters) >= 8, (src, len(letters))
    C1, O, N, E, C2, T = letters[:6]
    MAXc = letters[6:]
    M = MAXc[0]
    max_ids = [c['id'] for c in MAXc]
    # barra superior do E (componente separado, acima do corpo do E)
    lab_all, comps_all = components(alpha, 1)
    etop = [c for c in comps_all if c['y0'] <= ytop + 3 and c['y1'] < E['y0'] + 2
            and E['x0'] - 5 <= c['x0'] < C2['x0'] and c['id'] != E['id']
            and (c['x1'] - c['x0']) > (E['x1'] - E['x0']) * 0.3]
    e_ids = [E['id']] + [c['id'] for c in etop]

    mT, tx, _ = crop(glyph_mask(alpha, lab, [T['id']]))
    mE, ex, _ = crop(glyph_mask(alpha, lab_all, e_ids) if etop else glyph_mask(alpha, lab, e_ids))
    mC, cx, _ = crop(glyph_mask(alpha, lab, [C2['id']]))
    # todas as letras ocupam ytop..ybot (E inferior começa mais baixo, mas a barra sobe até ytop)
    def full_h(m, x0, ids, labm):
        mm = glyph_mask(alpha, labm, ids)[ytop:ybot]
        xs = np.nonzero(mm.max(0) > 0)[0]
        return mm[:, xs.min():xs.max() + 1], xs.min()
    mT, tx = full_h(mT, tx, [T['id']], lab)
    mE, ex = full_h(mE, ex, e_ids, lab_all if etop else lab)
    mC, cx = full_h(mC, cx, [C2['id']], lab)

    # ---- H sintético: haste = haste esquerda do N; barra = barra do meio do E
    ab = (lab == N['id']) & (alpha > 128)
    abE = (lab == E['id']) & (alpha > 128)
    hh = ybot - ytop
    ys = range(ytop + int(hh * 0.25), ytop + int(hh * 0.75))
    la, lb = left_edge_fit(ab, N['x0'], N['x1'], ys)
    # espessura da haste do N (corrida na metade inferior, antes da diagonal)
    widths = []
    for y in range(ytop + int(hh * 0.15), ytop + int(hh * 0.3)):
        r = np.nonzero(ab[y, N['x0']:N['x1']])[0]
        if len(r):
            xl = la + lb * y
            run_ = 0
            for x in range(int(round(xl)), N['x1']):
                if ab[y, x]: run_ += 1
                elif run_: break
            widths.append(run_)
    # haste: menor corrida estável (no topo a diagonal ainda está colada)
    ys2 = range(ytop + int(hh * 0.55), ytop + int(hh * 0.95))
    sw = []
    for y in ys2:
        x = int(round(la + lb * y)) - 2
        while x < N['x1'] and not ab[y, x]: x += 1
        s = x
        while x < N['x1'] and ab[y, x]: x += 1
        sw.append(x - s)
    stem = float(np.median(sw))
    # largura do H = largura do N (borda esq da haste esq até borda dir da haste dir)
    right_edges = []
    for y in ys:
        r = np.nonzero(ab[y, N['x0']:N['x1']])[0]
        if len(r): right_edges.append(N['x0'] + r[-1] + 1 - (la + lb * y))
    hw = float(np.median(right_edges))
    # barra do meio do E: linhas onde o corpo do E é largo, na metade superior do corpo
    erows = []
    for y in range(E['y0'], E['y0'] + (E['y1'] - E['y0']) // 2):
        if abE[y, E['x0']:E['x1']].sum() > (E['x1'] - E['x0']) * 0.6:
            erows.append(y)
    bar0, bar1 = min(erows), max(erows) + 1
    # desenha em supersampling
    w_canvas = int(hw + abs(lb) * hh + 4)
    big = np.zeros((hh * SS, w_canvas * SS), np.float32)
    yy, xx = np.mgrid[0:hh * SS, 0:w_canvas * SS]
    yb = (yy + 0.5) / SS + ytop
    xb = (xx + 0.5) / SS
    # x da borda esquerda relativo: na base (ybot) fica em 0
    off = -lb * (ybot - yb)  # lb < 0 para itálico: quanto mais alto, mais à direita
    left = off
    inside_l = (xb >= left) & (xb < left + stem)
    inside_r = (xb >= left + hw - stem) & (xb < left + hw)
    inside_b = (xb >= left) & (xb < left + hw) & (yb >= bar0) & (yb < bar1)
    big[inside_l | inside_r | inside_b] = 255
    mH = big.reshape(hh, SS, w_canvas, SS).mean((1, 3))
    xs = np.nonzero(mH.max(0) > 0)[0]
    mH = mH[:, xs.min():xs.max() + 1]

    # ---- espaçamento: mesma distância mínima entre letras do CONECT (C2 -> T)
    # espaçamento medido na vertical "desinclinada" (remove o itálico): caixa a caixa
    sh = -lb

    def extent(m, x):
        ys_, xs__ = np.nonzero(m > 128)
        xd = x + xs__ + sh * ys_  # topo vai mais à direita no itálico -> desloca a base
        return xd.min(), xd.max()

    def gap(ma, xa, mb, xb_):
        return extent(mb, xb_)[0] - extent(ma, xa)[1]
    ref_gap = gap(mC, cx, mT, tx)

    def place_after(prev_m, prev_x, m, g):
        return g - gap(prev_m, prev_x, m, 0)

    glyphs = [mT, mE, mC, mH]
    m_full = glyph_mask(alpha, lab, [M['id']])[ytop:ybot]
    mx = np.nonzero(m_full.max(0) > 0)[0].min()
    tm_gap = gap(mT, tx, m_full[:, mx:], mx)  # T -> M no original
    xs_ = [int(round(place_after(mT, tx, mT, tm_gap)))]
    for i in range(1, 4):
        xs_.append(int(round(place_after(glyphs[i - 1], xs_[i - 1], glyphs[i], ref_gap))))
    pass  # print('gaps', ref_gap, tm_gap, 'xs', xs_, [g.shape for g in glyphs], 'tx', tx, 'ex', ex, 'cx', cx)
    end = xs_[-1] + mH.shape[1]

    # ---- cor de TECH: média por linha do MAX
    mm = np.isin(lab, max_ids)[ytop:ybot]
    rgb = a[ytop:ybot, :, :3]
    rowcol = np.zeros((hh, 3), np.float32)
    rowa = np.zeros(hh, np.float32)
    for y in range(hh):
        sel = mm[y] & (a[ytop + y, :, 3] > 200)
        if sel.any():
            rowcol[y] = rgb[y][sel].mean(0); rowa[y] = a[ytop + y, :, 3][sel].mean()
    valid = rowa > 0
    for c in range(3):
        rowcol[:, c] = np.interp(np.arange(hh), np.nonzero(valid)[0], rowcol[valid, c])
    peak = np.interp(np.arange(hh), np.nonzero(valid)[0], rowa[valid]) / 255.0

    # ---- monta a imagem nova
    newW = max(W, end + (W - max(c['x1'] for c in MAXc)) + 2)
    out = np.zeros((H, newW, 4), np.float32)
    out[:, :W] = a
    # apaga MAX
    kill = nd.binary_dilation(np.isin(lab, max_ids), iterations=2)
    out[:, :W, 3][kill] = 0
    layer = np.zeros((hh, newW), np.float32)
    for m, x in zip(glyphs, xs_):
        x = int(x)
        layer[:, x:x + m.shape[1]] = np.maximum(layer[:, x:x + m.shape[1]], m)
    la_ = layer / 255.0 * peak[:, None]
    reg = out[ytop:ybot]
    base_a = reg[..., 3] / 255.0
    na = la_ + base_a * (1 - la_)
    for c in range(3):
        reg[..., c] = np.where(na > 0, (rowcol[:, None, c] * la_ + reg[..., c] * base_a * (1 - la_)) / np.maximum(na, 1e-6), reg[..., c])
    reg[..., 3] = na * 255
    out[ytop:ybot] = reg
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
    print(dst, 'stem', stem, 'hw', hw, 'slant', lb, 'bar', bar0, bar1, 'size', newW, H)


if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 0.12)
