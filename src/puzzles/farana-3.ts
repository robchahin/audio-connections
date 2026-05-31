import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Frank Arana',
  themes: [
    {
      theme: 'Song titles that reference the calendar',
      tracks: [
        { id: 1771709877, artist: 'Phoenix', title: '1901', note: 'The Belle Époque Era' },
        { id: 1440839338, artist: 'Sublime', title: 'April 29th, 1992 (Miami)', note: 'LA Riots' },
        { id: 1468263384, artist: 'Charli XCX', title: 'February 2017', note: 'Bad time for Charlotte' },
        { id: 1440823965, artist: 'Bryan Adams', title: "Summer of '69", note: 'The best days of his life' },
      ],
    },
    {
      theme: 'Songs about teenage rebellion',
      tracks: [
        { id: 306676853, artist: 'DJ Jazzy Jeff & the Fresh Prince', title: "Parents just don't understand", note: '' },
        { id: 1649315667, artist: 'Black Lips', title: 'Bad Kids', note: '' },
        { id: 1440912353, artist: 'Beastie Boys', title: "Fight for Your Right", note: '' },
        { id: 209388998, artist: 'My Chemical Romance', title: 'Teenagers', note: '' },
      ],
    },
    {
      theme: 'Songs sung by children',
      tracks: [
        { id: 1446924089, artist: 'Musical Youth', title: 'Pass the Dutchie', note: '11 to 15' },
        { id: 170147030, artist: 'Kriss Kross', title: 'Jump', note: '12 and 13' },
        { id: 1440661545, artist: 'Justin Bieber', title: 'Baby', note: '15' },
        { id: 252933316, artist: 'Shirley Temple', title: 'Animal Crackers in My Soup', note: '6' },
      ],
    },
        {
      theme: 'VMA video of the year winners',
      tracks: [
        { id: 270246724, artist: 'TLC', title: 'Waterfalls', note: '' },
        { id: 1476727670, artist: 'Lady Gaga', title: 'Bad Romance', note: '' },
        { id: 1479062292, artist: 'Jamiroquai', title: 'Virtual Insanity', note: '' },
        { id: 1032178989, artist: 'Outkast', title: 'Hey Ya!', note: '' },
      ],
    },
  ],
};

export default puzzle;
