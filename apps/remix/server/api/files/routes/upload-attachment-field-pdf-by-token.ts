import { APP_DOCUMENT_UPLOAD_SIZE_LIMIT } from '@documenso/lib/constants/app';
import { putNormalizedPdfFileServerSide } from '@documenso/lib/universal/upload/put-file.server';
import { prisma } from '@documenso/prisma';
import { sValidator } from '@hono/standard-validator';
import { FieldType, RecipientRole, SigningStatus } from '@prisma/client';
import { Hono } from 'hono';
import { z } from 'zod';

import type { HonoEnv } from '../../../router';
import { ZUploadPdfRequestSchema } from '../files.types';

const route = new Hono<HonoEnv>();

const ZUploadAttachmentFieldPdfByTokenParamsSchema = z.object({
  token: z.string().min(1),
  envelopeId: z.string().min(1),
  fieldId: z.coerce.number().int().positive(),
});

route.post(
  '/token/:token/envelope/:envelopeId/field/:fieldId/attachment/upload-pdf',
  sValidator('param', ZUploadAttachmentFieldPdfByTokenParamsSchema),
  sValidator('form', ZUploadPdfRequestSchema),
  async (c) => {
    const { token, envelopeId, fieldId } = c.req.valid('param');
    const { file } = c.req.valid('form');

    const recipient = await prisma.recipient.findFirst({
      where: {
        token,
        envelopeId,
      },
    });

    if (!recipient) {
      return c.json({ error: 'Not found' }, 404);
    }

    const field = await prisma.field.findFirst({
      where: {
        id: fieldId,
        envelopeId,
        type: FieldType.ATTACHMENT,
        recipient: {
          ...(recipient.role === RecipientRole.ASSISTANT
            ? {
                signingStatus: {
                  not: SigningStatus.SIGNED,
                },
                signingOrder: {
                  gte: recipient.signingOrder ?? 0,
                },
                envelopeId: recipient.envelopeId,
              }
            : {
                id: recipient.id,
              }),
        },
      },
      select: {
        id: true,
        envelopeId: true,
        recipientId: true,
      },
    });

    if (!field) {
      return c.json({ error: 'Not found' }, 404);
    }

    const maxFileSize = APP_DOCUMENT_UPLOAD_SIZE_LIMIT * 1024 * 1024;

    if (file.size > maxFileSize) {
      return c.json({ error: 'File too large' }, 400);
    }

    const documentData = await putNormalizedPdfFileServerSide(file).catch((error) => {
      console.error('Attachment upload failed:', error);

      return null;
    });

    if (!documentData) {
      return c.json({ error: 'Upload failed' }, 500);
    }

    await prisma.attachmentFieldUpload.create({
      data: {
        documentDataId: documentData.id,
        envelopeId: field.envelopeId,
        fieldId: field.id,
        recipientId: field.recipientId,
      },
    });

    return c.json({
      id: documentData.id,
      type: documentData.type,
    });
  },
);

export default route;
