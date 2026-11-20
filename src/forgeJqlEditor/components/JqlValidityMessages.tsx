import { ErrorMessage, HelperMessage, Inline, Spinner, Text, ValidMessage } from '@forge/react';
import React from 'react';

type JqlValidityMessagesProps = {
  value: string;
  error: string | null;
  warning: string | null;
  isValid: boolean;
  validating: boolean;
};

export function JqlValidityMessages({
  value,
  error,
  warning,
  isValid,
  validating,
}: JqlValidityMessagesProps) {
  return (
    <>
      {validating && (
        <HelperMessage>
          <Inline space="space.050" alignBlock="center">
            <Spinner size="small" label="Validating JQL..." />
            <Text size="small" color="color.text.subtlest">
              Validating JQL...
            </Text>
          </Inline>
        </HelperMessage>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && warning && <HelperMessage>{warning}</HelperMessage>}
      {isValid && !error && value.trim() !== '' && <ValidMessage>JQL is valid.</ValidMessage>}
    </>
  );
}
