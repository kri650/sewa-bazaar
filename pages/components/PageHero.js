export default function PageHero({ eyebrow, title, subhead }) {
  return (
    <section className="pageHero">
      <div className="pageHeroInner">
        {eyebrow ? <p className="pageHeroEyebrow">{eyebrow}</p> : null}
        <h1 className="pageHeroTitle">{title}</h1>
        {subhead ? <p className="pageHeroSubhead">{subhead}</p> : null}
      </div>
    </section>
  )
}
