import type { PuzzleContent } from '../types';

// THROWAWAY — E2E shakedown of the derived-day author flow on the fork.
// Uses recycled real iTunes IDs from released days so the iTunes check passes;
// this file + its src/schedule.ts entry are reverted right after the test.
const puzzle: PuzzleContent = {
  author: 'E2E Test',
  themes: [
    {
      theme: 'Recycled set A',
      tracks: [
        { id: 507536740, artist: 'Céline Dion', title: 'My Heart Will Go On' },
        { id: 254685026, artist: 'Survivor', title: 'Eye of the Tiger' },
        { id: 1440903439, artist: 'Eminem', title: 'Lose Yourself' },
        { id: 203304387, artist: 'Simon & Garfunkel', title: 'Mrs. Robinson' },
      ],
    },
    {
      theme: 'Recycled set B',
      tracks: [
        { id: 1440783625, artist: 'Nirvana', title: 'Smells Like Teen Spirit' },
        { id: 217273922, artist: 'Johnny Nash', title: 'I Can See Clearly Now' },
        { id: 1550208949, artist: 'Mariah Carey', title: 'Touch My Body' },
        { id: 1444106658, artist: 'Marvin Gaye', title: 'I Heard It Through the Grapevine' },
      ],
    },
    {
      theme: 'Recycled set C',
      tracks: [
        { id: 1434916256, artist: 'Joe Cocker', title: 'With a Little Help from My Friends' },
        { id: 1469582093, artist: 'Stevie Wonder', title: 'We Can Work It Out' },
        { id: 995304388, artist: 'Tina Turner', title: 'Help!' },
        { id: 1738363769, artist: 'Beyoncé', title: 'BLACKBIIRD' },
      ],
    },
    {
      theme: 'Recycled set D',
      tracks: [
        { id: 1752214923, artist: 'Sabrina Carpenter', title: 'Espresso' },
        { id: 169628364, artist: 'Spin Doctors', title: 'Two Princes' },
        { id: 1440797616, artist: 'The Police', title: 'Roxanne' },
        { id: 20922894, artist: 'The Postal Service', title: 'Such Great Heights' },
      ],
    },
  ],
};

export default puzzle;
