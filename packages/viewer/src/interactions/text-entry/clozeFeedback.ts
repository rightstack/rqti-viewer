import { stripOuterMathDelimiters } from "../../utils/latex";

type AnswerMap = Record<string, unknown>;

function strings(raw: unknown): string[] {
  return (Array.isArray(raw) ? raw : [raw]).filter(
    (value): value is string => typeof value === "string" && value.trim() !== ""
  );
}

/** 유순은 같은 칸끼리, 무순은 정답 칸을 중복 사용하지 않고 일대일 비교한다. */
export function getClozeFeedback({
  responseIds,
  responses,
  correctAnswers,
  fallbackCorrectAnswers,
  alternativeAnswers,
  ignoreAnswerOrder = false,
}: {
  responseIds: string[];
  responses: AnswerMap;
  correctAnswers?: AnswerMap;
  fallbackCorrectAnswers?: AnswerMap;
  alternativeAnswers?: AnswerMap;
  ignoreAnswerOrder?: boolean;
}): Record<string, boolean | undefined> {
  const ids = [
    ...new Set([
      ...Object.keys(correctAnswers ?? {}),
      ...Object.keys(fallbackCorrectAnswers ?? {}),
      ...responseIds,
    ]),
  ];
  const answers = ids.map((id) => {
    const primary = [correctAnswers?.[id], fallbackCorrectAnswers?.[id]]
      .map(strings)
      .find((candidates) => candidates.length > 0);
    const candidates = [...(primary ?? []), ...strings(alternativeAnswers?.[id])];
    return candidates.length > 0 ? candidates.map(stripOuterMathDelimiters) : undefined;
  });
  const inputs = ids.map((id) => {
    const raw = responses[id];
    const value: unknown = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === "string" ? stripOuterMathDelimiters(value) : "";
  });

  if (ignoreAnswerOrder) {
    const matched = new Map<number, number>();
    // 대체 정답이 겹치면 기존 매칭을 옮겨 가능한 많은 입력을 인정한다.
    const match = (inputIndex: number, visited: Set<number>): boolean => {
      if (!inputs[inputIndex]) return false;
      for (let answerIndex = 0; answerIndex < answers.length; answerIndex++) {
        if (visited.has(answerIndex) || !answers[answerIndex]?.includes(inputs[inputIndex]))
          continue;
        visited.add(answerIndex);
        const previous = matched.get(answerIndex);
        if (previous === undefined || match(previous, visited)) {
          matched.set(answerIndex, inputIndex);
          return true;
        }
      }
      return false;
    };
    ids.forEach((_, index) => match(index, new Set()));
    const correctIndices = new Set(matched.values());
    const hasAnswers = answers.some(Boolean);
    return Object.fromEntries(
      ids
        .filter((id) => responseIds.includes(id))
        .map((id) => {
          const index = ids.indexOf(id);
          return [id, inputs[index] && hasAnswers ? correctIndices.has(index) : undefined];
        })
    );
  }

  const result: Record<string, boolean | undefined> = {};
  for (const id of new Set(responseIds)) {
    const raw = responses[id];
    const value: unknown = Array.isArray(raw) ? raw[0] : raw;
    const input = typeof value === "string" ? stripOuterMathDelimiters(value) : "";
    const candidates = answers[ids.indexOf(id)];

    result[id] = input !== "" && candidates ? candidates.includes(input) : undefined;
  }
  return result;
}
