/**
 * parseHTMLElement
 * 역할: HTML 요소 파싱 및 자식 노드 재귀 처리
 * - HTML 요소를 React 요소로 변환
 * - 자식 노드를 재귀적으로 처리 (HTML 요소, 텍스트, 중첩된 interaction)
 * - 스타일 없이 순수하게 HTML 구조만 반환
 */
import React from "react";
import { AudioPlayer } from "../components/AudioPlayer";
import { parseTextIndent } from "../themes/utils";
import type { QTIParserOptions } from "../types";
import { resolveMediaUrl } from "../utils/urlUtils";
import { wrapMathFieldTextForInlineLatex } from "../utils/wrapMathFieldTextForInlineLatex";
import { isInteraction } from "./constants";
import { buildImageStyle } from "./imageUtils";
import { groupListItems } from "./listGrouping";
import { parseNode } from "./parseInteraction";
import { parseTextWithLaTeX } from "./parseLatexToReact";

interface MediaAttributes {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  loading?: string;
  controls?: boolean;
}

export const parseHTMLElement = (
  element: Element,
  options: QTIParserOptions,
  index: number,
  parentTagName?: string
): React.ReactElement | null => {
  const tagName = element.tagName.toLowerCase();
  const className = element.getAttribute("class") || element.getAttribute("className") || "";

  if (tagName === "br") {
    return <br key={`br-${index}`} />;
  }

  // 요소 내부에 qti-inline-choice-interaction만 단독으로 있는지 확인 (자식 처리 전에 원본 element 확인)
  const hasOnlyInlineChoiceInteraction = (): boolean => {
    const childNodes = Array.from(element.childNodes);
    // 공백이 아닌 텍스트 노드나 다른 요소가 있는지 확인
    const meaningfulNodes = childNodes.filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() !== "";
      }
      return node.nodeType === Node.ELEMENT_NODE;
    });

    // 의미있는 노드가 정확히 1개이고, 그것이 qti-inline-choice-interaction인 경우
    if (meaningfulNodes.length === 1 && meaningfulNodes[0].nodeType === Node.ELEMENT_NODE) {
      const onlyChild = meaningfulNodes[0] as Element;
      return onlyChild.tagName.toLowerCase() === "qti-inline-choice-interaction";
    }

    return false;
  };

  // 자식 노드 처리 (HTML 요소, 텍스트, interaction 처리)
  const children: Array<React.ReactElement | string> = [];

  // qti-ext-mathfield 클래스를 가진 요소는 내부 텍스트를 $...$로 감싸서 LaTeX 파싱
  const isMathField = className?.includes("qti-ext-mathfield");

  element.childNodes.forEach((child, idx) => {
    if (child.nodeType === Node.TEXT_NODE) {
      // 텍스트 노드는 공백을 보존해야 함 (요소 사이의 공백이 의미가 있을 수 있음)
      const text = child.textContent;
      // 완전히 빈 텍스트 노드만 제외
      if (text !== null && text !== undefined) {
        // qti-ext-mathfield 클래스를 가진 요소 내부 텍스트는 LaTeX 파싱
        if (isMathField) {
          const mathText = wrapMathFieldTextForInlineLatex(text);
          if (mathText) {
            const parsedText = parseTextWithLaTeX(mathText, `mathfield-${index}-${idx}`);
            children.push(...parsedText);
          }
        } else {
          // LaTeX 수식이 포함된 텍스트 처리 (SAX 방식)
          const parsedText = parseTextWithLaTeX(text, `text-${index}-${idx}`);
          children.push(...parsedText);
        }
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const childElement = child as Element;
    const childTagName = childElement.tagName.toLowerCase();

    const childKeyBase = `el-${index}-${idx}`;
    if (isInteraction(childTagName)) {
      const parsed = parseNode(childElement, options, idx);
      if (parsed) {
        const keyed =
          React.isValidElement(parsed) && parsed.key === null
            ? React.cloneElement(parsed, { key: childKeyBase })
            : parsed;
        children.push(keyed);
      }
      return;
    }

    const parsed = parseHTMLElement(childElement, options, idx, tagName);
    if (parsed) {
      const keyed =
        React.isValidElement(parsed) && parsed.key === null
          ? React.cloneElement(parsed, { key: childKeyBase })
          : parsed;
      children.push(keyed);
    }
  });

  // Stable unique keys without using map index. parseTextWithLaTeX returns keyed elements.
  let childKeySeq = 0;
  const processedChildren = children.map((child) => {
    if (typeof child === "string") {
      childKeySeq += 1;
      return <React.Fragment key={`str-${index}-n${childKeySeq}`}>{child}</React.Fragment>;
    }
    if (React.isValidElement(child) && child.key === null) {
      childKeySeq += 1;
      return React.cloneElement(child, { key: `child-${index}-n${childKeySeq}` });
    }
    return child;
  });

  // 미디어 태그 속성 추출 헬퍼
  const getMediaAttributes = (): MediaAttributes => {
    const src = element.getAttribute("src");
    const alt = element.getAttribute("alt");
    const width = element.getAttribute("width");
    const height = element.getAttribute("height");
    const loading = element.getAttribute("loading");

    return {
      src: src ? resolveMediaUrl(src, options?.baseUrl) : undefined,
      alt: alt ?? undefined,
      width: width ?? undefined,
      height: height ?? undefined,
      loading: loading ?? undefined,
      controls: element.hasAttribute("controls") ?? false,
    };
  };
  // source 태그 속성 추출 헬퍼
  const getSourceAttributes = () => {
    const attributes: Record<string, string | undefined> = {};
    const src = element.getAttribute("src");
    const type = element.getAttribute("type");
    const srcset = element.getAttribute("srcset");
    const media = element.getAttribute("media");

    if (src) attributes.src = resolveMediaUrl(src, options?.baseUrl);
    if (type) attributes.type = type;
    if (srcset) attributes.srcSet = srcset;
    if (media) attributes.media = media;

    return attributes;
  };

  // track 태그 속성 추출 헬퍼
  const getTrackAttributes = () => {
    const attributes: Record<string, string | boolean | undefined> = {};
    const kind = element.getAttribute("kind");
    const src = element.getAttribute("src");
    const srclang = element.getAttribute("srclang");
    const label = element.getAttribute("label");
    const hasDefault = element.hasAttribute("default");

    if (kind) attributes.kind = kind;
    if (src) attributes.src = resolveMediaUrl(src, options?.baseUrl);
    if (srclang) attributes.srcLang = srclang;
    if (label) attributes.label = label;
    attributes.default = hasDefault;

    return attributes;
  };

  switch (tagName) {
    case "div": {
      // div 내부에 qti-inline-choice-interaction만 단독으로 있는 경우 클래스 추가
      const hasOnlyDropdownDiv = hasOnlyInlineChoiceInteraction();
      const divClassName = hasOnlyDropdownDiv
        ? `${className} has-block-inline-choice`.trim()
        : className;

      const groupedChildren = groupListItems(processedChildren);

      return (
        <div key={`div-${index}`} className={divClassName}>
          {groupedChildren}
        </div>
      );
    }
    case "span":
      return (
        <span key={`span-${index}`} className={className}>
          {processedChildren}
        </span>
      );
    case "p":
      // p 태그 안에 p 태그가 들어가는 것을 방지
      // 부모가 p 태그이고 자식도 p 태그인 경우 span으로 감싸기
      if (parentTagName === "p") {
        return (
          <span key={`span-${index}`} className={className}>
            {processedChildren}
          </span>
        );
      }

      // p 태그 내부에 qti-inline-choice-interaction만 단독으로 있는 경우 div로 변환
      const hasOnlyDropdown = hasOnlyInlineChoiceInteraction();

      if (hasOnlyDropdown) {
        return (
          <div key={`p-${index}`} className={`${className} has-block-inline-choice`.trim()}>
            {processedChildren}
          </div>
        );
      }

      // qti-text-indent / indent-first(행잉) / outdent-first(첫줄 양수 ti) → 인라인 style
      const textIndent = parseTextIndent(className);
      const finalPClassName = textIndent.className
        ? `${className} ${textIndent.className}`.trim()
        : className;

      const dataListStart = element.getAttribute("data-list-start");

      return (
        <p
          key={`p-${index}`}
          className={finalPClassName}
          style={textIndent.style}
          data-list-start={dataListStart ?? undefined}
        >
          {processedChildren.length === 0 ? "\u00A0" : processedChildren}
        </p>
      );
    case "b":
      return <b key={`b-${index}`}>{processedChildren}</b>;
    case "u":
      return <u key={`u-${index}`}>{processedChildren}</u>;
    case "i":
      return <i key={`i-${index}`}>{processedChildren}</i>;
    case "strong":
      return <strong key={`strong-${index}`}>{processedChildren}</strong>;
    case "em":
      return <em key={`em-${index}`}>{processedChildren}</em>;
    case "sup":
      return (
        <sup key={`sup-${index}`} className={className}>
          {processedChildren}
        </sup>
      );
    case "sub":
      return (
        <sub key={`sub-${index}`} className={className}>
          {processedChildren}
        </sub>
      );
    case "blockquote": {
      // 01-26 시연용 코드 추후 개선 필요
      // blockquote 내부의 모든 태그, 텍스트 제거
      const textContent = "";
      const parsedText = parseTextWithLaTeX(textContent, `blockquote-${index}`);
      return (
        <blockquote key={`blockquote-${index}`} className={className}>
          {parsedText}
        </blockquote>
      );
    }
    // 01-26 시연용 코드 추후 개선 필요
    // 이미지 class에 py-4 제거
    case "img": {
      const mediaAttrs = getMediaAttributes();
      const imgClassName = className.includes("qti-ext-image")
        ? className
        : `${className} qti-ext-image`.trim();

      const imgStyle = buildImageStyle(mediaAttrs.width, mediaAttrs.height);
      const srcWithToken = `${mediaAttrs.src}?t=${options.token}`;

      return (
        <img
          key={`img-${index}`}
          className={imgClassName}
          src={srcWithToken}
          alt={mediaAttrs.alt}
          style={Object.keys(imgStyle).length > 0 ? imgStyle : undefined}
        />
      );
    }
    case "video": {
      const mediaAttrs = getMediaAttributes();
      const videoSrcWithToken = mediaAttrs.src ? `${mediaAttrs.src}?t=${options.token}` : undefined;
      return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          key={`video-${index}`}
          className={className}
          src={videoSrcWithToken}
          controls={mediaAttrs.controls ?? false}
          controlsList="nodownload"
        >
          {processedChildren}
        </video>
      );
    }
    case "audio": {
      const mediaAttrs = getMediaAttributes();
      const audioSrcWithToken = mediaAttrs.src ? `${mediaAttrs.src}?t=${options.token}` : undefined;
      const title = mediaAttrs.alt ?? undefined;
      if (!audioSrcWithToken) return null;
      return (
        <AudioPlayer
          key={`audio-${index}`}
          src={audioSrcWithToken}
          title={title}
          theme={options.theme}
        />
      );
    }
    case "source": {
      const sourceAttrs = getSourceAttributes();
      return (
        <source
          key={`source-${index}`}
          className={className}
          src={sourceAttrs.src}
          type={sourceAttrs.type}
          srcSet={sourceAttrs.srcSet}
          media={sourceAttrs.media}
        />
      );
    }
    case "track": {
      const trackAttrs = getTrackAttributes();
      return (
        <track
          key={`track-${index}`}
          className={className}
          kind={trackAttrs.kind as string | undefined}
          src={trackAttrs.src as string | undefined}
          srcLang={trackAttrs.srcLang as string | undefined}
          label={trackAttrs.label as string | undefined}
          default={trackAttrs.default as boolean}
        />
      );
    }
    case "figure":
      return (
        <figure key={`figure-${index}`} className={className}>
          {processedChildren}
        </figure>
      );
    case "figcaption":
      return (
        <figcaption key={`figcaption-${index}`} className={className}>
          {processedChildren}
        </figcaption>
      );
    default:
      // 알 수 없는 태그는 span으로 렌더링 (p 대신 - 중첩 방지)
      return (
        <span key={`span-${index}`} className={className}>
          {processedChildren}
        </span>
      );
  }
};
