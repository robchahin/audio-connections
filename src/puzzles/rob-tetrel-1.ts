import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Rob Wood',
  themes: [
    {
      theme: 'Songs including lyrics about #hats',
      tracks: [
        { id: 1148701950, artist: 'Phil Collins', title: "Wear My Hat" },
        { id: 1530394464, artist: 'ABBA', title: "Put On Your White Sombrero" },
        { id: 1462201146, artist: 'The Lonesome Valley Singers', title: "The Ballad of the Green Berets" },
        { id: 1230065833, artist: 'Lyle Lovett', title: "Don't Touch My Hat" },
      ],
    },
    {
      theme: '7 deadly sins',
      tracks: [
        { id: 1440881578, artist: 'Kendrick Lamar', title: "Pride" },
        { id: 1322605877, artist: 'Lil Skies', title: "Lust" },
        { id: 1743321886, artist: 'Godsmack', title: "Greed" },
        { id: 1817382561, artist: 'Smashing Pumpkins', title: "Wrath" },
      ],
    },
    {
      theme: 'Songs with common mondegreens (misheard lyrics)',
      tracks: [
        { id: 1199683433, artist: 'Manfred Mann', title: "Blinded by the Light", note: "wrapped up like a douche" },
        { id: 1441164852, artist: 'The Beatles', title: "Lucy in the Sky With Diamonds", note: "The girl with colitis goes by" },
        { id: 1440935808, artist: 'Taylor Swift', title: "Blank Space", note: "All the lonely Starbucks lovers" },
        { id: 344780230, artist: 'Jimi Hendrix', title: "Purple Haze", note: "Excuse me while I kiss this guy" },
      ],
    },
    {
      theme: 'Mustachioed lead singers',
      tracks: [
        { id: 1440928429, artist: 'Frank Zappa', title: "Don't Eat the Yellow Snow" },
        { id: 1440809049, artist: 'Lionel Richie', title: "Hello" },
        { id: 1440650733, artist: 'Queen', title: "Don't Stop Me Now" },
        { id: 947701045, artist: 'Red Hot Chili Peppers', title: "Suck My Kiss" },
      ],
    },
  ],
};

export default puzzle;
