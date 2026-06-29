import type { MatchingPairType } from "../types";

export const extractCorrectPairs = (xmlString: string): MatchingPairType[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    return [];
  }

  const correctValues = xmlDoc.querySelectorAll("qti-correct-response qti-value");
  const correctPairs = Array.from(correctValues).map((element) => {
    const pairText = element.textContent?.trim() || "";
    const [leftId, rightId] = pairText.split(" ");
    return { leftId, rightId };
  });

  return correctPairs.filter((pair) => pair.leftId && pair.rightId);
};
