import type { TAttachmentFieldMeta as AttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { Switch } from '@documenso/ui/primitives/switch';
import { Trans, useLingui } from '@lingui/react/macro';

type AttachmentFieldAdvancedSettingsProps = {
  fieldState: AttachmentFieldMeta;
  handleFieldChange: (key: keyof AttachmentFieldMeta, value: string | boolean) => void;
  handleErrors: (errors: string[]) => void;
};

export const AttachmentFieldAdvancedSettings = ({
  fieldState,
  handleFieldChange,
  handleErrors,
}: AttachmentFieldAdvancedSettingsProps) => {
  const { t } = useLingui();

  const handleInput = (field: keyof AttachmentFieldMeta, value: string | boolean) => {
    const fontSize = field === 'fontSize' ? Number(value) : Number(fieldState.fontSize ?? 14);

    const errors = [];

    if (fontSize < 8 || fontSize > 96) {
      errors.push('Font size must be between 8 and 96.');
    }

    handleErrors(errors);

    if (field === 'required' && value) {
      handleFieldChange('readOnly', false);
    }

    if (field === 'readOnly' && value) {
      handleFieldChange('required', false);
    }

    handleFieldChange(field, value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>
          <Trans>Font Size</Trans>
        </Label>
        <Input
          id="fontSize"
          type="number"
          className="mt-2 bg-background"
          placeholder={t`Field font size`}
          value={fieldState.fontSize}
          onChange={(e) => handleInput('fontSize', e.target.value)}
          min={8}
          max={96}
        />
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <Switch
            className="bg-background"
            checked={fieldState.required}
            onCheckedChange={(checked) => handleInput('required', checked)}
          />
          <Label>
            <Trans>Required field</Trans>
          </Label>
        </div>

        <div className="flex flex-row items-center gap-2">
          <Switch
            className="bg-background"
            checked={fieldState.readOnly}
            onCheckedChange={(checked) => handleInput('readOnly', checked)}
          />
          <Label>
            <Trans>Read only</Trans>
          </Label>
        </div>
      </div>
    </div>
  );
};
