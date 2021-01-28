create table books (
  id serial primary key,
  title text,
  slug text,
  author text,
  year integer,
  genre text
);

insert into "books" ("title", "slug", "author", "year", "genre") VALUES
  ('Pride and Prejudice', 'pride-and-prejudice', 'Jane Austen', 1813, 'satire' ),
  ('Dirk Gently''s Holistic Detective Agency', 'dirk-gentlys-holistic-detective-agency', 'Douglas Adams', 1987, 'SFF' ),
  ('Small Gods', 'small-gods', 'Terry Pratchett', 1992, 'SFF' ),
  ('The Art of Programming, Vol 1', 'the-art-of-programming-vol-1', 'Donald Knuth', 1968, 'nonfiction' )
;
