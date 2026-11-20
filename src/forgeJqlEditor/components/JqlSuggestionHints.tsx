import { Box, Stack, Text, xcss } from '@forge/react';
import React from 'react';
import type { JqlSuggestion } from '../../jqlSuggest';

const popupStyles = xcss({
  paddingBlock: 'space.050',
  paddingInline: 'space.100',
  maxWidth: '100%',
});

const itemStyles = xcss({
  width: '100%',
  textAlign: 'start',
  paddingBlock: 'space.050',
});

type JqlSuggestionHintsProps = {
  suggestions: JqlSuggestion[];
};

/** Read-only hint list — not selectable. */
export function JqlSuggestionHints({ suggestions }: JqlSuggestionHintsProps) {
  return (
    <Box xcss={popupStyles}>
      <Stack space="space.050" alignInline="start">
        <Text size="small" color="color.text.subtlest">
          Suggestions (type to complete)
        </Text>
        {suggestions.map((suggestion) => (
          <Box key={`${suggestion.value}-${suggestion.label}`} xcss={itemStyles}>
            <Text align="start" size="small">
              {suggestion.label}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
