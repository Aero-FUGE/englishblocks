import {sound} from './sound';

/** One click sound for interface controls; never overlay it on English pronunciation
 * or on the word-block place/remove sound effects. Used by App's click capture,
 * so React portals (all dialogs) share the same rule. */
export function playUiClickForTarget(target: EventTarget | null): void {
  if (!(target instanceof Element)) return;
  if (target.closest('[data-ui-sound="off"], [data-word-block], [data-sound-preview]')) return;
  const control = target.closest('button, [role="button"], [data-ui-sound="on"]');
  if (!control || control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true') return;
  sound.playSlot('ui_button');
}
