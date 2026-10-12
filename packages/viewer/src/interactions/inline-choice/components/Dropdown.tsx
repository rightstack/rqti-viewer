import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { MediaContent } from "../../../shared";
import { parseInputWidth } from "../../../themes";
import type { DropdownOptionType } from "../../../types";

function dropdownOptionLabel(option: DropdownOptionType, token?: string): ReactNode {
  if (option.content !== undefined) {
    return <div className="qti-ext-dropdown-rich-label">{option.content}</div>;
  }
  return (
    <>
      {option.text && <span>{option.text}</span>}
      {option.media && <MediaContent media={option.media} token={token} />}
    </>
  );
}

interface DropdownProps {
  options: DropdownOptionType[];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  showCorrectAnswer?: boolean;
  showAnswerFeedback?: boolean;
  isCorrect?: boolean;
  isPreview?: boolean;
  hideArrow?: boolean;
  onChange: (value: string) => void;
  inputWidth?: string;
  isAlone?: boolean;
  token?: string;
}

export const Dropdown = ({
  options,
  value,
  placeholder = "선택하세요",
  disabled = false,
  showCorrectAnswer = false,
  showAnswerFeedback = false,
  isCorrect = false,
  isPreview = false,
  hideArrow = false,
  onChange,
  inputWidth,
  isAlone = false,
  token,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // width 처리: 옵션 최대 길이에 따라 자동 확장, inputWidth가 있으면 minWidth로 사용
  const { style: widthStyle } = parseInputWidth(inputWidth, 2);

  const isIncorrect = showAnswerFeedback && !isCorrect;
  const isSelected = !!value;
  const isDisabledState = disabled || showCorrectAnswer || showAnswerFeedback;
  /** preview일 때는 비활성 스타일 미적용(일관성), 동작만 막음 */
  const showDisabledStyle = isDisabledState && !isPreview;

  const selectedOption = options.find((opt) => opt.identifier === value);
  const useWrappedMenu = options.length >= 5;

  /**
   * 옵션 텍스트 + placeholder 중 가장 "픽셀 너비"가 큰 문자열 (드롭다운 너비용)
   *
   * 기존은 .length 기반이라 영문/한글 폭 차이 때문에 실제 렌더 폭을 보장하지 못했습니다.
   * 여기서는 DOM의 폰트/letter-spacing을 기준으로 canvas measureText를 사용합니다.
   */
  const [longestOptionText, setLongestOptionText] = useState(() => {
    const texts = [placeholder, ...options.map((o) => o?.text ?? "").filter(Boolean)].filter(
      Boolean
    );
    if (texts.length === 0) return "\u00A0";
    // 초기값은 안전하게 length 기반으로 채워둔 뒤, useLayoutEffect에서 픽셀 기준으로 교체합니다.
    return texts.reduce((a, b) => (a.length >= b.length ? a : b));
  });

  useLayoutEffect(() => {
    const dropdownEl = dropdownRef.current;
    if (!dropdownEl) return;

    const fontEl = dropdownEl.querySelector(".qti-ext-dropdown-trigger .qti-ext-dropdown-content");

    if (!fontEl) return;

    const candidates = Array.from(
      new Set(
        [placeholder, ...options.map((o) => o?.text ?? "").filter(Boolean)]
          .filter(Boolean)
          .filter((t): t is string => typeof t === "string" && t.length > 0)
      )
    );

    let bestText = "\u00A0";

    if (candidates.length > 0) {
      const cs = window.getComputedStyle(fontEl);
      const letterSpacingPx = parseFloat(cs.letterSpacing || "");
      const letterSpacing = Number.isFinite(letterSpacingPx) ? letterSpacingPx : 0;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

        bestText = candidates[0];
        let bestWidth = -Infinity;

        for (const t of candidates) {
          const measured = ctx.measureText(t).width;
          const letterSpacingExtra = letterSpacing * Math.max(0, t.length - 1);
          const w = measured + letterSpacingExtra;
          if (w > bestWidth) {
            bestWidth = w;
            bestText = t;
          }
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLongestOptionText(bestText);
  }, [placeholder, options]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 아래로 펼치되 화면을 넘으면 옵션 박스를 하단에 맞추고 내부 스크롤을 사용합니다.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const menu = menuRef.current;
    if (!menu) return;
    const dropdown = dropdownRef.current;
    if (!dropdown) return;

    const positionMenu = () => {
      const scrollTop = menu.scrollTop;
      menu.style.setProperty("--qti-dropdown-menu-offset-y", "0px");
      menu.style.removeProperty("--qti-dropdown-menu-max-height");
      menu.style.setProperty("--qti-dropdown-menu-offset-x", "0px");
      menu.style.removeProperty("width");
      menu.style.removeProperty("min-width");
      menu.style.removeProperty("max-width");

      const viewportPadding = 16;
      const questionContainer = dropdown.closest<HTMLElement>(".qti-ext-question");
      const deviceContainer = dropdown.closest<HTMLElement>("[data-device]");
      const questionBounds = questionContainer?.getBoundingClientRect();
      const deviceBounds = deviceContainer?.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      const boundary = questionBounds ??
        deviceBounds ?? {
          left: visualViewport?.offsetLeft ?? 0,
          right: (visualViewport?.offsetLeft ?? 0) + (visualViewport?.width ?? window.innerWidth),
          width: visualViewport?.width ?? window.innerWidth,
        };

      const scaleX =
        deviceContainer && deviceContainer.offsetWidth > 0
          ? deviceBounds!.width / deviceContainer.offsetWidth
          : 1;
      const scaleY =
        deviceContainer && deviceContainer.offsetHeight > 0
          ? deviceBounds!.height / deviceContainer.offsetHeight
          : 1;
      const horizontalPadding = viewportPadding * scaleX;

      if (useWrappedMenu) {
        const availableWidth = Math.max(0, (boundary.width - horizontalPadding * 2) / scaleX);
        const maxMenuWidth = Math.min(384, availableWidth);
        const minMenuWidth = Math.min(dropdown.offsetWidth, maxMenuWidth);
        menu.style.minWidth = `${minMenuWidth}px`;
        menu.style.maxWidth = `${maxMenuWidth}px`;

        const initialMenuRect = menu.getBoundingClientRect();
        const optionRects = Array.from(
          menu.querySelectorAll<HTMLElement>(".qti-ext-dropdown-option")
        ).map((option) => option.getBoundingClientRect());

        if (optionRects.length > 0) {
          const leftInset =
            Math.min(...optionRects.map((option) => option.left)) - initialMenuRect.left;
          const usedRight =
            Math.max(...optionRects.map((option) => option.right)) - initialMenuRect.left;
          const balancedWidth = (usedRight + leftInset) / scaleX;
          const compactWidth = Math.min(maxMenuWidth, Math.max(minMenuWidth, balancedWidth));

          menu.style.width = `${compactWidth}px`;
        }
      }

      const triggerRect = dropdown.getBoundingClientRect();
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      let visibleTop = visualViewport?.offsetTop ?? 0;
      let visibleBottom = visibleTop + viewportHeight;

      for (let parent = dropdown.parentElement; parent; parent = parent.parentElement) {
        if (parent === document.scrollingElement) break;
        const { overflowY } = window.getComputedStyle(parent);
        if (!/(auto|scroll|hidden|clip)/.test(overflowY)) continue;
        const bounds = parent.getBoundingClientRect();
        const parentScaleY = parent.offsetHeight > 0 ? bounds.height / parent.offsetHeight : 1;
        const top = bounds.top + parent.clientTop * parentScaleY;
        visibleTop = Math.max(visibleTop, top);
        visibleBottom = Math.min(visibleBottom, top + parent.clientHeight * parentScaleY);
      }

      const verticalPadding = viewportPadding * scaleY;
      const availableHeight = Math.max(0, visibleBottom - visibleTop - verticalPadding * 2);
      menu.style.setProperty(
        "--qti-dropdown-menu-max-height",
        `${Math.min(viewportHeight * 0.8, availableHeight) / scaleY}px`
      );
      menu.scrollTop = scrollTop;

      const rect = menu.getBoundingClientRect();
      const minTop = visibleTop + verticalPadding;
      const maxTop = Math.max(minTop, visibleBottom - verticalPadding - rect.height);
      const adjustedTop = Math.max(minTop, Math.min(rect.top, maxTop));
      menu.style.setProperty(
        "--qti-dropdown-menu-offset-y",
        `${(adjustedTop - rect.top) / scaleY}px`
      );
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;
      const triggerPosition = (triggerCenterX - boundary.left) / boundary.width;
      const preferredLeft =
        triggerPosition < 1 / 3
          ? triggerRect.left
          : triggerPosition > 2 / 3
            ? triggerRect.right - rect.width
            : triggerCenterX - rect.width / 2;
      const minLeft = boundary.left + horizontalPadding;
      const maxLeft = boundary.right - horizontalPadding - rect.width;
      const adjustedLeft = Math.min(Math.max(preferredLeft, minLeft), Math.max(minLeft, maxLeft));
      const offsetX = (adjustedLeft - rect.left) / scaleX;

      menu.style.setProperty("--qti-dropdown-menu-offset-x", `${offsetX}px`);
    };

    const handleScroll = (event: Event) => {
      if (event.target !== menu) positionMenu();
    };

    positionMenu();
    const observer = new ResizeObserver(positionMenu);
    observer.observe(dropdown);
    menu.querySelectorAll(".qti-ext-dropdown-option-content").forEach((option) => {
      observer.observe(option);
    });
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", handleScroll, true);
    window.visualViewport?.addEventListener("resize", positionMenu);
    window.visualViewport?.addEventListener("scroll", positionMenu);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", handleScroll, true);
      window.visualViewport?.removeEventListener("resize", positionMenu);
      window.visualViewport?.removeEventListener("scroll", positionMenu);
    };
  }, [isOpen, useWrappedMenu, options]);

  const handleToggle = () => {
    if (isPreview) return;
    setIsOpen(!isOpen);
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const triggerClassName = cn(
    "qti-ext-dropdown-trigger",
    isSelected && !showAnswerFeedback && "qti-ext-dropdown-trigger-selected",
    showAnswerFeedback && isCorrect && "qti-ext-dropdown-trigger-correct",
    isIncorrect && "qti-ext-dropdown-trigger-incorrect",
    // showDisabledStyle && "qti-ext-dropdown-trigger-disabled",
    (showCorrectAnswer || showAnswerFeedback) && "rqti:text-center",
    isSelected && "qti-ext-dropdown-trigger-has-value"
  );

  const containerStyle: CSSProperties = widthStyle?.width
    ? { minWidth: widthStyle.width }
    : { ...widthStyle };

  return (
    <div
      className={cn(
        "qti-ext-dropdown",
        "qti-ext-dropdown-auto-width",
        isAlone && "is-alone",
        hideArrow && "qti-ext-dropdown--no-arrow"
      )}
      style={containerStyle}
      ref={dropdownRef}
    >
      <div className="qti-ext-dropdown-sizer" aria-hidden>
        <div className="qti-ext-dropdown-content">{longestOptionText}</div>
        {!hideArrow && (
          <span className="qti-ext-dropdown-arrow">
            <ChevronDownIcon className="qti-ext-dropdown-arrow-icon" />
          </span>
        )}
      </div>
      <div
        role="button"
        tabIndex={showDisabledStyle ? -1 : 0}
        className={triggerClassName}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-disabled={showDisabledStyle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="qti-ext-dropdown-content">
          {selectedOption ? dropdownOptionLabel(selectedOption, token) : <span>{placeholder}</span>}
        </div>
        {!hideArrow && (
          <span className="qti-ext-dropdown-arrow">
            <ChevronDownIcon
              className={cn(
                "qti-ext-dropdown-arrow-icon",
                isOpen && "qti-ext-dropdown-arrow-icon-open"
              )}
            />
          </span>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn("qti-ext-dropdown-menu", useWrappedMenu && "qti-ext-dropdown-menu-wrapped")}
          role="listbox"
        >
          {options.map((option) => (
            <div
              key={option.identifier}
              className={cn(
                "qti-ext-dropdown-option",
                value === option.identifier && "qti-ext-dropdown-option-selected"
              )}
              role="option"
              aria-selected={value === option.identifier}
              onClick={() => handleSelect(option.identifier)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(option.identifier);
                }
              }}
              tabIndex={0}
            >
              <div className="qti-ext-dropdown-option-content">
                {dropdownOptionLabel(option, token)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
