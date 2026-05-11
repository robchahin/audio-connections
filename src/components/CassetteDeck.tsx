export function CassetteDeck() {
  return (
    <div className="cassette-deck">
      <span className="reel" />
      <div className="tape-strip" />
      <div className="tape-window">
        <span className="waveform-bar" />
        <span className="waveform-bar" />
        <span className="waveform-bar" />
        <span className="waveform-bar" />
        <span className="waveform-bar" />
      </div>
      <div className="tape-strip" />
      <span className="reel" />
    </div>
  );
}
