import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface FixedScaleContainerProps {
  /**
   * 저작 기준 고정 폭(px). 콘텐츠는 항상 이 폭으로 렌더되며, 사용 가능한 폭에 맞춰
   * transform: scale()로만 크기가 바뀐다. 화이트보드 필기 등 오버레이는 이 폭을
   * 좌표계로 사용하면 폭이 달라져도 항상 정합된다.
   */
  designWidth: number;
  /** 확대 상한. 지정하면 scale이 이 값을 넘지 않는다(예: 1 = 원본 이상 확대 금지). */
  maxScale?: number;
  /**
   * designWidth 좌표계 위에 겹칠 오버레이(예: 화이트보드 캔버스).
   * 콘텐츠와 동일한 스케일 안에 놓여 좌표가 함께 변환된다.
   */
  overlay?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * 고정 폭 + Scale 컨테이너.
 *
 * 내부 콘텐츠를 `designWidth` 고정 폭으로 렌더한 뒤, 바깥 폭을 측정해
 * `transform: scale(availableWidth / designWidth)`을 적용한다. 스케일은 레이아웃
 * 박스 크기에 영향을 주지 않으므로, 바깥 래퍼 높이를 `naturalHeight * scale`로
 * 잡아 주변 흐름이 깨지지 않게 한다.
 */
export function FixedScaleContainer({
  designWidth,
  maxScale,
  overlay,
  className,
  children,
}: FixedScaleContainerProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);

  const update = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const availWidth = outer.clientWidth;
    if (availWidth > 0 && designWidth > 0) {
      let next = availWidth / designWidth;
      if (maxScale != null && next > maxScale) next = maxScale;
      setScale((prev) => (Math.abs(prev - next) < 0.0001 ? prev : next));
    }

    // transform: scale은 offsetHeight(레이아웃 높이)에 영향을 주지 않으므로 자연 높이로 사용
    const naturalHeight = inner.offsetHeight;
    setInnerHeight((prev) => (Math.abs(prev - naturalHeight) < 0.5 ? prev : naturalHeight));
  }, [designWidth, maxScale]);

  useLayoutEffect(() => {
    update();

    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const observer = new ResizeObserver(() => update());
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [update]);

  const outerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    overflow: "hidden",
  };

  const spacerStyle: CSSProperties = {
    height: innerHeight * scale,
  };

  const innerStyle: CSSProperties = {
    position: "relative",
    width: designWidth,
    transformOrigin: "top left",
    transform: `scale(${scale})`,
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: designWidth,
  };

  return (
    <div ref={outerRef} className={className} style={outerStyle} data-rtqi-scale-outer="">
      <div style={spacerStyle}>
        <div ref={innerRef} style={innerStyle} data-rtqi-scale-inner="">
          {children}
          {overlay != null && (
            <div style={overlayStyle} data-rtqi-scale-overlay="">
              {overlay}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FixedScaleContainer;
