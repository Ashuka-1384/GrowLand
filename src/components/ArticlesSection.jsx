import { useMemo } from 'react';
import './ArticlesSection.css';
import articles from '../data/articles.json';
import ArticlesArchive from './ArticlesArchive';

function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></svg>;
}

const getTime = (article) => Number.isFinite(Date.parse(article.date)) ? Date.parse(article.date) : 0;

export default function ArticlesSection({ archiveOpen = false, onArchiveOpen, onArchiveClose }) {
  const latestArticles = useMemo(() => [...articles].sort((a, b) => getTime(b) - getTime(a)).slice(0, 3), []);
  const openArchive = () => { onArchiveOpen?.(); };

  return (
    <>
      <section id="articles" className="articles-section section" aria-label="Latest GrowLand articles">
        <div className="container">
          <div className="section-title articles-section__title">
            <div className="section-title__dot" aria-hidden="true" />
            <h2>Latest Articles</h2>
          </div>

          <div className="articles-section__intro">
            <div>
              <p className="articles-section__eyebrow">GROWLAND / INSIGHTS</p>
              <h3>Three fresh ideas from the GrowLand knowledge stream.</h3>
            </div>
            <div className="articles-section__intro-actions">
              <p className="articles-section__desc">The homepage stays focused: only the three newest articles appear here. The complete archive lives in its dedicated reading view.</p>
              <button type="button" className="articles-section__archive-btn" onClick={openArchive}>
                <span>View all articles</span><ArrowIcon />
              </button>
            </div>
          </div>

          <div className="articles-grid">
            {latestArticles.map((article, index) => (
              <a className="article-card" href={article.path} key={article.slug} target="_blank" rel="noreferrer" style={{ '--article-delay': `${index * 80}ms` }}>
                <div className="article-card__visual" aria-hidden="true">
                  <span className="article-card__orb article-card__orb--one" />
                  <span className="article-card__orb article-card__orb--two" />
                  <span className="article-card__grid" />
                  <span className="article-card__number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="article-card__readtime">{article.readTime}</span>
                </div>
                <div className="article-card__body">
                  <div className="article-card__meta"><span>{article.category}</span><span>{article.date}</span></div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="article-card__footer">
                    <div className="article-card__tags">{article.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <span className="article-card__arrow"><ArrowIcon /></span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {!latestArticles.length && (
            <div className="articles-empty">No articles are published yet.</div>
          )}
        </div>
      </section>

      {archiveOpen && <ArticlesArchive articles={articles} onClose={() => onArchiveClose?.()} />}
    </>
  );
}
