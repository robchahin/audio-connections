import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 14,
  date: '2026-05-23',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-23T00:00:00Z',
  themes: [
    {
      theme: 'Number in the title',
      tracks: [
        { id: 1446013598, artist: 'Nena', title: '99 Luftballons' },
        { id: 273166378, artist: 'Dolly Parton', title: '9 to 5' },
        { id: 1322068804, artist: 'Lou Bega', title: 'Mambo No. 5' },
        { id: 1450334168, artist: 'Ariana Grande', title: '7 rings' },
      ],
    },
    {
      theme: 'Famous saxophone solo',
      tracks: [
        { id: 693606496, artist: 'Gerry Rafferty', title: 'Baker Street' },
        { id: 193085066, artist: 'George Michael', title: 'Careless Whisper' },
        { id: 1531037503, artist: 'John Coltrane', title: 'Giant Steps' },
        { id: 1045058681, artist: 'Bruce Springsteen', title: 'Born to Run' },
      ],
    },
    {
      theme: "#1 hit off the artist's debut album",
      tracks: [
        { id: 1377826892, artist: "Guns N' Roses", title: "Sweet Child o' Mine", note: 'Appetite for Destruction' },
        { id: 716268684, artist: 'The Knack', title: 'My Sharona', note: 'Get the Knack' },
        { id: 273143820, artist: 'Britney Spears', title: '...Baby One More Time', note: '...Baby One More Time' },
        { id: 380907765, artist: 'a-ha', title: 'Take On Me', note: 'Hunting High and Low' },
      ],
    },
    {
      theme: 'Music video directed by Hype Williams',
      tracks: [
        { id: 302943332, artist: 'Missy Elliott', title: 'The Rain (Supa Dupa Fly)' },
        { id: 1440777314, artist: 'Jay-Z', title: "Big Pimpin'" },
        { id: 321975721, artist: 'Busta Rhymes', title: 'Put Your Hands Where My Eyes Could See' },
        { id: 1440763833, artist: 'Kanye West', title: 'Gold Digger' },
      ],
    },
  ],
};

export default puzzle;
