import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader } from "../components/ui/sheet";
import { Button } from "../components/ui";
import { cn } from "../lib/utils";
import type { FeedbackType } from "../types/theme";
import type { CSSVariables } from "../utils/themeToCSS";

export interface ButtonConfigType {
  name: string;
  handleAction?: () => void;
}

/** 테마 피드백 스타일 구분 (correct/incorrect/explanation). essay는 explanation 사용 */
export type FeedbackStyleVariant = "correct" | "incorrect" | "explanation";

const SHEET_SECTION_ICONS: Partial<Record<string, React.ComponentType<{ className?: string }>>> = {
  HINT: Lightbulb,
};

const SHEET_SECTION_DEFAULT_LABELS: Partial<Record<string, string>> = {
  HINT: "힌트",
};

interface FeedbackSheetProps {
  /** 샘플 모드 여부 */
  /** 미리보기 시 custom 사용, 평가 시 Sheet(portal) 사용 */
  isSample: boolean;
  /** 피드백 타입 (CORRECT, WRONG, EXPLANATION) */
  type: FeedbackType;
  /** 피드백 제목 */
  title: ReactNode;
  /** 피드백 설명 (선택) */
  description?: React.ReactNode;
  /** HINT 등 섹션 표시 시 라벨 (있으면 아이콘+라벨 행 표시) */
  typeLabel?: string;
  /** typeLabel 표시 시 사용할 아이콘 타입 (기본: type) */
  sectionType?: string;
  /** 테마 스타일 구분. 지정 시 type 대신 이 값으로 CSS 클래스 적용 (essay는 explanation) */
  styleVariant?: FeedbackStyleVariant;
  /** 시트 열림 상태 */
  open: boolean;
  /** 시트 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 버튼 설정 배열 */
  buttons: ButtonConfigType[];
  /** 테마 CSS 변수 */
  themeVariables?: CSSVariables;
}

export const FeedbackSheet = ({
  isSample = false,
  type,
  title,
  open,
  onOpenChange,
  description,
  typeLabel,
  sectionType,
  styleVariant,
  buttons,
  themeVariables,
}: FeedbackSheetProps) => {
  const typeClassMap: Record<FeedbackType, string> = {
    CORRECT: "correct",
    INCORRECT: "incorrect",
    SOLUTION: "correct",
    HINT: "incorrect",
    TRANSLATION: "correct",
    SAMPLE_ANSWER: "explanation",
    SCRIPT: "explanation",
  };

  const typeClass = styleVariant ?? typeClassMap[type];

  const showSectionHead = type === "HINT" || (typeLabel !== undefined && typeLabel !== "");
  const sectionIconType = sectionType ?? type;
  const iconComponent = showSectionHead ? SHEET_SECTION_ICONS[sectionIconType] : undefined;
  const sectionLabel = typeLabel ?? (type === "HINT" ? SHEET_SECTION_DEFAULT_LABELS.HINT : null);

  const renderSectionHead =
    showSectionHead &&
    sectionLabel !== undefined &&
    (() => {
      const Icon = iconComponent;
      if (Icon === undefined) return null;
      return (
        <div className="qti-ext-feedback-section">
          <div className="qti-ext-feedback-section-head">
            <span className="qti-ext-feedback-section-icon" aria-hidden>
              <Icon className="qti-ext-feedback-section-icon-svg" />
            </span>
            <span className="qti-ext-feedback-section-label">{sectionLabel}</span>
          </div>
        </div>
      );
    })();

  const renderButtons = () => (
    <div className="qti-ext-feedback-footer">
      <div className="qti-ext-feedback-buttons">
        {buttons.map((button, index) => {
          const isPrimary = index === 0;
          const isSecondary = index === 1;

          return (
            <Button
              key={button.name}
              className={cn(
                "qti-ext-feedback-button",
                isPrimary && `qti-ext-feedback-button-primary`,
                isSecondary && `qti-ext-feedback-button-secondary`
              )}
              style={
                isPrimary || isSecondary
                  ? undefined
                  : {
                      // Fallback to default button styles for buttons beyond primary/secondary
                    }
              }
              onClick={() => {
                button.handleAction?.();
              }}
            >
              {button.name}
            </Button>
          );
        })}
      </div>
    </div>
  );

  if (isSample) {
    if (!open) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        aria-describedby={description ? "feedback-description" : undefined}
        data-state={open ? "open" : "closed"}
        className={cn("qti-ext-feedback-sheet", `qti-ext-feedback-${typeClass}`)}
        style={themeVariables as React.CSSProperties}
      >
        <div className="rtqi:mx-auto rtqi:w-full rtqi:max-w-[520px] rtqi:px-5">
          <h2 className={cn("qti-ext-feedback-title", `qti-ext-feedback-title-${typeClass}`)}>
            {title}
          </h2>
          {renderSectionHead}
          {description &&
            (typeof description === "string" ? (
              <div
                className="qti-ext-feedback-description"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <div className="qti-ext-feedback-description">{description}</div>
            ))}
          {renderButtons()}
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "qti-ext-feedback-sheet",
          `qti-ext-feedback-${typeClass}`,
          "rtqi:[&_[data-state=closed]]:hidden",
          "rtqi:[&>button]:hidden"
        )}
        style={themeVariables as React.CSSProperties}
      >
        <div className="rtqi:mx-auto rtqi:w-full rtqi:max-w-[520px] rtqi:px-5">
          <SheetHeader
            className={cn("rtqi:p-0!", "qti-ext-feedback-title", `qti-ext-feedback-title-${typeClass}`)}
          >
            {title}
          </SheetHeader>
          {renderSectionHead}
          <SheetDescription>
            {description &&
              (typeof description === "string" ? (
                <div
                  className="qti-ext-feedback-description"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <div className="qti-ext-feedback-description">{description}</div>
              ))}
          </SheetDescription>
          {renderButtons()}
        </div>
      </SheetContent>
    </Sheet>
  );
};
