# GrowLand Article Publishing

## Add a new article

1. Copy `template.html` and rename it, for example `new-topic.html`.
2. Replace the title, description, category, author, date, cover labels and article body.
3. Keep `<link rel="stylesheet" href="./article.css" />` so the article uses the shared global design.
4. Add one metadata object to `src/data/articles.json` with the same public URL, for example `/articles/new-topic.html`.

The React dashboard reads `src/data/articles.json` to build the Articles section. The article itself stays a standalone static HTML page inside `public/articles/`.
