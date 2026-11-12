/**
 * Contratos HTTP (fonte de verdade da interface). A API valida entrada com estes schemas e
 * os testes de contrato validam as respostas. O cliente usa os tipos inferidos.
 */
import {
  ACTIVITY_IDS,
  AVATAR_COLORS,
  CHALLENGE_IDS,
  DAY_STATUSES,
  EXERCISE_IDS,
  FOOD_CATEGORIES,
  FOOD_IDS,
  GOAL_IDS,
  INSIGHT_TARGETS,
  ISO_DATE_RE,
  MEAL_IDS,
  MEAL_STATUSES,
  MEASURES,
  NICK_RE,
  POST_KINDS,
  PREF_CATEGORIES,
  PROFILE_LIMITS,
  SESSION_IDS,
  SEXES,
  SHARE_KEYS,
  STRATEGIES,
} from '@fitness/domain';
import { z } from 'zod';

/* ---------- primitivos ---------- */
export const IsoDate = z.string().regex(ISO_DATE_RE, 'data no formato AAAA-MM-DD');
export const DateParams = z.object({ date: IsoDate });
export const FoodId = z.enum(FOOD_IDS);
export const MealId = z.enum(MEAL_IDS);
export const ExerciseId = z.enum(EXERCISE_IDS);
export const GoalId = z.enum(GOAL_IDS);
export const Nick = z.string().regex(NICK_RE, '3 a 20: minúsculas, números, ponto ou _');
export const ShareKey = z.enum(SHARE_KEYS);
const shareShape = Object.fromEntries(SHARE_KEYS.map((k) => [k, z.boolean()])) as Record<
  (typeof SHARE_KEYS)[number],
  z.ZodBoolean
>;
export const ShareSettings = z.object(shareShape);

export const ErrorBody = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});
export type ErrorBody = z.infer<typeof ErrorBody>;

/* ---------- identidade (RF-01..04) ---------- */
export const CreateDeviceBody = z.object({ fingerprint: z.string().max(128).optional() });
export const CreateDeviceResponse = z.object({ deviceId: z.string().uuid(), token: z.string().min(32) });
export type CreateDeviceResponse = z.infer<typeof CreateDeviceResponse>;

/* ---------- perfil e energia (RF-05..16) ---------- */
const [ageMin, ageMax] = PROFILE_LIMITS.age;
const [hMin, hMax] = PROFILE_LIMITS.heightCm;
const [wMin, wMax] = PROFILE_LIMITS.weightKg;
export const ProfileBody = z.object({
  sex: z.enum(SEXES),
  age: z.number().int().min(ageMin).max(ageMax),
  heightCm: z.number().min(hMin).max(hMax),
  weightKg: z.number().min(wMin).max(wMax),
  activity: z.enum(ACTIVITY_IDS),
  goal: GoalId,
  magnitudePct: z.number().int().min(0).max(30),
  /** RN-16: confirmação explícita para fora da faixa segura */
  confirmExtreme: z.boolean().default(false),
});
export type ProfileBody = z.input<typeof ProfileBody>;

