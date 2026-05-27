// New here? See PUZZLE_AUTHORS.md at the repo root for the full guide.
// Copy this file to src/puzzles/day-NN.ts, fill in the fields, then run
// `npm run validate` to check your work before opening a PR.

import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 1,
  date: 'YYYY-MM-DD',
  author: 'Name goes here',
  releaseAt: 'YYYY-MM-DDT00:00:00Z',
  // constraint: 'All singing, all dancing',  // optional pill + DJ-note modal; keep it phrase-length (80 char soft cap)
  themes: [
    {
      theme: 'Set Theme',
      tracks: [
        { id: 1, artist: 'Artist', title: 'Track Title', note: 'Optional note about the track' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
      ],
    },
    {
      theme: '',
      tracks: [
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
      ],
    },
    {
      theme: '',
      tracks: [
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
      ],
    },
    {
      theme: '',
      tracks: [
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
        { id: 0, artist: '', title: '', note: '' },
      ],
    },
  ],
};

export default puzzle;
