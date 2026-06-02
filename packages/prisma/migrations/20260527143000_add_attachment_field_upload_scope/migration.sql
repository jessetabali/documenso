-- CreateTable
CREATE TABLE "AttachmentFieldUpload" (
    "id" TEXT NOT NULL,
    "documentDataId" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttachmentFieldUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentFieldUpload_documentDataId_key" ON "AttachmentFieldUpload"("documentDataId");

-- CreateIndex
CREATE INDEX "AttachmentFieldUpload_envelopeId_idx" ON "AttachmentFieldUpload"("envelopeId");

-- CreateIndex
CREATE INDEX "AttachmentFieldUpload_fieldId_idx" ON "AttachmentFieldUpload"("fieldId");

-- CreateIndex
CREATE INDEX "AttachmentFieldUpload_recipientId_idx" ON "AttachmentFieldUpload"("recipientId");

-- CreateIndex
CREATE INDEX "AttachmentFieldUpload_documentDataId_envelopeId_fieldId_recipientId_idx" ON "AttachmentFieldUpload"("documentDataId", "envelopeId", "fieldId", "recipientId");

-- AddForeignKey
ALTER TABLE "AttachmentFieldUpload" ADD CONSTRAINT "AttachmentFieldUpload_documentDataId_fkey" FOREIGN KEY ("documentDataId") REFERENCES "DocumentData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentFieldUpload" ADD CONSTRAINT "AttachmentFieldUpload_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentFieldUpload" ADD CONSTRAINT "AttachmentFieldUpload_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentFieldUpload" ADD CONSTRAINT "AttachmentFieldUpload_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
