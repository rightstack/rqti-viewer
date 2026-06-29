import React from "react";
import { getNodeKey } from "../utils/getNodeKey";
import { AudioPlayer } from "../components/AudioPlayer";
import type { QTIParserOptions } from "../types";
import { resolveMediaUrl } from "../utils/urlUtils";
import { wrapMathFieldTextForInlineLatex } from "../utils/wrapMathFieldTextForInlineLatex";
import { buildImageStyle } from "./imageUtils";
import { parseTextWithLaTeX } from "./parseLatexToReact";

function parseCssString(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx < 0) continue;
    const prop = decl.slice(0, colonIdx).trim();
    const value = decl.slice(colonIdx + 1).trim();
    if (!prop || !value) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[camel] = value;
  }
  return style;
}

const VOID_ELEMENTS = new Set<string>([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// parseHTMLElement와 동일 정책: 텍스트 노드 공백 보존 (null/undefined만 제외)
function isIgnorableText(node: ChildNode) {
  return (
    node.nodeType === Node.TEXT_NODE &&
    (node.textContent === null || node.textContent === undefined)
  );
}

// function hasMediaDescendants(el: Element): boolean {
//   return el.querySelector("img, audio, video") !== null;
// }

export function renderQtiNode(node: ChildNode, options?: QTIParserOptions): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (text === null || text === undefined) return null;
    // LaTeX 수식 파싱 (인라인 $...$ 및 블록 $$...$$ 지원)
    const parsed = parseTextWithLaTeX(text, getNodeKey(node));
    return parsed.length === 1 && typeof parsed[0] === "string" ? parsed[0] : parsed;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;

    const tagNameRaw = el.tagName.toLowerCase();
    const tagName = tagNameRaw.startsWith("qti-") ? "div" : tagNameRaw;

    const className = el.getAttribute("class") ?? "";
    const stableKey = getNodeKey(el);
    const isMathField = className.includes("qti-ext-mathfield");

    // qti-ext-mathfield 요소: 내부 텍스트를 $...$로 감싸서 LaTeX 파싱
    if (isMathField) {
      const wrappedText = wrapMathFieldTextForInlineLatex(el.textContent ?? "");
      if (wrappedText) {
        const parsed = parseTextWithLaTeX(wrappedText, `mathfield-${stableKey}`);
        const props: Record<string, unknown> = { key: stableKey };
        if (className) props.className = className;
        return React.createElement("span", props, parsed);
      }
    }

    // img: SVG는 token 없이 그대로, 그 외는 resolveMediaUrl + token
    if (tagName === "img") {
      const src = el.getAttribute("src");
      const alt = el.getAttribute("alt");
      const width = el.getAttribute("width");
      const height = el.getAttribute("height");
      const isSvg =
        typeof src === "string" &&
        (src.startsWith("data:image/svg+xml") || /\.svg(\?|#|$)/i.test(src));
      const resolvedSrc = resolveMediaUrl(src, options?.baseUrl);
      const finalSrc = isSvg
        ? (src ?? undefined)
        : resolvedSrc
          ? `${resolvedSrc}?t=${options?.token ?? ""}`
          : undefined;
      const imgClassName = className.includes("qti-ext-image")
        ? className
        : `${className} qti-ext-image`.trim();

      const imgStyle = buildImageStyle(width ?? undefined, height ?? undefined);

      return (
        <img
          key={stableKey}
          className={imgClassName}
          src={finalSrc}
          alt={alt ?? undefined}
          style={Object.keys(imgStyle).length > 0 ? imgStyle : undefined}
        />
      );
    }

    // audio: parseHtmlElement와 동일하게 token 추가, AudioPlayer 사용
    if (tagName === "audio") {
      const src = el.getAttribute("src");
      const alt = el.getAttribute("alt");
      const resolvedSrc = resolveMediaUrl(src, options?.baseUrl);
      const srcWithToken = resolvedSrc ? `${resolvedSrc}?t=${options?.token ?? ""}` : undefined;
      if (!srcWithToken) return null;
      return (
        <AudioPlayer
          key={stableKey}
          src={srcWithToken}
          title={alt ?? undefined}
          theme={options?.theme}
        />
      );
    }

    // video: parseHtmlElement와 동일하게 token 추가
    if (tagName === "video") {
      const src = el.getAttribute("src");
      const resolvedSrc = resolveMediaUrl(src, options?.baseUrl);
      const srcWithToken = resolvedSrc ? `${resolvedSrc}?t=${options?.token ?? ""}` : undefined;
      const hasControls = el.hasAttribute("controls");
      const childNodes = Array.from(el.childNodes).filter((child) => !isIgnorableText(child));
      const children = childNodes.map((child) => (
        <React.Fragment key={getNodeKey(child)}>{renderQtiNode(child, options)}</React.Fragment>
      ));
      return (
        <video
          key={stableKey}
          className={className ? `${className} qti-ext-video` : "qti-ext-video"}
          src={srcWithToken}
          controls={hasControls}
          controlsList="nodownload"
        >
          {children}
          <track kind="captions" />
        </video>
      );
    }

    // 그 외 요소: 속성 복사 후 재귀
    const props: Record<string, unknown> = { key: stableKey };
    if (className) props.className = className;
    // const hasMedia = hasMediaDescendants(el);
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === "class") continue;
      if (attr.name === "style") {
        props.style = parseCssString(attr.value);
        continue;
      }
      props[attr.name] = attr.value;
      if (attr.name === "identifier") {
        props.className = [props.className, "w-full min-w-0"].filter(Boolean).join(" ");
      }
    }

    const childNodes = Array.from(el.childNodes).filter((child) => !isIgnorableText(child));

    if (VOID_ELEMENTS.has(tagName)) {
      return React.createElement(tagName, props);
    }

    const childEls = childNodes.map((child) => (
      <React.Fragment key={getNodeKey(child)}>{renderQtiNode(child, options)}</React.Fragment>
    ));

    return React.createElement(tagName, props, childEls);
  }

  return null;
}
