// ===== ギャンブラー・アバター生成（カジノチップ型マスコット） =====
// 4文字コード [賭け金B/S][判断L/I][感情H/C][動機W/F] から
// 色・目・眉・口を組み立てて、16体すべて見分けがつくSVGを返す。

(function (global) {
  "use strict";

  // タイプごとのチップ色
  const AV_COLORS = {
    BLHW: "#ff5a3c", BLHF: "#ff8a3d", BLCW: "#3a3f63", BLCF: "#c79a4b",
    BIHW: "#ff4d6d", BIHF: "#ff7ab8", BICW: "#f2b705", BICF: "#5b8def",
    SLHW: "#4a8fe0", SLHF: "#2bb3a3", SLCW: "#8a8f9c", SLCF: "#b08968",
    SIHW: "#3bb46e", SIHF: "#ff9f1c", SICW: "#5fbf4f", SICF: "#9a7be0",
  };

  const INK = "#2b2d42";
  const FACE = "#fff7ec";
  const MOUTH = "#c0445a";
  const BLUSH = "#ff9eb1";

  // 目：論理(L)=メガネ / 直感(I)=キラキラ
  function eyes(mind) {
    if (mind === "L") {
      return (
        // メガネ
        '<g stroke="' + INK + '" stroke-width="2.6" fill="rgba(255,255,255,.4)">' +
        '<circle cx="46" cy="57" r="11"/>' +
        '<circle cx="74" cy="57" r="11"/>' +
        '<line x1="57" y1="56" x2="63" y2="56"/>' +
        "</g>" +
        '<circle cx="46" cy="58" r="3.4" fill="' + INK + '"/>' +
        '<circle cx="74" cy="58" r="3.4" fill="' + INK + '"/>'
      );
    }
    // キラキラ目
    return (
      '<g fill="' + INK + '">' +
      '<circle cx="47" cy="57" r="8"/>' +
      '<circle cx="73" cy="57" r="8"/>' +
      "</g>" +
      '<g fill="#ffffff">' +
      '<circle cx="44.5" cy="54.5" r="2.6"/>' +
      '<circle cx="70.5" cy="54.5" r="2.6"/>' +
      '<circle cx="49" cy="59" r="1.3"/>' +
      '<circle cx="75" cy="59" r="1.3"/>' +
      "</g>" +
      // きらめき
      '<path d="M86 40 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#ffd86b"/>'
    );
  }

  // 眉：勝ち(W)=キリッ / 楽しさ(F)=にっこり上がり
  function brows(goal) {
    if (goal === "W") {
      return (
        '<g stroke="' + INK + '" stroke-width="3" stroke-linecap="round">' +
        '<line x1="38" y1="42" x2="53" y2="46"/>' +
        '<line x1="82" y1="42" x2="67" y2="46"/>' +
        "</g>"
      );
    }
    return (
      '<g stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round">' +
      '<path d="M39 44 q7 -5 14 -1"/>' +
      '<path d="M81 44 q-7 -5 -14 -1"/>' +
      "</g>"
    );
  }

  // 口：感情(H/C) × 動機(W/F) で4種
  function mouth(heat, goal) {
    if (heat === "H" && goal === "W") {
      // 気合いの雄叫び
      return (
        '<path d="M50 74 q10 14 20 0 q-10 6 -20 0z" fill="' + MOUTH + '"/>' +
        '<path d="M52 75 q8 4 16 0z" fill="#fff"/>'
      );
    }
    if (heat === "H" && goal === "F") {
      // 大笑い
      return (
        '<path d="M48 73 q12 16 24 0z" fill="' + MOUTH + '"/>' +
        '<path d="M50 74 q10 4 20 0z" fill="#fff"/>'
      );
    }
    if (heat === "C" && goal === "W") {
      // ニヤリ（不敵）
      return '<path d="M52 79 q9 5 17 -2" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    // 冷静×楽しさ：穏やかな笑み
    return '<path d="M51 77 q9 7 18 0" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  // 大胆(B)=ほっぺに気合の集中線 / 動機Fでほお染め
  function extras(bet, goal) {
    let s = "";
    if (goal === "F") {
      s +=
        '<ellipse cx="34" cy="68" rx="5" ry="3" fill="' + BLUSH + '" opacity=".8"/>' +
        '<ellipse cx="86" cy="68" rx="5" ry="3" fill="' + BLUSH + '" opacity=".8"/>';
    }
    if (bet === "B") {
      // 勢いを表す小さな三本線
      s +=
        '<g stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".85">' +
        '<line x1="14" y1="40" x2="22" y2="40"/>' +
        '<line x1="12" y1="48" x2="21" y2="48"/>' +
        '<line x1="14" y1="56" x2="22" y2="56"/>' +
        "</g>";
    }
    return s;
  }

  function avatar(code, size) {
    const rim = AV_COLORS[code] || "#6c63ff";
    const px = size || 120;
    const m = (code || "").toUpperCase();
    const bet = m[0], mind = m[1], heat = m[2], goal = m[3];

    return (
      '<svg viewBox="0 0 120 120" width="' + px + '" height="' + px +
      '" role="img" aria-label="' + code + ' キャラクター" xmlns="http://www.w3.org/2000/svg">' +
      // チップ本体
      '<circle cx="60" cy="60" r="56" fill="' + rim + '"/>' +
      // 縁のギザギザ（チップらしさ）
      '<circle cx="60" cy="60" r="52.5" fill="none" stroke="#ffffff" stroke-width="6" stroke-dasharray="5 12.6" opacity=".9"/>' +
      // 顔
      '<circle cx="60" cy="60" r="39" fill="' + FACE + '"/>' +
      extras(bet, goal) +
      brows(goal) +
      eyes(mind) +
      mouth(heat, goal) +
      "</svg>"
    );
  }

  global.gamblerAvatar = avatar;

  // 画像優先版：chars/コード.png があればその画像、無ければSVGアバターにフォールバック。
  // 画像を chars/ に置くだけで自動的に切り替わる。
  function visual(code, size) {
    const px = size || 120;
    return (
      '<img class="char-img" src="chars/' + code + '.png" alt="' + code +
      '" width="' + px + '" height="' + px +
      '" onerror="this.outerHTML=gamblerAvatar(\'' + code + '\',' + px + ')">'
    );
  }
  global.gamblerVisual = visual;
})(window);
