export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <section className="dots-container">
      <div className="dots-row">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <p className="loadlabel">{message}</p>
    </section>
  );
}
