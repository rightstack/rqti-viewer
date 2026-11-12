import { Circle, Pentagon, Square } from "lucide-react";

export type HotspotIconShape = "rect" | "circle" | "poly" | "ellipse";

export default function HotspotShapeIcon({
  shape,
  className = "rqti:size-4",
}: {
  shape: HotspotIconShape;
  className?: string;
}) {
  if (shape === "ellipse") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="12" rx="10" ry="6" />
      </svg>
    );
  }
  const Icon = { rect: Square, circle: Circle, poly: Pentagon }[shape];
  return <Icon className={className} aria-hidden="true" />;
}
