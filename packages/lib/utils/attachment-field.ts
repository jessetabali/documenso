import { z } from 'zod';

export const ATTACHMENT_FIELD_VALUE_PREFIX = 'docdata:';

export const ZAttachmentFieldValueSchema = z
  .string()
  .regex(/^docdata:[^\s:]+$/, 'Attachment value must be a docdata reference');

export const getAttachmentFieldDocumentDataId = (value: string) => {
  const parsedValue = ZAttachmentFieldValueSchema.safeParse(value);

  if (!parsedValue.success) {
    return null;
  }

  return parsedValue.data.slice(ATTACHMENT_FIELD_VALUE_PREFIX.length);
};
