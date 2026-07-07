import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui";
import { cn } from "../lib/utils";
import type { CSSVariables } from "../utils/themeToCSS";

export interface ButtonConfigType {
  name: string;
  handleAction?: () => void;
}

interface FeedbackModalProps {
  /** 샘플 모드 여부 */
  /** 미리보기 시 custom 사용, 평가 시 Dialog(portal) 사용 */
  isSample: boolean;
  /** 피드백 제목 */
  title: ReactNode;
  /** 피드백 설명 (선택) */
  description?: React.ReactNode;
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 버튼 설정 배열 */
  buttons: ButtonConfigType[];
  /** 테마 CSS 변수 */
  themeVariables?: CSSVariables;
}

export const FeedbackModal = ({
  isSample = false,
  title,
  open,
  onOpenChange,
  description,
  buttons,
  themeVariables,
}: FeedbackModalProps) => {
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
      <div className="rtqi:absolute rtqi:inset-0 rtqi:z-100">
        {/* Backdrop */}
        <div
          className="rtqi:absolute rtqi:inset-0 rtqi:bg-black/50"
          role="button"
          tabIndex={0}
          aria-label="Close modal"
          onClick={() => onOpenChange(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenChange(false);
            }
          }}
        />
        {/* Modal Content */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          aria-describedby={description ? "feedback-description" : undefined}
          data-state={open ? "open" : "closed"}
          className={cn("qti-ext-feedback-modal", "qti-ext-feedback-explanation")}
          style={themeVariables as React.CSSProperties}
        >
          <div className="qti-ext-feedback-modal-content">
            <div className="rtqi:flex-shrink-0">
              <h2 className={cn("qti-ext-feedback-title")}>{title}</h2>
            </div>

            {/* 내용 영역 - flex-1으로 확장 가능, 스크롤 가능. description이 문자열이면 HTML로, 아니면 React 노드로 렌더 */}
            {typeof description === "string" ? (
              <div
                id="feedback-description"
                className="qti-ext-feedback-description rtqi:flex-1 rtqi:overflow-y-auto"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: description || "해설 내용입니다." }}
              />
            ) : (
              <div
                id="feedback-description"
                className="qti-ext-feedback-description rtqi:flex-1 rtqi:overflow-y-auto"
              >
                {description ?? "해설 내용입니다."}
              </div>
            )}
            {/* 버튼 영역 - flex-shrink-0으로 고정 */}
            <div className="rtqi:flex-shrink-0">{renderButtons()}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("qti-ext-feedback-modal", "rtqi:max-w-lg")}
        style={themeVariables as React.CSSProperties}
      >
        <DialogHeader>
          <DialogTitle className={cn("qti-ext-feedback-title")}>{title}</DialogTitle>

        {typeof description === "string" ? (
          <DialogDescription
            className="qti-ext-feedback-description"
            asChild
          >
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: description || "해설 내용입니다." }}
            />
          </DialogDescription>
        ) : (
          <DialogDescription className="qti-ext-feedback-description">
            {description ?? "해설 내용입니다."}
          </DialogDescription>
        )}
        </DialogHeader>
        {renderButtons()}
      </DialogContent>
    </Dialog>
  );
};
