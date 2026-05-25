import type { LoadedTrack } from '../../types';

/** Build a fake LoadedTrack for the intro carousel. The intro renders Tiles in
 *  `displayOnly` mode, so previewUrl is never fetched and the id only needs to
 *  be unique within the demo. */
export function displayTrack(id: number, themeIdx: number, label: string): LoadedTrack {
  return {
    id,
    itunesId: 0,
    themeIdx,
    previewUrl: '',
    artist: '',
    title: label,
  };
}
