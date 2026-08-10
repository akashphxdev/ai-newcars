-- Five models were filed under labels that are not body types at all —
-- "Diesel Engines", "Hybrids", "Luxury", "Luxury Vehicles", "Wagons" —
-- one model each. Comparison pairs band by body type, so each of them sat
-- in a band of one and could never appear in a pair. Applied 10 Aug 2026.
UPDATE car_models SET body_type_id = 5 WHERE name = 'Premier 118 NE';       -- Sedan
UPDATE car_models SET body_type_id = 8 WHERE name = 'Reva i';               -- Hatchback
UPDATE car_models SET body_type_id = 6 WHERE name = 'Porsche Macan EV';     -- SUV
UPDATE car_models SET body_type_id = 9 WHERE name = 'Ferrari Amalfi';       -- Coupe
UPDATE car_models SET body_type_id = 8 WHERE name = 'Chevrolet Optra SRV';  -- Hatchback

-- The now-empty rows are left in body_types rather than deleted; the
-- listing query filters them out with HAVING COUNT(m.id) > 0, which also
-- removes "Crossover", empty for the same reason.
