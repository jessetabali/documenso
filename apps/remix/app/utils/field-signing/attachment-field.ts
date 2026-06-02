import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TFieldAttachment } from '@documenso/lib/types/field';
import type { TSignEnvelopeFieldValue } from '@documenso/trpc/server/envelope-router/sign-envelope-field.types';
import { FieldType } from '@prisma/client';

import { SignFieldAttachmentDialog } from '~/components/dialogs/sign-field-attachment-dialog';

type HandleAttachmentFieldClickOptions = {
  field: TFieldAttachment;
  token: string;
  envelopeId: string;
};

/**
 * Handles a click on an ATTACHMENT field during the V2 signing flow.
 *
 * - If the field is already inserted (has a value), clicking it removes the attachment.
 * - If the field is not yet inserted, opens the attachment upload dialog.
 *
 * Returns the payload to sign/unsign the field, or null if the user dismissed without acting.
 */
export const handleAttachmentFieldClick = async (
  options: HandleAttachmentFieldClickOptions,
): Promise<Extract<TSignEnvelopeFieldValue, { type: typeof FieldType.ATTACHMENT }> | null> => {
  const { field, token, envelopeId } = options;

  if (field.type !== FieldType.ATTACHMENT) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Invalid field type',
    });
  }

  // If already inserted, clicking removes the attachment.
  if (field.inserted) {
    return {
      type: FieldType.ATTACHMENT,
      value: null,
    };
  }

  const url = await SignFieldAttachmentDialog.call({
    token,
    envelopeId,
    fieldId: field.id,
  });

  if (!url) {
    return null;
  }

  return {
    type: FieldType.ATTACHMENT,
    value: url,
  };
};
