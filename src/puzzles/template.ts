import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 1,
  date: 'YYYY-MM-DD',
  author: 'Name goes here',
  releaseAt: '2026-05-T00:00:00Z',
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
