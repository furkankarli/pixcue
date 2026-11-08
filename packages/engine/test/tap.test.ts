import { describe, expect, it } from 'vitest';
import { TAP_LEAD, TAP_RIPPLE, tapPhase } from '../src/tap.ts';

describe('tap', () => {
  it('shows nothing well before and after the tap', () => {
    expect(tapPhase(2 - TAP_LEAD - 0.01, 2)).toBeNull();
    expect(tapPhase(2 + TAP_RIPPLE + 0.01, 2)).toBeNull();
  });

  it('lands, presses down by the moment of the tap, then lifts with a ripple', () => {
    const landing = tapPhase(2 - TAP_LEAD + 0.05, 2);
    expect(landing?.press).toBe(0);
    expect(landing?.ripple).toBeNull();
    expect(tapPhase(2 - 0.001, 2)?.press).toBeGreaterThan(0.9);
    const lifted = tapPhase(2.2, 2);
    expect(lifted?.ripple).toBeCloseTo(0.4);
    expect(lifted?.alpha).toBeLessThan(0.5);
    expect(tapPhase(2.4, 2)?.alpha).toBe(0);
  });
});
