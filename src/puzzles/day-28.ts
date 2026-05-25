import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 28,
  date: '2026-06-06',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-06-06T00:00:00Z',
  themes: [
    {
      theme: 'Anime theme songs',
      tracks: [
        { id: 1521453384, artist: 'The Seatbelts', title: 'Tank!', note: 'Cowboy Bebop' },
        { id: 1540549381, artist: 'Yoko Takahashi', title: "A Cruel Angel's Thesis", note: 'Neon Genesis Evangelion' },
        { id: 1613377502, artist: 'Rui Nagai', title: 'Big-O!', note: 'The Big O' },
        { id: 1689408288, artist: 'DALI', title: 'Moonlight Legend', note: 'Sailor Moon' },
      ],
    },
    {
      theme: 'Animal in the title',
      tracks: [
        { id: 1440832763, artist: 'Steve Miller Band', title: 'Fly Like an Eagle' },
        { id: 304760997, artist: 'The Tokens', title: 'The Lion Sleeps Tonight' },
        { id: 983126008, artist: "The B-52's", title: 'Rock Lobster' },
        { id: 724214046, artist: 'Culture Club', title: 'Karma Chameleon' },
      ],
    },
    {
      theme: 'Artists who changed their name',
      tracks: [
        { id: 1442846328, artist: 'Kanye West', title: 'Stronger', note: 'now Ye' },
        { id: 1683195628, artist: 'Snoop Dogg', title: 'Gin and Juice', note: 'briefly Snoop Lion' },
        { id: 1586832573, artist: 'Cat Stevens', title: 'Peace Train', note: 'now Yusuf' },
        { id: 1545712784, artist: 'Prince', title: 'When Doves Cry', note: 'became "the Artist"' },
      ],
    },
    {
      theme: 'Did covers on social media first',
      tracks: [
        { id: 1440826320, artist: 'Justin Bieber', title: 'Sorry' },
        { id: 1729494488, artist: 'Madison Beer', title: 'Make You Mine' },
        { id: 1579117772, artist: 'Bella Poarch & Sub Urban', title: 'Inferno' },
        { id: 1724488124, artist: 'Benson Boone', title: 'Beautiful Things' },
      ],
    },
  ],
};

export default puzzle;
