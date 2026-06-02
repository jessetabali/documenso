import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { getAttachmentFieldDocumentDataId } from '../../utils/attachment-field';

type ValidateAttachmentFieldValueOptions = {
  value: string;
  envelopeId: string;
  fieldId: number;
  recipientId: number;
};

export const validateAttachmentFieldValue = async ({
  value,
  envelopeId,
  fieldId,
  recipientId,
}: ValidateAttachmentFieldValueOptions) => {
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
