import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: 'Songs about fire',
      tracks: [
        { id: 1121329085, artist: 'The Trammps', title: 'Disco Inferno' },
        { id: 251002253, artist: 'Johnny Cash', title: 'Ring of Fire' },
        { id: 158816462, artist: 'Billy Joel', title: "We Didn't Start the Fire" },
        { id: 1741021428, artist: 'The Prodigy', title: 'Fire' },
      ],
    },
    {
      theme: 'Songs about rainbows',
      tracks: [
        { id: 281116081, artist: 'Boards of Canada', title: 'ROYGBIV' },
        { id: 6920352, artist: "Israel Kamakawiwo'ole", title: 'Somewhere Over the Rainbow' },
        { id: 1440805962, artist: 'Kermit the Frog', title: 'Rainbow Connection' },
        { id: 1440787254, artist: 'Louis Armstrong', title: 'What a Wonderful World' },
      ],
    },
    {
      theme: 'Songs used in Donnie Darko',
      tracks: [
        { id: 906900619, artist: 'Gary Jules', title: 'Mad World' },
        { id: 1440825700, artist: 'Tears for Fears', title: 'Head Over Heels' },
        { id: 693606402, artist: 'Duran Duran', title: 'Notorious' },
        { id: 31740178, artist: 'Echo & the Bunnymen', title: 'The Killing Moon' },
      ],
    },
    {
      theme: 'Dancers turned pop stars',
      tracks: [
        { id: 723700423, artist: 'Paula Abdul', title: 'Straight Up', note: 'Laker Girl' },
        { id: 265144699, artist: 'Jennifer Lopez', title: 'Waiting for Tonight', note: 'Fly Girl on In Living Color' },
        { id: 188261029, artist: 'Shakira', title: 'Whenever, Wherever', note: 'Belly dancer' },
        { id: 1440662037, artist: '2Pac', title: 'Changes', note: 'Digital Underground' },
      ],
    },
  ],
};

export default puzzle;
