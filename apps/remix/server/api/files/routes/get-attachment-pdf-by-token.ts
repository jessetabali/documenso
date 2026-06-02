import { sha256 } from '@documenso/lib/universal/crypto';
import { getFileServerSide } from '@documenso/lib/universal/upload/get-file.server';
import { prisma } from '@documenso/prisma';
import { sValidator } from '@hono/standard-validator';
import { FieldType } from '@prisma/client';
import { Hono } from 'hono';
import { z } from 'zod';

import type { HonoEnv } from '../../../router';

const route = new Hono<HonoEnv>();

const ZGetAttachmentPdfByTokenParamsSchema = z.object({
  token: z.string().min(1),
  envelopeId: z.string().min(1),
  documentDataId: z.string().min(1),
});

route.get(
  '/token/:token/envelope/:envelopeId/attachment/:documentDataId/item.pdf',
  sValidator('param', ZGetAttachmentPdfByTokenParamsSchema),
  async (c) => {
    const { token, envelopeId, documentDataId } = c.req.valid('param');

    const field = await prisma.field.findFirst({
      where: {
        type: FieldType.ATTACHMENT,
        inserted: true,
        customText: `docdata:${documentDataId}`,
        envelope: {
          id: envelopeId,
          recipients: {
            some: {
              token,
            },
          },
        },
      },
    });

    if (!field) {
      return c.json({ error: 'Not found' }, 404);
    }

    const documentData = await prisma.documentData.findUnique({
      where: {
        id: documentDataId,
      },
    });

    if (!documentData) {
      return c.json({ error: 'Not found' }, 404);
    }

    const etag = Buffer.from(sha256(documentData.data)).toString('hex');

    if (c.req.header('If-None-Match') === etag) {
      return c.status(304);
    }

    const file = await getFileServerSide(documentData).catch((error) => {
      console.error(error);

      return null;
    });

    if (!file) {
      return c.json({ error: 'Not found' }, 404);
    }

    c.header('Content-Type', 'application/pdf');
    c.header('ETag', etag);
    c.header('Cache-Control', 'private, max-age=31536000, immutable');

    return c.body(file);
  },
);

export default route;
