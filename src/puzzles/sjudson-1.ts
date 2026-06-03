// New here? See PUZZLE_AUTHORS.md at the repo root for the full guide.
// Copy this file to src/puzzles/<your-github-handle>-N.ts,
// fill in the fields, then run `npm run validate` to check your work before
// opening a PR. The day number and release date aren't set here — a maintainer
// schedules those in src/schedule.ts.

import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Samuel Judson',
  constraint: 'King of Funk, Queen of Soul',  // optional pill + DJ-note modal; keep it phrase-length (80 char soft cap)
  themes: [
    {
      theme: 'P-Funk Family Tree',
      tracks: [
        { id: 257209743, artist: 'Eddie Hazel', title: 'California Dreamin\'', note: '' },
        { id: 1595684144, artist: 'Ohio Players', title: 'Funky Worm', note: 'some Junie Morrison magic' },
        { id: 1443215213, artist: 'The J.B.\'s', title: 'Doing It to Death', note: 'Maceo Parker and Fred Wesley on fire' },
        { id: 290073037, artist: 'Talking Heads', title: 'Burning Down The House (Live)', note: 'from Stop Making Sense with Bernie Worrell on keys' },
      ],
    },
    {
      theme: 'Psalms and Hymns',
      tracks: [
        { id: 448055233, artist: 'Hubert Parry (orch. Elgar)', title: 'Jerusalem', note: '' },
        { id: 895121514, artist: 'Chuck Brown', title: 'Oh Happy Day', note: '' },
        { id: 1628093970, artist: 'Aretha Franklin', title: 'Give Yourself To Jesus', note: '' },
        { id: 261232366, artist: 'Aaron Copland', title: 'Variations on a Shaker Hymn', note: 'Appalachian Spring Suite: VII' },
      ],
    },
    {
      theme: 'Sampling the Master',
      tracks: [
        { id: 1657705243, artist: 'De La Soul', title: 'Me, Myself, and I', note: 'samples (Not Just) Knee Deep and, as a bonus, Funky Worm' },
        { id: 1668461354, artist: 'Dr. Dre', title: 'Let Me Ride', note: 'samples Mothership Connection (Star Child)' },
        { id: 201275394, artist: 'Beyonce', title: 'Be With You', note: 'samples I\'d Rather Be With You' },
        { id: 423931470, artist: 'Kirk Franklin', title: 'Stomp (Remix)', note: 'samples One Nation Under A Groove' },
      ],
    },
    {
      theme: 'You Didn\'t Survive Divas Live \'98',
      tracks: [
        { id: 747087698, artist: 'Carole King', title: '(You Make Me Feel Like) A Natural Woman', note: '' },
        { id: 1481507900, artist: 'Celine Dion', title: 'My Heart Will Go On', note: '' },
        { id: 1445668856, artist: 'Shania Twain', title: 'Man! I Feel Like A Woman!', note: '' },
        { id: 203304743, artist: 'Gloria Estefan', title: 'Turn the Beat Around', note: '' },
      ],
    },
  ],
};

export default puzzle;
