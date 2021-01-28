create table authors (
  id serial primary key,
  name text
);

create table books (
  id serial primary key,
  title text,
  author_id integer,
  summary text,
  genre text,
  published integer,
  CONSTRAINT fk_author_id FOREIGN KEY(author_id) REFERENCES authors(id)
);

INSERT INTO authors (name) VALUES ('Jane Austen'), ('Douglas Adams'), ('Terry Pratchett'), ('Donald Knuth');

INSERT INTO books
  (title, author_id, published, genre, summary)
VALUES
  ('Pride and Prejudice', 1, 1813, 'satire', 'The best novel written in the English language.'),
  ('Dirk Gently''s Holistic Detective Agency', 2, 1987, 'SFF', 'This is the Doctor Who serial Shada and Professor Chronotis is a Time Lord.'),
  ('Small Gods', 3, 1992, 'SFF', 'A turtle gains great power. Hijinks ensue.'),
  ('The Art of Programming, Vol 1', 4, 1968, 'nonfiction', 'A professor invents his own programming language to describe algorithms. Riveting.');