export const Profile = ProfileBody.omit({ confirmExtreme: true }).extend({
  extremeConfirmed: z.boolean(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof Profile>;

export const Energy = z.object({
  tmb: z.number(),
  tdee: z.number(),
  target: z.number(),
  strategy: z.enum(STRATEGIES),
  magnitudePct: z.number(),
  diff: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  extreme: z.boolean(),
});

export const MyCharacter = z.object({
  nick: Nick,
  color: z.number().int(),
  gymId: z.string().nullable(),
  optIn: z.boolean(),
  share: ShareSettings,
  hideHistory: z.boolean(),
  postCount: z.number().int(),
});
export type MyCharacter = z.infer<typeof MyCharacter>;

export const MeResponse = z.object({
  deviceId: z.string().uuid(),
  createdAt: z.string(),
  profile: Profile.nullable(),
  energy: Energy.nullable(),
  character: MyCharacter.nullable(),
});
export type MeResponse = z.infer<typeof MeResponse>;

/* ---------- dieta (RF-17..22) ---------- */
export const Nutrients = z.object({ kcal: z.number(), p: z.number(), c: z.number(), g: z.number() });
export const PantryBody = z.object({ foodIds: z.array(FoodId).max(FOOD_IDS.length) });
export const PrefBody = z.object({ mealId: MealId, category: z.enum(PREF_CATEGORIES), foodId: FoodId.nullable() });
export const MealLogBody = z.object({ status: z.enum(MEAL_STATUSES).nullable() });
export const ExtraBody = z.object({
  name: z.string().trim().min(1).max(60),
  kcal: z.number().min(0).max(3000),
  p: z.number().min(0).max(300),
  c: z.number().min(0).max(300),
  g: z.number().min(0).max(300),
});
export const MealParams = DateParams.extend({ mealId: MealId });
export const ExtraParams = DateParams.extend({ extraId: z.string().uuid() });

const PlannedMeal = z.object({
  id: MealId,
  name: z.string(),
  time: z.string(),
  items: z.array(z.object({ foodId: FoodId, grams: z.number() })),
  total: Nutrients,
  targetKcal: z.number(),
  alternatives: z.object({ prot: z.array(FoodId), carb: z.array(FoodId) }),
});
export const DietPlan = z.object({
  meals: z.array(PlannedMeal),
  total: Nutrients,
  missing: z.array(z.enum(FOOD_CATEGORIES)),
  viable: z.boolean(),
  coverage: z.object({ kcal: z.number(), protein: z.number() }),
});

export const DietDayResponse = z.object({
  date: IsoDate,
  energy: Energy,
  pantry: z.array(FoodId),
  prefs: z.record(MealId, z.record(z.enum(PREF_CATEGORIES), FoodId)),
  plan: DietPlan,
  logs: z.record(MealId, z.enum(MEAL_STATUSES)),
  extras: z.array(Nutrients.extend({ id: z.string().uuid(), name: z.string() })),
  consumed: Nutrients,
  status: z.enum(DAY_STATUSES),
  closedAt: z.string().nullable(),
  week: z.array(z.object({ date: IsoDate, status: z.enum(DAY_STATUSES).nullable() })),
});
export type DietDayResponse = z.infer<typeof DietDayResponse>;

export const CloseDayResponse = z.object({ status: z.enum(DAY_STATUSES), published: z.boolean() });

/* ---------- treino (RF-23..28) ---------- */
export const ExerciseParams = DateParams.extend({ exerciseId: ExerciseId });
export const ExerciseLogBody = z.object({
  setsDone: z.number().int().min(0).max(10),
  loadKg: z.number().min(0).max(500).optional(),
});
export const CompleteSessionBody = z.object({ publish: z.boolean() });

export const SessionSummary = z.object({
  sessionId: z.enum(SESSION_IDS),
  done: z.array(ExerciseId),
  kcal: z.number(),
  minutes: z.number(),
  volumeKg: z.number(),
  plannedKcal: z.number(),
  plannedMinutes: z.number(),
});
export const TrainingDayResponse = z.object({
  date: IsoDate,
  sessionId: z.enum(SESSION_IDS),
  logs: z.array(z.object({ exerciseId: ExerciseId, setsDone: z.number(), loadKg: z.number() })),
  summary: SessionSummary,
  completedAt: z.string().nullable(),
  /** melhor carga já concluída por exercício (antes de hoje) */
  bestLoads: z.record(ExerciseId, z.number()),
  /** PRs do dia (exercícios cuja carga de hoje supera o melhor anterior) */
  prs: z.array(z.object({ exerciseId: ExerciseId, loadKg: z.number() })),
  workoutsLast7: z.number().int(),
  bodyWeightKg: z.number(),
});
export type TrainingDayResponse = z.infer<typeof TrainingDayResponse>;
export const CompleteSessionResponse = z.object({
  summary: SessionSummary,
  published: z.boolean(),
  streak: z.number().int(),
});

/* ---------- corpo (RF-29..32) ---------- */
const measureShape = Object.fromEntries(
  MEASURES.map((m) => [m.id, z.number().min(m.range[0]).max(m.range[1])]),
) as Record<(typeof MEASURES)[number]['id'], z.ZodNumber>;
export const MeasurementBody = z.object(measureShape);
export const Measurement = MeasurementBody.extend({ date: IsoDate });
export const BodyResponse = z.object({ measurements: z.array(Measurement) });
export type BodyResponse = z.infer<typeof BodyResponse>;
export const SaveMeasurementResponse = z.object({
  measurement: Measurement,
  targetBefore: z.number(),
  targetAfter: z.number(),
});

/* ---------- progresso e insights (RF-16, RF-33, RF-35) ---------- */
export const InsightSchema = z.object({
  icon: z.string(),
  tag: z.string(),
  title: z.string(),
  text: z.string(),
  target: z.enum(INSIGHT_TARGETS),
});
export type Insight = z.infer<typeof InsightSchema>;
export const ProgressResponse = z.object({
  date: IsoDate,
  energy: Energy,
  projection: z.array(z.object({ week: z.number(), weightKg: z.number() })),
  history: z.array(Measurement),
  insights: z.array(InsightSchema),
  streak: z.number().int(),
  challenges: z.array(
    z.object({
      id: z.enum(CHALLENGE_IDS),
      name: z.string(),
      icon: z.string(),
      goal: z.number(),
      progress: z.number(),
      done: z.boolean(),
    }),
  ),
  week: z.array(
    z.object({ date: IsoDate, diet: z.enum(DAY_STATUSES).nullable(), proteinOk: z.boolean(), trained: z.boolean() }),
  ),
});
export type ProgressResponse = z.infer<typeof ProgressResponse>;

/* ---------- vitrine e personagens (RF-37..46) ---------- */
export const CharacterBody = z.object({
  nick: Nick,
  color: z
    .number()
    .int()
    .min(0)
    .max(AVATAR_COLORS.length - 1),
  gymId: z.string().max(40).nullable().default(null),
  optIn: z.boolean(),
});
export const CharacterPatch = z.object({
  optIn: z.boolean().optional(),
  share: ShareSettings.partial().optional(),
  hideHistory: z.boolean().optional(),
  gymId: z.string().max(40).nullable().optional(),
});
export const NickQuery = z.object({ nick: z.string().max(40) });
export const NickAvailability = z.object({ valid: z.boolean(), available: z.boolean() });

export const FeedPost = z.object({
  id: z.string().uuid(),
  nick: Nick,
  color: z.number().int(),
  gymId: z.string().nullable(),
  gymName: z.string().nullable(),
  kind: z.enum(POST_KINDS),
  title: z.string(),
  values: z.array(z.tuple([z.string(), z.string()])),
  pr: z.string().nullable(),
  achievement: z.string().nullable(),
  createdAt: z.string(),
  kudos: z.number().int(),
  kudoed: z.boolean(),
  mine: z.boolean(),
});
export type FeedPost = z.infer<typeof FeedPost>;
export const FeedQuery = z.object({ scope: z.enum(['all', 'gym']).default('all') });
export const FeedResponse = z.object({ posts: z.array(FeedPost) });
export const PostParams = z.object({ postId: z.string().uuid() });
export const KudoResponse = z.object({ kudos: z.number().int(), kudoed: z.boolean() });

export const SearchQuery = z.object({
  q: z.string().max(40).optional(),
  goal: GoalId.optional(),
  gym: z.string().max(40).optional(),
});
export const CharacterCard = z.object({
  nick: Nick,
  color: z.number().int(),
  gymId: z.string().nullable(),
  gymName: z.string().nullable(),
  goal: GoalId.nullable(),
  streak: z.number().nullable(),
  topPr: z.string().nullable(),
  mine: z.boolean(),
});
export type CharacterCard = z.infer<typeof CharacterCard>;
export const SearchResponse = z.object({ characters: z.array(CharacterCard) });
export const NickParams = z.object({ nick: z.string().max(40) });
export const PublicStatsSchema = z.object({
  goal: GoalId.nullable(),
  streak: z.number().nullable(),
  workouts: z.number().nullable(),
  prs: z.array(z.string()),
  achievements: z.array(z.string()),
  evolution: z.string().nullable(),
});
export const PublicProfileResponse = z.object({
  nick: Nick,
  color: z.number().int(),
  gym: z.object({ id: z.string(), name: z.string() }).nullable(),
  stats: PublicStatsSchema,
  posts: z.array(FeedPost),
  mine: z.boolean(),
  /** false quando é o próprio personagem com a vitrine desligada */
  visible: z.boolean(),
});
export type PublicProfileResponse = z.infer<typeof PublicProfileResponse>;

/* ---------- academias (RF-47..51) ---------- */
export const GymsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  q: z.string().max(60).optional(),
});
export const Gym = z.object({
  id: z.string(),
  name: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  lat: z.number(),
  lng: z.number(),
  modalities: z.array(z.string()),
  hours: z.string(),
  distanceKm: z.number().nullable(),
  characters: z.number().int(),
});
export type Gym = z.infer<typeof Gym>;
export const GymsResponse = z.object({ gyms: z.array(Gym) });
export const GymParams = z.object({ gymId: z.string().max(40) });
export const GymDetailResponse = Gym.extend({
  people: z.array(z.object({ nick: Nick, color: z.number().int() })),
  posts: z.array(FeedPost),
});
export type GymDetailResponse = z.infer<typeof GymDetailResponse>;
