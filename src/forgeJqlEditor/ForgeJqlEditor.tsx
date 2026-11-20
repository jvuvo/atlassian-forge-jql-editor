import { Stack } from '@forge/react';
import React, { forwardRef, useImperativeHandle } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_LABEL,
  DEFAULT_LEARN_MORE,
  DEFAULT_PLACEHOLDER,
} from './constants';
import { JqlEditorField } from './components/JqlEditorField';
import { JqlEditorHeader } from './components/JqlEditorHeader';
import { JqlValidityMessages } from './components/JqlValidityMessages';
import type { ForgeJqlEditorHandle, ForgeJqlEditorProps } from './types';
import { useForgeJqlEditor } from './useForgeJqlEditor';

/**
 * Forge UI Kit JQL field with read-only suggestion hints (by caret) and live parse.
 * Users type the query themselves — the popup is not selectable.
 */
export const ForgeJqlEditor = forwardRef<ForgeJqlEditorHandle, ForgeJqlEditorProps>(
  function ForgeJqlEditor(
    {
      value,
      onChange,
      projectKey,
      id = 'forge-jql-editor',
      name = 'jql',
      label = DEFAULT_LABEL,
      description = DEFAULT_DESCRIPTION,
      learnMoreHref = DEFAULT_LEARN_MORE,
      placeholder = DEFAULT_PLACEHOLDER,
      minimumRows = 3,
      isDisabled = false,
      onValidityChange,
      validateRequest,
    },
    ref
  ) {
    const {
      error,
      warning,
      isValid,
      validating,
      suggestions,
      isSuggestOpen,
      clearSuggestions,
      handleChange,
      handleBlur,
      runValidate,
    } = useForgeJqlEditor({
      value,
      onChange,
      projectKey,
      onValidityChange,
      validateRequest,
    });

    useImperativeHandle(
      ref,
      () => ({
        validate: (options) => runValidate(options?.quiet ?? false),
      }),
      [runValidate]
    );

    return (
      <Stack space="space.100">
        <JqlEditorHeader
          id={id}
          label={label}
          description={description}
          learnMoreHref={learnMoreHref}
        />
        <JqlEditorField
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          minimumRows={minimumRows}
          isDisabled={isDisabled}
          isInvalid={Boolean(error)}
          isSuggestOpen={isSuggestOpen}
          suggestions={suggestions}
          onCloseSuggestions={clearSuggestions}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        <JqlValidityMessages
          value={value}
          error={error}
          warning={warning}
          isValid={isValid}
          validating={validating}
        />
      </Stack>
    );
  }
);
