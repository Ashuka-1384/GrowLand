import './ArticlesSection.css';
import articles from '../data/articles.json';

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export default function ArticlesSection() {
  return (
    <section id="articles" className="articles-section section" aria-label="GrowLand articles">
      <div className="container">
        <div className="section-title articles-section__title">
          <div className="section-title__dot" aria-hidden="true" />
          <h2>Articles</h2>
        </div>

        <div className="articles-section__intro">
          <div>
            <p className="articles-section__eyebrow">GROWLAND / INSIGHTS</p>
            <h3>Ideas, systems and practical notes for deliberate growth.</h3>
          </div>
          <p className="articles-section__desc">
            Every article uses the same editorial system, so new HTML articles can be added without rebuilding the visual language from scratch.
          </p>
        </div>

        <div className="articles-grid">
          {articles.map((article, index) => (
            <a
              className="article-card"
              href={article.path}
              key={article.slug}
              target="_blank"
              rel="noreferrer"
              style={{ '--article-delay': `${index * 80}ms` }}
            >
              <div className="article-card__visual" aria-hidden="true">
                <span className="article-card__orb article-card__orb--one" />
                <span className="article-card__orb article-card__orb--two" />
                <span className="article-card__grid" />
                <span className="article-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="article-card__readtime">{article.readTime}</span>
              </div>

              <div className="article-card__body">
                <div className="article-card__meta">
                  <span>{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>

                <div className="article-card__footer">
                  <div className="article-card__tags">
                    {article.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <span className="article-card__arrow"><ArrowIcon /></span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="articles-section__template-note">
          <div className="articles-section__template-icon" aria-hidden="true">&lt;/&gt;</div>
          <div>
            <strong>Article system ready</strong>
            <p>Use <code>public/articles/template.html</code> as the starting point for every new article and keep the shared design in <code>public/articles/article.css</code>.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
