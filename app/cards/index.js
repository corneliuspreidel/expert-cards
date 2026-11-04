// Card type registry. ab_compare and find_error are planned for the E8c deck (see docs/DECK_SCHEMA.md).
import * as info from './info.js';
import * as choice from './choice.js';
import * as verdict from './verdict.js';
import * as scale from './scale.js';
import * as freeText from './free_text.js';

export const cards = {
  info,
  single_choice: choice,
  multi_choice: choice,
  verdict,
  scale,
  free_text: freeText
};
