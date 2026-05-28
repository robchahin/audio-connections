import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 20,
  date: '2026-05-29',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-29T00:00:00Z',
  themes: [
    {
      theme: 'Songs about food',
      tracks: [
        { id: 1861769503, artist: 'The Presidents of the United States of America', title: 'Peaches' },
        { id: 1440673656, artist: 'Jimmy Buffett', title: 'Cheeseburger in Paradise' },
        { id: 250495319, artist: '"Weird Al" Yankovic', title: 'Eat It' },
        { id: 193126493, artist: 'System of a Down', title: "Chic 'N' Stu" },
      ],
    },
    {
      theme: "Onomatopoeia in the title — Holy '66, Batman!",
      tracks: [
        { id: 30394505, artist: 'Bobby Darin', title: 'Splish Splash' },
        { id: 1735534479, artist: 'Nancy Sinatra', title: 'Bang Bang (My Baby Shot Me Down)' },
        { id: 1443060256, artist: 'Black Eyed Peas', title: 'Boom Boom Pow' },
        { id: 1603515814, artist: 'Charli XCX', title: 'Boom Clap' },
      ],
    },
    {
      theme: 'Michael McDonald guest vocals',
      tracks: [
        { id: 1845049884, artist: 'Christopher Cross', title: 'Ride Like the Wind' },
        { id: 1706428468, artist: 'Steely Dan', title: 'Peg' },
        { id: 1444223467, artist: 'James Ingram & Michael McDonald', title: 'Yah Mo B There', note: 'Ya mo burn this place to the ground' },
        { id: 1197789382, artist: 'Thundercat', title: 'Show You the Way' },
      ],
    },
    {
      theme: "#1 hit off the artist's debut album",
      tracks: [
        { id: 1377826892, artist: "Guns N' Roses", title: "Sweet Child o' Mine", note: 'Appetite for Destruction' },
        { id: 1321155903, artist: 'Pet Shop Boys', title: 'West End Girls', note: 'Please' },
        { id: 1308542773, artist: 'Christina Aguilera', title: 'Genie in a Bottle', note: 'Christina Aguilera' },
        { id: 282960968, artist: 'Men at Work', title: 'Down Under', note: 'Business as Usual' },
      ],
    },
  ],
};

export default puzzle;
