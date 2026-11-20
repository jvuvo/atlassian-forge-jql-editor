import { Icon, Inline, Spinner } from '@forge/react';
import React from 'react';

type JqlValidityMessagesProps = {
  value: string;
  error: string | null;
  isValid: boolean;
  validating: boolean;
};

/** Compact status affordance — icons only, no Jira parse text. */
export function JqlValidityMessages({
  value,
  error,
  isValid,
  validating,
}: JqlValidityMessagesProps) {
  const hasValue = value.trim() !== '';

  if (validating) {
    return <Spinner size="small" label="Validating JQL" />;
  }

  if (error) {
    return (
      <Inline space="space.050" alignBlock="center">
        <Icon glyph="error" label="Invalid JQL" color="color.icon.danger" size="small" />
      </Inline>
    );
  }

  if (isValid && hasValue) {
    return (
      <Inline space="space.050" alignBlock="center">
        <Icon glyph="check-circle" label="Valid JQL" color="color.icon.success" size="small" />
      </Inline>
    );
  }

  return null;
}
