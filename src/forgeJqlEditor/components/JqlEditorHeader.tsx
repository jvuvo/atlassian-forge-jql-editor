import { Label, Link, Stack, Text } from '@forge/react';
import React from 'react';

type JqlEditorHeaderProps = {
  id: string;
  label?: string;
  description?: string;
  learnMoreHref?: string | null;
};

export function JqlEditorHeader({
  id,
  label,
  description,
  learnMoreHref,
}: JqlEditorHeaderProps) {
  return (
    <>
      {label ? <Label labelFor={id}>{label}</Label> : null}
      {(description || learnMoreHref) && (
        <Stack space="space.050">
          {description ? <Text size="small">{description}</Text> : null}
          {learnMoreHref ? (
            <Link href={learnMoreHref} openNewTab>
              Learn JQL syntax →
            </Link>
          ) : null}
        </Stack>
      )}
    </>
  );
}
