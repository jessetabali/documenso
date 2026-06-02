import { DO_NOT_INVALIDATE_QUERY_ON_MUTATION } from '@documenso/lib/constants/trpc';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TRecipientActionAuth } from '@documenso/lib/types/document-auth';
import { ZAttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import { putAttachmentFieldPdfFile } from '@documenso/lib/universal/upload/put-file';
import type { FieldWithSignatureAndFieldMeta } from '@documenso/prisma/types/field-with-signature-and-fieldmeta';
import { trpc } from '@documenso/trpc/react';
import type {
  TRemovedSignedFieldWithTokenMutationSchema,
  TSignFieldWithTokenMutationSchema,
} from '@documenso/trpc/server/field-router/schema';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Loader2Icon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { useRevalidator } from 'react-router';

import { useRequiredDocumentSigningAuthContext } from './document-signing-auth-provider';
import { DocumentSigningFieldContainer } from './document-signing-field-container';
import { DocumentSigningFieldsInserted, DocumentSigningFieldsLoader } from './document-signing-fields';
import { useDocumentSigningRecipientContext } from './document-signing-recipient-provider';

export type DocumentSigningAttachmentFieldProps = {
  field: FieldWithSignatureAndFieldMeta;
  onSignField?: (value: TSignFieldWithTokenMutationSchema) => Promise<void> | void;
  onUnsignField?: (value: TRemovedSignedFieldWithTokenMutationSchema) => Promise<void> | void;
};

export const DocumentSigningAttachmentField = ({
  field,
  onSignField,
  onUnsignField,
}: DocumentSigningAttachmentFieldProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();
  const { revalidate } = useRevalidator();

  const { recipient, isAssistantMode } = useDocumentSigningRecipientContext();
  const { executeActionAuthProcedure } = useRequiredDocumentSigningAuthContext();

  const inputRef = useRef<HTMLInputElement>(null);

  // Ephemeral filename state, survives only for the current mount.
  // After remount only the URL string (field.customText) is available.
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const parsedFieldMeta = ZAttachmentFieldMeta.safeParse(field.fieldMeta).data;

  const { mutateAsync: signFieldWithToken, isPending: isSignFieldWithTokenLoading } =
    trpc.field.signFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const { mutateAsync: removeSignedFieldWithToken, isPending: isRemoveSignedFieldWithTokenLoading } =
    trpc.field.removeSignedFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const isLoading = isSignFieldWithTokenLoading || isRemoveSignedFieldWithTokenLoading || isUploading;
  const isDisabled = parsedFieldMeta?.readOnly === true;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) {
      return;
    }

    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // Dual-condition PDF check: handles Windows systems where file.type may be
    // empty for genuine PDFs selected via accept="application/pdf".
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setFileError(_(msg`Only PDF files are supported. Please select a PDF file.`));
      setLocalFileName(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      return;
    }

    setFileError(null);
    setLocalFileName(selectedFile.name);

    void uploadAndSign(selectedFile);
  };

  const uploadAndSign = async (selectedFile: File) => {
    setIsUploading(true);

    let attachmentUrl: string;

    try {
      const { id } = await putAttachmentFieldPdfFile({
        token: recipient.token,
        envelopeId: field.envelopeId,
        fieldId: field.id,
        file: selectedFile,
      });
      attachmentUrl = `docdata:${id}`;
    } catch (err) {
      console.error('[AttachmentField] Upload failed:', err);
      setLocalFileName(null);
      setFileError(_(msg`Failed to upload the file. Please try again.`));

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      setIsUploading(false);
      return;
    }

    setIsUploading(false);

    void executeActionAuthProcedure({
      onReauthFormSubmit: async (authOptions) => {
        await onSign(attachmentUrl, authOptions);
      },
      actionTarget: field.type,
    });
  };

  const onSign = async (url: string, authOptions?: TRecipientActionAuth) => {
    try {
      const payload: TSignFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
        value: url,
        isBase64: false,
        authOptions,
      };

      if (onSignField) {
        await onSignField(payload);
        return;
      }

      await signFieldWithToken(payload);
      await revalidate();
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        throw error;
      }

      console.error(err);

      toast({
        title: _(msg`Error`),
        description: isAssistantMode
          ? _(msg`An error occurred while signing as assistant.`)
          : _(msg`An error occurred while attaching the file.`),
        variant: 'destructive',
      });
    }
  };

  const onRemove = async () => {
    try {
      const payload: TRemovedSignedFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
      };

      if (onUnsignField) {
        await onUnsignField(payload);
        return;
      }

      await removeSignedFieldWithToken(payload);

      setLocalFileName(null);
      setFileError(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      await revalidate();
    } catch (err) {
      console.error(err);

      toast({
        title: _(msg`Error`),
        description: _(msg`An error occurred while removing the attachment.`),
        variant: 'destructive',
      });
    }
  };

  const onPreSign = () => {
    // Opening the file picker is handled by handleFileChange, not onPreSign.
    return false;
  };

  const hasValue = Boolean(field.inserted && field.customText);

  return (
    <DocumentSigningFieldContainer
      field={field}
      onPreSign={onPreSign}
      onSign={() => Promise.resolve()}
      onRemove={onRemove}
      type="Attachment"
    >
      {isLoading && <DocumentSigningFieldsLoader />}

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isDisabled}
      />

      {/* Empty / upload state */}
      {!hasValue && (
        <button
          type="button"
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={isDisabled || isUploading}
        >
          {isUploading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
          <span className="text-[clamp(0.35rem,20cqw,0.7rem)]">
            {isUploading ? <Trans>Uploading...</Trans> : <Trans>Upload PDF</Trans>}
          </span>
        </button>
      )}

      {/* Uploaded state */}
      {hasValue && (
        <DocumentSigningFieldsInserted>
          <div className="flex items-center gap-1">
            <PaperclipIcon className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{localFileName ?? _(msg`Attachment uploaded`)}</span>
          </div>
        </DocumentSigningFieldsInserted>
      )}

      {fileError && (
        <p className="absolute right-0 bottom-0 left-0 bg-background/90 px-1 text-[0.5rem] text-destructive">
          {fileError}
        </p>
      )}

      {/* Remove button for inserted field */}
      {hasValue && !isDisabled && (
        <button
          type="button"
          className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            void onRemove();
          }}
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </DocumentSigningFieldContainer>
  );
};
