import { Button } from "../components/ui";
import { cn } from "../lib/utils";

interface SubmitButtonProps {
  /** 제출 가능 여부 */
  canSubmit?: boolean;
  /** 제출 핸들러 */
  onSubmit: () => void;
  /** 버튼 텍스트 (기본값: "확인") */
  label?: string;
}

export const SubmitButton = ({
  canSubmit = false,
  onSubmit,
  label = "확인",
}: SubmitButtonProps) => {
  const isDisabled = !canSubmit;

  return (
    <div className="qti-ext-submit-button-wrapper">
      <Button
        className={cn("qti-ext-submit-button")}
        disabled={isDisabled}
        onClick={onSubmit}
        aria-label={canSubmit ? "답안 제출" : "선택지를 선택해주세요"}
      >
        {label}
      </Button>
    </div>
  );
};
