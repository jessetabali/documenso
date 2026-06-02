import { putAttachmentFieldPdfFile } from '@documenso/lib/universal/upload/put-file';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Loader2Icon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { createCallable } from 'react-call';

export type SignFieldAttachmentDialogProps = {
  token: string;
  envelopeId: string;
  fieldId: number;
};

/**
 * A dialog for uploading a PDF attachment during signing (V2 envelope flow).
 *
 * Uploads the file via the app's storage infrastructure and resolves with a
 * `docdata:<id>` reference string on success, or null if dismissed without
 * a selection. The seal handler later retrieves the stored bytes and merges
 * the attachment PDF pages into the completed document.
 */
export const SignFieldAttachmentDialog = createCallable<SignFieldAttachmentDialogProps, string | null>(
  ({ call, token, envelopeId, fieldId }) => {
    const { _ } = useLingui();

    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      // Dual-condition PDF check: handles Windows systems where file.type may be empty
      // for genuine PDF files even when selected through accept="application/pdf".
      const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        setFileError(_(msg`Only PDF files are supported. Please select a PDF file.`));
        setFile(null);
        setFileName(null);

        // Reset the input so the same file can be re-selected if needed.
        if (inputRef.current) {
          inputRef.current.value = '';
        }

        return;
      }

      setFileError(null);
      setFile(selectedFile);
      setFileName(selectedFile.name);
    };

    const handleClear = () => {
      setFile(null);
      setFileName(null);
      setFileError(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleConfirm = async () => {
      if (!file || !fileName) {
        return;
      }

      setIsUploading(true);

      try {
        const { id } = await putAttachmentFieldPdfFile({
          token,
          envelopeId,
          fieldId,
          file,
        });
        call.end(`docdata:${id}`);
      } catch (err) {
        console.error('[AttachmentDialog] Upload failed:', err);
        setFileError(_(msg`Failed to upload the file. Please try again.`));
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <Dialog open={true} onOpenChange={(open) => (!open ? call.end(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Upload Attachment</Trans>
            </DialogTitle>

            <DialogDescription>
              <Trans>Select a PDF file to attach to this document.</Trans>
            </DialogDescription>
          </DialogHeader>

          {/* Hidden native file input, triggered programmatically. */}
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />

          <div className="flex flex-col gap-4">
            {/* Empty / dropzone state */}
            {!fileName && (
              <button
                type="button"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-border border-dashed bg-muted/30 p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground"
                onClick={() => inputRef.current?.click()}
              >
                <UploadIcon className="h-8 w-8" />
                <span className="font-medium text-sm">
                  <Trans>Click to select a PDF file</Trans>
                </span>
              </button>
            )}

            {/* File selected state */}
            {fileName && (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <PaperclipIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm">{fileName}</span>
                </div>

                <button
                  type="button"
                  className="ml-2 shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={handleClear}
                  disabled={isUploading}
                  aria-label={_(msg`Remove attachment`)}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Inline validation / upload error */}
            {fileError && <p className="text-destructive text-sm">{fileError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => call.end(null)} disabled={isUploading}>
              <Trans>Cancel</Trans>
            </Button>

            <Button
              type="button"
              disabled={!fileName || isUploading}
              onClick={() => {
                void handleConfirm();
              }}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  <Trans>Uploading...</Trans>
                </>
              ) : (
                <Trans>Attach</Trans>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
