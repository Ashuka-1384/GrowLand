export default function SectionTitle({eyebrow,title,desc}){return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2>{desc&&<p>{desc}</p>}</div>}
