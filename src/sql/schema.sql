CREATE TABLE IF NOT EXISTS assets (
    path TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
    path TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    template TEXT NOT NULL DEFAULT 'base.html',
    data TEXT,
    published_date TEXT
); 
