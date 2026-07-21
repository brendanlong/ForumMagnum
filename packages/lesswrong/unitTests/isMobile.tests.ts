/**
 * @jest-environment jsdom
 */
import { isTouchPrimaryDevice } from '../lib/utils/isMobile';

describe('isTouchPrimaryDevice', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    // jsdom doesn't implement matchMedia, so originalMatchMedia is undefined;
    // restore whatever was there (or remove our mock) after each test.
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      // @ts-expect-error - allow removing the property we added for the test
      delete window.matchMedia;
    }
  });

  const mockMatchMedia = (coarseMatches: boolean) => {
    const calls: string[] = [];
    window.matchMedia = ((query: string) => {
      calls.push(query);
      return { matches: query === '(pointer: coarse)' ? coarseMatches : false };
    }) as typeof window.matchMedia;
    return calls;
  };

  it('returns true when the primary pointer is coarse (touch)', () => {
    const calls = mockMatchMedia(true);
    expect(isTouchPrimaryDevice()).toBe(true);
    expect(calls).toContain('(pointer: coarse)');
  });

  it('returns false when the primary pointer is fine (mouse)', () => {
    mockMatchMedia(false);
    expect(isTouchPrimaryDevice()).toBe(false);
  });

  it('falls back to a user-agent heuristic when matchMedia is unavailable', () => {
    // @ts-expect-error - simulate a browser without matchMedia
    delete window.matchMedia;
    // We can't easily control the bowser UA result here, but the fallback must
    // not throw and must return a boolean.
    expect(typeof isTouchPrimaryDevice()).toBe('boolean');
  });
});
