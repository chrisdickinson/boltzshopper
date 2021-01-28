create table books (
  id serial primary key,
  title text,
  summary text,
  published timestamp with time zone default now()
);
