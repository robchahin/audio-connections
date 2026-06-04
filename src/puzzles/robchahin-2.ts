import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Rob Chahin',
  themes: [
    {
      theme: 'Singers with two first names',
      tracks: [
        { id: 380590584, artist: 'Paul Simon', title: '50 Ways to Leave Your Lover' },
        { id: 1440739852, artist: 'Diana Ross', title: "Ain't No Mountain High Enough" },
        { id: 1421658123, artist: 'Travis Scott', title: 'SICKO MODE' },
        { id: 452584449, artist: 'Ray Charles', title: 'Shake a Tail Feather' },
      ],
    },
    {
      theme: 'Songs with no drums',
      tracks: [
        { id: 1308648844, artist: 'Fleetwood Mac', title: 'Landslide' },
        { id: 1445752097, artist: 'Extreme', title: 'More Than Words' },
        { id: 1544491998, artist: 'Adele', title: 'Someone Like You' },
        { id: 1441844542, artist: 'John Legend', title: 'All of Me' },
      ],
    },
    {
      theme: 'Songs used in SNL sketches',
      tracks: [
        { id: 1731384547, artist: 'Haddaway', title: 'What Is Love', note: 'Night at the Roxbury' },
        { id: 217556132, artist: 'Blue Öyster Cult', title: "(Don't Fear) The Reaper", note: 'More Cowbell' },
        { id: 1785686649, artist: 'Imogen Heap', title: 'Hide and Seek', note: 'Dear Sister' },
        { id: 1809209397, artist: 'Loverboy', title: 'Working for the Weekend', note: 'Chippendales Audition' },
      ],
    },
    {
      theme: 'Songs their performers soured on',
      tracks: [
        { id: 1517447333, artist: 'Oasis', title: 'Wonderwall', note: 'Liam Gallagher said singing it made him want to gag' },
        { id: 1679849823, artist: 'Radiohead', title: 'Creep', note: 'Thom Yorke dismissed it as "crap"; the band shelved it for years' },
        { id: 580708180, artist: 'Led Zeppelin', title: 'Stairway to Heaven', note: 'Robert Plant has long been tired of performing it' },
        { id: 1440912353, artist: 'Beastie Boys', title: 'Fight for Your Right', note: 'They disliked how its parody became a frat anthem' },
      ],
    },
  ],
};

export default puzzle;
