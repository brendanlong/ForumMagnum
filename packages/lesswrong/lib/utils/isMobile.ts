import bowser from 'bowser'
import { isClient } from '../executionEnvironment';

/**
 * Returns whether this is a mobile device (according to heuristics in the
 * bowser library). Only usable on the client. Do NOT use this inside a
 * component function outside of an event handler, since that will create
 * an SSR mismatch. If you're thinking of using this to change layout/
 * presentation, this is probably not what you want; use CSS breakpoints
 * instead.
 */
export const isMobile = () => {
  return isClient
    && window?.navigator?.userAgent
    && (bowser.mobile || bowser.tablet);
}

/**
 * Returns whether the device's primary pointing device is "coarse" (i.e.
 * touch), meaning the user can't reliably click-and-hold and we should offer
 * tap-based interactions instead. This is based on the CSS `(pointer: coarse)`
 * media query (the pointer type), rather than the user-agent sniffing that
 * `isMobile` uses, so it correctly covers touch devices that `isMobile` misses
 * — notably large tablets, which often report a desktop-style user agent that
 * bowser doesn't classify as mobile/tablet. Like `isMobile`, this is only
 * usable on the client, and is intended for use inside event handlers rather
 * than during render, since calling it while rendering can cause an SSR
 * mismatch.
 */
export const isTouchPrimaryDevice = () => {
  if (!isClient) return false;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(pointer: coarse)').matches;
  }
  // Fall back to user-agent heuristics for the rare browser without matchMedia.
  return !!isMobile();
}
