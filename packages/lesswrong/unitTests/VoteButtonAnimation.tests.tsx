/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoteButtonAnimation } from '../components/votes/VoteButton';
import { strongVoteDelay } from '../components/votes/constants';

// jsdom's synthetic PointerEvent from fireEvent.pointerDown doesn't carry
// `pointerType`, so dispatch an event with it explicitly set. React reads
// `pointerType` off the native event when building its SyntheticPointerEvent.
const firePointerDown = (element: Element, pointerType: string) => {
  const event = new Event('pointerdown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(element, event);
};

// Renders VoteButtonAnimation with a plain button that its event handlers are
// spread onto, mirroring how the real vote arrow components consume it.
const renderVoteButton = (currentStrength: "big"|"small"|"neutral") => {
  const vote = jest.fn();
  const utils = render(
    <VoteButtonAnimation vote={vote} currentStrength={currentStrength}>
      {animation => <button {...animation.eventHandlers}>vote</button>}
    </VoteButtonAnimation>
  );
  return { vote, button: screen.getByRole('button'), ...utils };
};

describe('VoteButtonAnimation per-pointer-type behavior', () => {
  it('registers a strong upvote when a mouse is held past the delay', () => {
    jest.useFakeTimers();
    try {
      const { vote, button } = renderVoteButton("neutral");
      firePointerDown(button, 'mouse');
      fireEvent.mouseDown(button);
      act(() => { jest.advanceTimersByTime(strongVoteDelay); });
      fireEvent.mouseUp(button);
      expect(vote).toHaveBeenCalledWith('big');
    } finally {
      jest.useRealTimers();
    }
  });

  it('does NOT strong-upvote on a touch hold (touch uses tap, not hold)', () => {
    jest.useFakeTimers();
    try {
      const { vote, button } = renderVoteButton("neutral");
      firePointerDown(button, 'touch');
      fireEvent.mouseDown(button);
      act(() => { jest.advanceTimersByTime(strongVoteDelay); });
      fireEvent.mouseUp(button);
      // No hold-triggered "big"; the tap comes from the click instead.
      expect(vote).not.toHaveBeenCalled();
      fireEvent.click(button);
      expect(vote).toHaveBeenCalledTimes(1);
      expect(vote).toHaveBeenCalledWith('small');
    } finally {
      jest.useRealTimers();
    }
  });

  it('reclassifies per interaction on a hybrid mouse+touch device', () => {
    // Touch first: tap-to-cycle applies (one vote, from the click).
    const { vote, button } = renderVoteButton("neutral");
    firePointerDown(button, 'touch');
    fireEvent.click(button);
    expect(vote).toHaveBeenCalledTimes(1);
    expect(vote).toHaveBeenLastCalledWith('small');

    // Then a mouse interaction on the same element: click-and-hold path is used
    // and the trailing click does NOT double-vote, proving per-interaction
    // classification.
    vote.mockClear();
    firePointerDown(button, 'mouse');
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.click(button);
    expect(vote).toHaveBeenCalledTimes(1);
  });
});
