import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: 'Spelled-out letters in the title',
      tracks: [
        { id: 1443926626, artist: 'Village People', title: 'Y.M.C.A.' },
        { id: 715748058, artist: 'Nat King Cole', title: 'L-O-V-E' },
        { id: 259751997, artist: 'Justice', title: 'D.A.N.C.E.' },
        { id: 1422648966, artist: 'ABBA', title: 'SOS' },
      ],
    },
    {
      theme: 'Songs made for video games',
      tracks: [
        { id: 1445150297, artist: 'Breaking Benjamin', title: 'Blow Me Away', note: 'Halo 2' },
        { id: 929920756, artist: 'Ted Poley & Tony Harnell', title: 'Escape from the City', note: 'Sonic Adventure 2' },
        {
          id: 1540793097,
          artist: 'Rosa Walton & Hallie Coggins',
          title: 'I Really Want to Stay at Your House',
          note: 'Cyberpunk 2077 / Edgerunners',
        },
        { id: 1645947564, artist: 'Lil Nas X', title: "STAR WALKIN'", note: 'League of Legends' },
      ],
    },
    {
      theme: 'A unit of time in the title',
      tracks: [
        { id: 724040009, artist: 'Robbie Williams', title: 'Millennium' },
        { id: 65122547, artist: 'Alphaville', title: 'Forever Young' },
        { id: 271371090, artist: 'Bowling for Soup', title: '1985' },
        { id: 1443111432, artist: 'Scott Walker', title: '30 Century Man' },
      ],
    },
    {
      theme: 'Famous for the Wall of Sound',
      tracks: [
        { id: 420123652, artist: 'The Ronettes', title: 'Be My Baby', note: 'Phil Spector' },
        { id: 1440843863, artist: 'The Beach Boys', title: "Wouldn't It Be Nice", note: 'Brian Wilson' },
        { id: 1504111288, artist: 'Bonnie Tyler', title: 'Total Eclipse of the Heart', note: 'Jim Steinman' },
        { id: 994424268, artist: 'Sonny & Cher', title: 'I Got You Babe', note: 'Sonny Bono' },
      ],
    },
  ],
};

export default puzzle;
