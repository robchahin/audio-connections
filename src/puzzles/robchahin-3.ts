import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Rob Chahin',
  constraint: "Something's Weird Today",
  themes: [
    {
      theme: 'Food',
      tracks: [
        { id: 250495319, artist: '"Weird Al" Yankovic', title: 'Eat It' },
        { id: 308442149, artist: '"Weird Al" Yankovic', title: 'My Bologna' },
        { id: 308442141, artist: '"Weird Al" Yankovic', title: 'I Love Rocky Road' },
        { id: 250500626, artist: '"Weird Al" Yankovic', title: 'Lasagna' },
      ],
    },
    {
      theme: 'Movie plots',
      tracks: [
        { id: 250502773, artist: '"Weird Al" Yankovic', title: 'The Saga Begins' },
        { id: 250599514, artist: '"Weird Al" Yankovic', title: 'Yoda' },
        { id: 250491531, artist: '"Weird Al" Yankovic', title: 'Jurassic Park' },
        { id: 206900843, artist: '"Weird Al" Yankovic', title: 'Gump' },
      ],
    },
    {
      theme: 'Songs about music',
      tracks: [
        { id: 250495085, artist: '"Weird Al" Yankovic', title: 'Smells Like Nirvana' },
        { id: 250491686, artist: '"Weird Al" Yankovic', title: 'Achy Breaky Song' },
        { id: 250500616, artist: '"Weird Al" Yankovic', title: "(This Song's Just) Six Words Long" },
        { id: 438358909, artist: '"Weird Al" Yankovic', title: 'Perform This Way' },
      ],
    },
    {
      theme: 'Original songs / style parodies',
      tracks: [
        { id: 250599503, artist: '"Weird Al" Yankovic', title: 'Dare to Be Stupid', note: 'Devo' },
        { id: 250494879, artist: '"Weird Al" Yankovic', title: 'Dog Eat Dog', note: 'Talking Heads' },
        { id: 438358970, artist: '"Weird Al" Yankovic', title: 'Craigslist', note: 'The Doors' },
        { id: 891836411, artist: '"Weird Al" Yankovic', title: 'First World Problems', note: 'Pixies' },
      ],
    },
  ],
};

export default puzzle;
