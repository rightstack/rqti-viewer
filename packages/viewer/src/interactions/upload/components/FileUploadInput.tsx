import React from "react";

interface FileUploadInputProps {
  inputId: string;
  uploadedFile?: File;
  onFileChange: (file: File | undefined) => void;
  promptText?: string;
  disabled?: boolean;
  isPreview?: boolean;
}

function FileUploadInput({
  inputId,
  uploadedFile,
  onFileChange,
  promptText,
  disabled = false,
  isPreview = false,
}: FileUploadInputProps) {
  const blockInteraction = disabled || isPreview;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (blockInteraction) return;
    const file = e.target.files?.[0];
    onFileChange(file);
  };

  const handleRemoveFile = () => {
    if (blockInteraction) return;
    onFileChange(undefined);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  return (
    <div className="qti-ext-upload">
      <label
        htmlFor={inputId}
        className="qti-ext-upload-dropzone"
        style={
          blockInteraction
            ? { pointerEvents: "none" as const, ...(disabled ? { opacity: 0.7 } : {}) }
            : undefined
        }
        aria-label={promptText || "파일 업로드"}
      >
        <div className="rtqi:flex rtqi:flex-col rtqi:items-center rtqi:justify-center">
          <svg
            className="qti-ext-upload-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="qti-ext-upload-text">
            <span className="rtqi:font-semibold">파일을 클릭하거나 드래그하여 업로드</span>
          </p>
          <p className="qti-ext-upload-hint">파일 형식 제한 없음</p>
        </div>
        <input
          id={inputId}
          type="file"
          className="rtqi:hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
      {uploadedFile && (
        <div className="qti-ext-upload-file">
          <div className="qti-ext-upload-file-info">
            <div className="qti-ext-upload-file-details">
              <svg
                className="qti-ext-upload-file-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="qti-ext-upload-file-name">{uploadedFile.name}</span>
              <span className="qti-ext-upload-file-size">
                ({(uploadedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="qti-ext-upload-remove"
              aria-label="파일 제거"
            >
              <svg
                className="rtqi:h-4 rtqi:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { FileUploadInput };
