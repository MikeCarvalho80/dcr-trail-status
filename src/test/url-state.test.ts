import { describe, it, expect, beforeEach } from 'vitest';
import { readUrlState } from '../lib/useUrlState';

describe('readUrlState', () => {
  beforeEach(() => {
    // Reset URL to clean state
    window.history.replaceState(null, '', '/');
  });

  it('returns empty state for no params', () => {
    const state = readUrlState();
    expect(state.zip).toBeUndefined();
    expect(state.radius).toBeUndefined();
    expect(state.region).toBeUndefined();
    expect(state.search).toBeUndefined();
  });

  it('reads valid zip code', () => {
    window.history.replaceState(null, '', '/?zip=03101');
    const state = readUrlState();
    expect(state.zip).toBe('03101');
  });

  it('rejects invalid zip code', () => {
    window.history.replaceState(null, '', '/?zip=abc');
    const state = readUrlState();
    expect(state.zip).toBeUndefined();
  });

  it('reads radius as number', () => {
    window.history.replaceState(null, '', '/?radius=75');
    const state = readUrlState();
    expect(state.radius).toBe(75);
  });

  it('reads region', () => {
    window.history.replaceState(null, '', '/?region=Southern+NH');
    const state = readUrlState();
    expect(state.region).toBe('Southern NH');
  });

  it('reads difficulty', () => {
    window.history.replaceState(null, '', '/?difficulty=Beginner');
    const state = readUrlState();
    expect(state.difficulty).toBe('Beginner');
  });

  it('reads trail length filter', () => {
    window.history.replaceState(null, '', '/?length=50%2B');
    const state = readUrlState();
    expect(state.length).toBe('50+');
  });

  it('reads search query', () => {
    window.history.replaceState(null, '', '/?search=blue+hills');
    const state = readUrlState();
    expect(state.search).toBe('blue hills');
  });

  it('reads status filter', () => {
    window.history.replaceState(null, '', '/?status=open');
    const state = readUrlState();
    expect(state.status).toBe('open');
  });

  it('rejects invalid status filter', () => {
    window.history.replaceState(null, '', '/?status=invalid');
    const state = readUrlState();
    expect(state.status).toBeUndefined();
  });

  it('reads rideable flag', () => {
    window.history.replaceState(null, '', '/?rideable=1');
    const state = readUrlState();
    expect(state.rideable).toBe(true);
  });

  it('reads multiple params', () => {
    window.history.replaceState(null, '', '/?zip=02136&radius=50&region=Greater+Boston&rideable=1');
    const state = readUrlState();
    expect(state.zip).toBe('02136');
    expect(state.radius).toBe(50);
    expect(state.region).toBe('Greater Boston');
    expect(state.rideable).toBe(true);
  });
});
