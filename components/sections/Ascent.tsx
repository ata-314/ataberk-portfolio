import type { Locale } from "@/lib/i18n";
import "./ascent.css";

export function Ascent({ locale }: { locale: Locale }) {
  const tr = locale === "tr";
  return (
    <section id="ascent" className="ascent" aria-labelledby="ascent-title">
      <div className="ascent-frame">
        <div className="ascent-copy">
          <p className="ascent-kicker">{tr ? "Gökyüzünden sonsuzluğa" : "From sky to infinity"}</p>
          <h2 id="ascent-title">{tr ? <>Yerçekiminin<br />ötesinde.</> : <>Beyond<br />gravity.</>}</h2>
          <p>{tr ? "Bir fikir yükselir. Veriye dönüşür. Yeni dünyalar kurar." : "An idea takes flight. Becomes data. Builds new worlds."}</p>
        </div>
        <span className="ascent-caption" aria-hidden="true">{tr ? "Yolculuk devam ediyor ↓" : "The journey continues ↓"}</span>
      </div>
    </section>
  );
}
