import { Popup, TextArea } from '@forge/react';
import React from 'react';
import type { JqlSuggestion } from '../../jqlSuggest';
import { JqlSuggestionHints } from './JqlSuggestionHints';

type JqlEditorFieldProps = {
  id: string;
  name: string;
  value: string;
  placeholder: string;
  minimumRows: number;
  isDisabled: boolean;
  isInvalid: boolean;
  isSuggestOpen: boolean;
  suggestions: JqlSuggestion[];
  onCloseSuggestions: () => void;
  onBlur: () => void;
  onChange: (event: {
    target?: { value?: string; selectionStart?: number | null } | null;
  }) => void;
};

export function JqlEditorField({
  id,
  name,
  value,
  placeholder,
  minimumRows,
  isDisabled,
  isInvalid,
  isSuggestOpen,
  suggestions,
  onCloseSuggestions,
  onBlur,
  onChange,
}: JqlEditorFieldProps) {
  return (
    <Popup
      isOpen={isSuggestOpen}
      onClose={onCloseSuggestions}
      placement="bottom-start"
      shouldFitContainer
      autoFocus={false}
      role="listbox"
      label="JQL suggestions"
      trigger={() => (
        <TextArea
          id={id}
          name={name}
          value={value}
          isMonospaced
          minimumRows={minimumRows}
          resize="vertical"
          placeholder={placeholder}
          isDisabled={isDisabled}
          isInvalid={isInvalid}
          onBlur={onBlur}
          onChange={onChange}
        />
      )}
      content={() => <JqlSuggestionHints suggestions={suggestions} />}
    />
  );
}
