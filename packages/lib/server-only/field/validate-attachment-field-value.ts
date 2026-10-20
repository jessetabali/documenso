import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { getAttachmentFieldDocumentDataId } from '../../utils/attachment-field';

type ValidateAttachmentFieldValueOptions = {
  value: string | null | undefined;
  envelopeId: string;
  fieldId: number;
  recipientId: number;
  required?: boolean;
};

export const validateAttachmentFieldValue = async ({
  value,
  envelopeId,
  fieldId,
  recipientId,
  required = false,
}: ValidateAttachmentFieldValueOptions) => {
  // If no value is provided (e.g. optional or unfilled field during document creation)
  if (!value || value.trim() === '') {
    if (!required) {
      return { documentDataId: null };
    }

    throw new AppError(AppErrorCode.INVALID_BODY, {
      message: 'Invalid attachment value',
    });
  }

  const documentDataId = getAttachmentFieldDocumentDataId(value);

  if (!documentDataId) {
    throw new AppError(AppErrorCode.INVALID_BODY, {
      message: 'Invalid attachment value',
    });
  }

  const attachmentFieldUpload = await prisma.attachmentFieldUpload.findFirst({
    where: {
      documentDataId,
      envelopeId,
      fieldId,
      recipientId,
    },
    select: {
      id: true,
      documentDataId: true,
    },
  });

  if (!attachmentFieldUpload) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Attachment upload not found',
    });
  }

  return {
    documentDataId,
  };
};
