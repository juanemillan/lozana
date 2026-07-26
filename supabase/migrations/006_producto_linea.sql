-- Línea de producto
--
-- En cosmética, y sobre todo en la coreana, una marca suele agrupar varios
-- productos bajo una misma línea: "Purito" vende tónico, sérum y crema de la
-- línea "Wonder Releaf Centella". Sin este campo, ese texto se repite dentro
-- del nombre de cada producto.
--
-- Se llama product_line y no `line` porque `line` es un tipo geométrico de
-- Postgres: usarlo como nombre de columna es legal pero se presta a confusión.

alter table public.products
  add column if not exists product_line text;

comment on column public.products.product_line is
  'Línea o gama dentro de la marca. Opcional: no todos los productos pertenecen a una.';
