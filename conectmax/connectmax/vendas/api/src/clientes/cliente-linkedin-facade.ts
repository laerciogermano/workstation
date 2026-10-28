import { ClienteLinkedin } from './cliente-linkedin.entity';
import { Cliente } from './cliente.entity';

/** Shape legado de GET /profiles (front/robot). */
export type ProfileListItem = {
  id: string;
  name: string;
  title: string | null;
  searchQuery: string | null;
  level: string | null;
  connection: string | null;
  inviteStatus: string | null;
  city: string | null;
  mutualConnections: string | null;
  current: string | null;
  past: string | null;
  photoBase64: string | null;
  coverBase64: string | null;
  cardBase64?: string | null;
  rawOcr?: Record<string, unknown> | null;
  extractedAt: Date | null;
  round: number | null;
  createdAt: Date;
  updatedAt: Date;
  profileUrl?: string | null;
  deletedAt?: Date | null;
};

/** Shape legado de GET/POST /profile-details. */
export type ProfileDetailItem = {
  id: string;
  profileId: string;
  name: string | null;
  company: string | null;
  headline: string | null;
  location: string | null;
  connections: string | null;
  mutualConnections: string | null;
  canConnect: boolean | null;
  canMessage: boolean | null;
  inviteStatus: string | null;
  profileUrl: string | null;
  connectionDegree: string | null;
  about: string | null;
  experience: string | null;
  education: string | null;
  skills: string | null;
  photoBase64: string | null;
  coverBase64: string | null;
  cardBase64: string | null;
  rawOcr: Record<string, unknown> | null;
  extractedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function companyFirstLine(company: string | null): string | null {
  if (!company) return null;
  return company.split('\n')[0]?.trim() || company;
}

export function toProfileListItem(
  li: ClienteLinkedin,
  cliente?: Cliente | null,
): ProfileListItem {
  const nome = cliente?.nome || li.cliente?.nome || '—';
  return {
    id: li.id,
    name: nome,
    title: li.headline,
    searchQuery: li.searchQuery,
    level: li.connectionDegree,
    connection: li.inviteStatus || li.connections,
    inviteStatus: li.inviteStatus,
    city: li.location,
    mutualConnections: li.mutualConnections,
    current: companyFirstLine(li.company) || cliente?.empresa || null,
    past: li.past,
    photoBase64: li.photoBase64,
    coverBase64: li.coverBase64,
    cardBase64: li.cardBase64,
    rawOcr: li.rawOcr,
    extractedAt: li.extractedAt,
    round: li.round,
    createdAt: li.createdAt,
    updatedAt: li.updatedAt,
    profileUrl: li.profileUrl,
    deletedAt: li.deletedAt,
  };
}

export function toProfileDetailItem(
  li: ClienteLinkedin,
  cliente?: Cliente | null,
): ProfileDetailItem {
  const nome = cliente?.nome || li.cliente?.nome || null;
  return {
    id: li.id,
    profileId: li.id,
    name: nome,
    company: li.company,
    headline: li.headline,
    location: li.location,
    connections: li.connections,
    mutualConnections: li.mutualConnections,
    canConnect: li.canConnect,
    canMessage: li.canMessage,
    inviteStatus: li.inviteStatus,
    profileUrl: li.profileUrl,
    connectionDegree: li.connectionDegree,
    about: li.about,
    experience: li.experience,
    education: li.education,
    skills: li.skills,
    photoBase64: li.photoBase64,
    coverBase64: li.coverBase64,
    cardBase64: li.cardBase64,
    rawOcr: li.rawOcr,
    extractedAt: li.extractedAt,
    createdAt: li.createdAt,
    updatedAt: li.updatedAt,
  };
}
