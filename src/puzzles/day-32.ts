import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 32,
  date: '2026-06-11',
  author: 'J. Bowman Light',
  releaseAt: '2026-06-11T00:00:00Z',
  themes: [
    {
      theme: 'King of...',
      tracks: [
        { id: 1440674163, artist: 'The Police', title: 'King of Pain' },
        { id: 1445094813, artist: 'Roger Miller', title: 'King of the Road' },
        { id: 390601837, artist: 'Sara Bareilles', title: 'King of Anything' },
        { id: 445968990, artist: 'The Tallest Man on Earth', title: 'King of Spain' },
      ],
    },
    {
      theme: 'This is it (or is it?)',
      tracks: [
        { id: 192662025, artist: 'Kenny Loggins', title: 'This Is It' },
        { id: 266376961, artist: 'The Strokes', title: 'Is This It' },
        { id: 1440826000, artist: 'Huey Lewis & The News', title: 'If This Is It' },
        { id: 336644242, artist: 'Michael Jackson', title: 'This Is It' },
      ],
    },
    {
      theme: 'Bands named after songs',
      tracks: [
        { id: 966389075, artist: 'Death Cab for Cutie', title: 'You Are a Tourist', note: "Named after the Bonzo Dog Band's 'Death Cab for Cutie'" },
        { id: 1778048261, artist: 'Jet', title: 'Are You Gonna Be My Girl', note: "Named after Wings' 'Jet'" },
        { id: 1440765744, artist: 'The Rolling Stones', title: "Jumpin' Jack Flash", note: "Named after Muddy Waters's 'Rollin' Stone'" },
        { id: 1679849823, artist: 'Radiohead', title: 'Creep', note: "Named after Talking Heads's 'Radio Head'" },
      ],
    },
    {
      theme: 'Parodied by Weird Al Yankovic',
      tracks: [
        { id: 269573341, artist: 'Michael Jackson', title: 'Beat It', note: 'Eat It' },
        { id: 716268684, artist: 'The Knack', title: 'My Sharona', note: 'My Bologna' },
        { id: 80815215, artist: 'Madonna', title: 'Like A Virgin', note: 'Like A Surgeon' },
        { id: 1604645502, artist: 'Coolio', title: "Gangsta's Paradise", note: 'Amish Paradise' },
      ],
    },
  ],
};

export default puzzle;
