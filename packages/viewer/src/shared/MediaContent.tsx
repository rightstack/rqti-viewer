import { buildImageStyle } from "../parser/imageUtils";
import type { MediaContentType } from "../types";
import { resolveMediaUrl } from "../utils/urlUtils";

interface MediaContentProps {
  media: MediaContentType[];
  className?: string;
  token?: string;
  baseUrl?: string;
}

function appendToken(url: string | undefined, token?: string): string | undefined {
  if (!url) return undefined;
  return `${url}?t=${token ?? ""}`;
}

export const MediaContent = ({ media, className = "", token, baseUrl }: MediaContentProps) => {
  if (media.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {media.map((item) => {
        const resolvedUrl = resolveMediaUrl(item.url, baseUrl);
        switch (item.type) {
          case "image": {
            const cls = item.className ?? "";
            const imgClassName: string = cls.includes("qti-ext-image")
              ? cls
              : `${cls} qti-ext-image`.trim();

            const imgStyle = buildImageStyle(
              item.width ? String(item.width) : undefined,
              item.height ? String(item.height) : undefined
            );

            const isSvg =
              typeof item.url === "string" &&
              (item.url.startsWith("data:image/svg+xml") || /\.svg(\?|#|$)/i.test(item.url));
            const finalSrc = isSvg ? resolvedUrl : appendToken(resolvedUrl, token);

            return (
              <img
                key={item.id}
                src={finalSrc}
                alt={item.alt || ""}
                className={imgClassName}
                style={Object.keys(imgStyle).length > 0 ? imgStyle : undefined}
              />
            );
          }
          case "video":
            return (
              <video
                key={item.id}
                src={appendToken(resolvedUrl, token)}
                controls
                controlsList="nodownload"
                className="qti-ext-video"
              >
                <track kind="captions" />
              </video>
            );
          case "audio":
            return (
              <audio
                key={item.id}
                src={appendToken(resolvedUrl, token)}
                controls
                controlsList="nodownload"
                className="qti-ext-audio"
              >
                오디오를 재생할 수 없습니다.
                <track kind="captions" />
              </audio>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
