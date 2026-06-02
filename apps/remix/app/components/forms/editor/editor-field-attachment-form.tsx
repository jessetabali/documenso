import {
  DEFAULT_FIELD_FONT_SIZE,
  type TAttachmentFieldMeta,
  ZAttachmentFieldMeta,
} from '@documenso/lib/types/field-meta';
import { Form } from '@documenso/ui/primitives/form/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import {
  EditorGenericFontSizeField,
  EditorGenericReadOnlyField,
  EditorGenericRequiredField,
} from './editor-field-generic-field-forms';

const ZAttachmentFieldFormSchema = ZAttachmentFieldMeta.pick({
  fontSize: true,
  required: true,
  readOnly: true,
});

type TAttachmentFieldFormSchema = z.infer<typeof ZAttachmentFieldFormSchema>;

type EditorFieldAttachmentFormProps = {
  value: TAttachmentFieldMeta | undefined;
  onValueChange: (value: TAttachmentFieldMeta) => void;
};

export const EditorFieldAttachmentForm = ({
  value = {
    type: 'attachment',
  },
  onValueChange,
}: EditorFieldAttachmentFormProps) => {
  const form = useForm<TAttachmentFieldFormSchema>({
    resolver: zodResolver(ZAttachmentFieldFormSchema),
    mode: 'onChange',
    defaultValues: {
      fontSize: value.fontSize || DEFAULT_FIELD_FONT_SIZE,
      required: value.required || false,
      readOnly: value.readOnly || false,
    },
  });

  const formValues = useWatch({
    control: form.control,
  });

  useEffect(() => {
    const validatedFormValues = ZAttachmentFieldFormSchema.safeParse(formValues);

    if (validatedFormValues.success) {
      onValueChange({
        type: 'attachment',
        ...validatedFormValues.data,
      });
    }
  }, [formValues]);

  return (
    <Form {...form}>
      <form>
        <fieldset className="flex flex-col gap-2">
          <EditorGenericFontSizeField formControl={form.control} />

          <div className="mt-2">
            <EditorGenericRequiredField formControl={form.control} />
          </div>

          <EditorGenericReadOnlyField formControl={form.control} />
        </fieldset>
      </form>
    </Form>
  );
};
