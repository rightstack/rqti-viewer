import postcss from "postcss";
import type { Plugin } from "vite";

const SCOPE = ".rqti-viewer";
const ANCESTOR_ATTR_RE =
  /^(\[(?:data-device|data-item-detail-split)(?:=[^\]]*)?\])(\s+|$)/;
/** `.rqti-*`는 매칭하지 않음. `img.qti-ext-image`처럼 태그+클래스는 매칭함. */
const QTI_CLASS_RE = /\.qti-/;
const KEYFRAME_RE = /^(\d+%|from|to)$/i;

export function scopeQtiSelector(
  selector: string,
  options: { onlyQtiClasses?: boolean } = {},
): string {
  const s = selector.trim();
  if (!s || KEYFRAME_RE.test(s)) return selector;
  if (s.includes(SCOPE)) return selector;
  if (options.onlyQtiClasses && !QTI_CLASS_RE.test(s)) return selector;

  const ancestor = s.match(ANCESTOR_ATTR_RE);
  if (ancestor) {
    return `${ancestor[1]} ${SCOPE}${s.slice(ancestor[1].length)}`;
  }
  return `${SCOPE} ${s}`;
}

export function scopeQtiCss(
  css: string,
  options: { onlyQtiClasses?: boolean } = {},
): string {
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) {
      return;
    }
    rule.selectors = rule.selectors.map((selector) =>
      scopeQtiSelector(selector, options),
    );
  });
  return root.toString();
}

const QTI_SOURCE_RE = /(?:^|[\\/])(qti|qti-ext)\.css(?:\?|$)/;

/** qti.css / qti-ext.css 셀렉터를 `.rqti-viewer` 하위로 스코프한다. */
export function scopeQtiCssPlugin(): Plugin {
  return {
    name: "scope-qti-css",
    enforce: "post",
    transform(code, id) {
      const file = id.split("?")[0].replace(/\\/g, "/");
      if (!QTI_SOURCE_RE.test(file)) return null;
      return { code: scopeQtiCss(code), map: null };
    },
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== "asset" || !item.fileName.endsWith(".css")) continue;
        const source =
          typeof item.source === "string"
            ? item.source
            : Buffer.from(item.source).toString("utf8");
        item.source = scopeQtiCss(source, { onlyQtiClasses: true });
      }
    },
  };
}
