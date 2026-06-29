import { CorrectIcon } from "./CorrectIcon";
import { IncorrectIcon } from "./IncorrectIcon";

interface FeedbackIconProps {
  isCorrect?: boolean;
  isIncorrect?: boolean;
}

export const FeedbackIcon = ({ isCorrect, isIncorrect }: FeedbackIconProps) => {
  if (!isCorrect && !isIncorrect) return null;

  return (
    <div className="qti-ext-feedback-icon">
      {isCorrect && <CorrectIcon />}
      {isIncorrect && <IncorrectIcon />}
    </div>
  );
};
