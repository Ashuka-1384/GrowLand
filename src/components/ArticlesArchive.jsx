import { useEffect } from 'react';
import './ArticlesArchive.css';

function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></svg>;
}

const getTime = (article) => Number.isFinite(Date.parse(article.date)) ? Date.parse(article.date) : 0;

export default function ArticlesArchive({ articles, onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const sorted = [...articles].sort((a, b) => getTime(b) - getTime(a));

  return (
    <div className="articles-archive" role="dialog" aria-modal="true" aria-label="All GrowLand articles">
      <div className="articles-archive__backdrop" onClick={onClose} />
      <div className="articles-archive__shell">
        <header className="articles-archive__header">
          <div>
            <p className="articles-archive__eyebrow">GROWLAND / ARTICLE ARCHIVE</p>
            <h2>All Articles</h2>
            <p>Every published article, ordered from newest to oldest.</p>
          </div>
          <button className="articles-archive__close" onClick={onClose} aria-label="Close article archive">×</button>
        </header>

        <div className="articles-archive__count">{sorted.length} published {sorted.length === 1 ? 'article' : 'articles'}</div>

        <div className="articles-archive__list">
          {sorted.map((article, index) => (
            <a className="archive-card" key={article.slug} href={article.path} target="_blank" rel="noreferrer" style={{ '--archive-delay': `${Math.min(index, 12) * 40}ms` }}>
              <div className="archive-card__index">{String(index + 1).padStart(2, '0')}</div>
              <div className="archive-card__content">
                <div className="archive-card__meta"><span>{article.category}</span><span>{article.date} · {article.readTime}</span></div>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <div className="archive-card__tags">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
              <span className="archive-card__arrow"><ArrowIcon /></span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
