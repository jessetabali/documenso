import { prisma } from '@documenso/prisma';
import { PDF } from '@libpdf/core';
import type { Field } from '@prisma/client';
import { FieldType } from '@prisma/client';

import { getFileServerSide } from '../../universal/upload/get-file.server';

type AppendAttachmentFieldsToPdfOptions = {
  pdfDoc: PDF;
  fields: Field[];
};

export const appendAttachmentFieldsToPdf = async ({ pdfDoc, fields }: AppendAttachmentFieldsToPdfOptions) => {
  const documentDataIds = Array.from(
    new Set(
      fields
        .filter(
          (field) => field.type === FieldType.ATTACHMENT && field.inserted && field.customText.startsWith('docdata:'),
        )
        .map((field) => field.customText.slice('docdata:'.length)),
    ),
  );

  for (const documentDataId of documentDataIds) {
    try {
      const documentData = await prisma.documentData.findUnique({
        where: {
          id: documentDataId,
        },
      });

      if (!documentData) {
        console.error(`[ATTACHMENT] Document data ${documentDataId} not found while appending attachment PDF.`);
        continue;
      }

      const attachmentBytes = await getFileServerSide(documentData);
      const attachmentDoc = await PDF.load(attachmentBytes);

      await pdfDoc.copyPagesFrom(
        attachmentDoc,
        Array.from({ length: attachmentDoc.getPageCount() }, (_, index) => index),
      );
    } catch (err) {
      console.error('[ATTACHMENT] Failed to append attachment PDF to document:', err);
    }
  }
};
