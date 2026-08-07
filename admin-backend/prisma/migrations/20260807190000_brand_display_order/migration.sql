-- Homepage brand order was alphabetical, which led with Aston Martin,
-- Bentley and Bugatti — the wrong first impression for an Indian car
-- site. This makes the running order editorial instead.
ALTER TABLE brands ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

UPDATE brands SET display_order = v.ord FROM (VALUES
 ('maruti',100),('hyundai',95),('tata',90),('mahindra',85),('toyota',80),
 ('kia',75),('honda',70),('mg',65),('skoda',60),('volkswagen',55),
 ('renault',50),('nissan',45),('jeep',40),('citroen',35),('byd',30),
 ('mercedes-benz',25),('bmw',24),('audi',23),('volvo',22),('lexus',21),
 ('jaguar',20),('land-rover',19),('porsche',18),('mini',17)
) AS v(slug, ord) WHERE brands.slug = v.slug;
