-- 001 · esquema inicial do Fitness
-- Regras: migrations imutáveis depois de aplicadas; toda FK com índice; constraints no banco
-- espelham as regras de negócio (defesa em profundidade junto com Zod na borda).

CREATE SCHEMA IF NOT EXISTS fitness;
SET search_path TO fitness, public;

-- Identidade sem conta (RF-01..04, RN-01): o aparelho recebe um token opaco; guardamos só o hash.
CREATE TABLE devices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,
  fingerprint   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

-- Perfil metabólico + objetivo (RF-05..10)
CREATE TABLE profiles (
  device_id          uuid PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  sex                text NOT NULL CHECK (sex IN ('f','m')),
  age                smallint NOT NULL CHECK (age BETWEEN 14 AND 90),
  height_cm          numeric(5,1) NOT NULL CHECK (height_cm BETWEEN 130 AND 220),
  weight_kg          numeric(5,1) NOT NULL CHECK (weight_kg BETWEEN 35 AND 250),
  activity           text NOT NULL CHECK (activity IN ('sedentario','leve','moderado','alto','atleta')),
  goal               text NOT NULL CHECK (goal IN ('hipertrofia','definicao','recomp','manutencao')),
  magnitude_pct      smallint NOT NULL CHECK (magnitude_pct BETWEEN 0 AND 30),
  extreme_confirmed  boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Estoque (RF-17). Catálogo de alimentos é versionado em código (ADR-0004).
CREATE TABLE pantry_items (
  device_id  uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  food_id    text NOT NULL,
  PRIMARY KEY (device_id, food_id)
);

CREATE TABLE meal_prefs (
  device_id  uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  meal_id    text NOT NULL CHECK (meal_id IN ('cafe','almoco','lanche','jantar')),
  category   text NOT NULL CHECK (category IN ('prot','carb')),
  food_id    text NOT NULL,
  PRIMARY KEY (device_id, meal_id, category)
);

-- Registro alimentar do dia (RF-20, RF-21, RN-11)
CREATE TABLE meal_logs (
  device_id  uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day        date NOT NULL,
  meal_id    text NOT NULL CHECK (meal_id IN ('cafe','almoco','lanche','jantar')),
  status     text NOT NULL CHECK (status IN ('feito','parcial','nao')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, day, meal_id)
);

CREATE TABLE extra_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day         date NOT NULL,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  kcal        numeric(6,1) NOT NULL CHECK (kcal >= 0),
  protein_g   numeric(5,1) NOT NULL CHECK (protein_g >= 0),
  carbs_g     numeric(5,1) NOT NULL CHECK (carbs_g >= 0),
  fat_g       numeric(5,1) NOT NULL CHECK (fat_g >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX extra_items_device_day_idx ON extra_items (device_id, day);

-- Fechamento do dia: snapshot do julgamento (cumpriu/abaixo/estourou) para histórico e gamificação
CREATE TABLE diet_days (
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day         date NOT NULL,
  status      text NOT NULL CHECK (status IN ('cumpriu','abaixo','estourou')),
  target_kcal integer NOT NULL,
  kcal        numeric(7,1) NOT NULL,
  protein_g   numeric(6,1) NOT NULL,
  protein_ok  boolean NOT NULL,
  closed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, day)
);

-- Treino (RF-23..27, RN-12)
CREATE TABLE workout_logs (
  device_id    uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day          date NOT NULL,
  exercise_id  text NOT NULL,
  sets_done    smallint NOT NULL CHECK (sets_done BETWEEN 0 AND 10),
  load_kg      numeric(5,1) NOT NULL DEFAULT 0 CHECK (load_kg >= 0),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, day, exercise_id)
);

CREATE TABLE workout_days (
  device_id     uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day           date NOT NULL,
  session_id    text NOT NULL CHECK (session_id IN ('A','B','R')),
  kcal          integer NOT NULL,
  minutes       integer NOT NULL,
  volume_kg     integer NOT NULL,
  completed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, day)
);

-- Avaliação física (RF-29, RF-30, RN-13). Fotos ficam só no aparelho (RN-18, ADR-0005).
CREATE TABLE measurements (
  device_id    uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  measured_on  date NOT NULL,
  weight_kg    numeric(5,1) NOT NULL CHECK (weight_kg BETWEEN 35 AND 250),
  waist_cm     numeric(5,1) NOT NULL,
  hip_cm       numeric(5,1) NOT NULL,
  chest_cm     numeric(5,1) NOT NULL,
  arm_cm       numeric(5,1) NOT NULL,
  thigh_cm     numeric(5,1) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, measured_on)
);

-- Academias (RF-47..51). Catálogo comunitário, sem matrícula (RN-21).
CREATE TABLE gyms (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  neighborhood  text NOT NULL,
  city          text NOT NULL,
  lat           double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng           double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  modalities    text[] NOT NULL DEFAULT '{}',
  hours         text NOT NULL DEFAULT ''
);
CREATE INDEX gyms_lat_lng_idx ON gyms (lat, lng);

-- Personagem público opcional (RF-42..46, RN-01b). public_stats é o snapshot do que pode sair.
CREATE TABLE characters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     uuid NOT NULL UNIQUE REFERENCES devices(id) ON DELETE CASCADE,
  nick          text NOT NULL UNIQUE CHECK (nick ~ '^[a-z0-9._]{3,20}$'),
  color         smallint NOT NULL DEFAULT 0 CHECK (color BETWEEN 0 AND 5),
  gym_id        text REFERENCES gyms(id) ON DELETE SET NULL,
  opt_in        boolean NOT NULL DEFAULT false,
  share         jsonb NOT NULL,
  hide_history  boolean NOT NULL DEFAULT false,
  public_stats  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX characters_gym_idx ON characters (gym_id);
CREATE INDEX characters_public_idx ON characters (nick) WHERE opt_in;

-- Vitrine (RF-37..41, RN-17, RN-22)
CREATE TABLE posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id  uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('treino','dieta','medida','conquista')),
  title         text NOT NULL,
  vals          jsonb NOT NULL DEFAULT '[]'::jsonb,
  pr            text,
  achievement   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_character_created_idx ON posts (character_id, created_at DESC);
CREATE INDEX posts_created_idx ON posts (created_at DESC);

CREATE TABLE kudos (
  post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, device_id)
);
CREATE INDEX kudos_device_idx ON kudos (device_id);
