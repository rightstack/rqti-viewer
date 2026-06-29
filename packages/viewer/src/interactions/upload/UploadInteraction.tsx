import React, { useState } from "react";
import type { QTIParserOptions, ResponseValue } from "../../types";
import { FileUploadInput } from "./components";

interface UploadInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
    onResponseChange?: (identifier: string, value: ResponseValue) => void;
    responses?: Record<string, ResponseValue>;
  };
  index: number;
}

export const UploadInteraction: React.FC<UploadInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";

  // 내부 상태 관리
  const [uploadedFile, setUploadedFile] = useState<File | undefined>(() => {
    if (
      options.responses &&
      typeof options.responses === "object" &&
      responseIdentifier in options.responses
    ) {
      const responseValue = options.responses[responseIdentifier];
      return responseValue instanceof File ? responseValue : undefined;
    }
    return undefined;
  });

  const handleFileChange = (file: File | undefined) => {
    setUploadedFile(file);
    options.onResponseChange?.(
      responseIdentifier,
      (file as unknown as ResponseValue) || (undefined as unknown as ResponseValue)
    );
  };

  return (
    <div key={`upload-${responseIdentifier}-${index}`} className="my-4">
      <FileUploadInput
        inputId={`file-upload-${responseIdentifier}-${index}`}
        uploadedFile={uploadedFile}
        onFileChange={handleFileChange}
        disabled={!!options.isSubmit}
        isPreview={options.mode === "preview"}
      />
    </div>
  );
};
