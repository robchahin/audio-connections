import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 13,
  date: '2026-05-22',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-22T00:00:00Z',
  themes: [
    {
      theme: 'Dance in the title',
      tracks: [
        { id: 1440562877, artist: 'Chubby Checker', title: 'The Twist' },
        { id: 258647008, artist: 'Los del Río', title: 'Macarena' },
        { id: 1445144527, artist: 'PSY', title: 'Gangnam Style' },
        { id: 432437410, artist: 'Little Eva', title: 'The Loco-Motion' },
      ],
    },
    {
      theme: 'Bands named after the U.S. or an American place',
      tracks: [
        { id: 28457962, artist: 'Chicago', title: '25 or 6 to 4', note: 'Chicago' },
        { id: 913902137, artist: 'Boston', title: 'More Than a Feeling', note: 'Boston' },
        { id: 190655992, artist: 'Kansas', title: 'Carry On Wayward Son', note: 'Kansas' },
        { id: 301027918, artist: 'America', title: 'A Horse with No Name', note: 'the U.S.' },
      ],
    },
    {
      theme: 'Instrumental hits (no vocals)',
      tracks: [
        { id: 319516998, artist: 'The Champs', title: 'Tequila' },
        { id: 159363080, artist: "Booker T. & the M.G.'s", title: 'Green Onions' },
        { id: 157274264, artist: 'The Edgar Winter Group', title: 'Frankenstein' },
        { id: 575085502, artist: 'Santo & Johnny', title: 'Sleep Walk' },
      ],
    },
    {
      theme: 'Academy Award – Best Original Song winners',
      tracks: [
        { id: 333708790, artist: 'Andy Williams', title: 'Moon River', note: "Breakfast at Tiffany's (1961)" },
        { id: 1446743353, artist: 'Stevie Wonder', title: 'I Just Called to Say I Love You', note: 'The Woman in Red (1984)' },
        { id: 254938549, artist: 'Bill Medley & Jennifer Warnes', title: "(I've Had) The Time of My Life", note: 'Dirty Dancing (1987)' },
        { id: 387194076, artist: 'Berlin', title: 'Take My Breath Away', note: 'Top Gun (1986)' },
      ],
    },
  ],
};

export default puzzle;
