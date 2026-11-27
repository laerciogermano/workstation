import {
  ArrowRight, ArrowUp, Award, BadgeCheck, Badge, Bell, BookOpen, Briefcase, Building, Building2, Bus, CalendarCheck, CalendarDays, CalendarPlus, Car, Check, ChevronLeft, ChevronRight,
  CircleCheck, CircleQuestionMark, ClipboardList, Coffee, Contact, Cookie, Copy, CreditCard, Ellipsis, FileText, Flag, Gavel, Gem, Headset, Info, KeyRound, KeySquare, Landmark, LayoutGrid,
  Lock, LockKeyhole, LogOut, Mail, MapPin, MapPinPlus, Medal, Megaphone, Menu, MessageCircle, MessageSquare, Music, Newspaper, Package, Pencil, Plus, Presentation, Puzzle, Repeat, ScanFace,
  ScrollText, Search, Send, ShieldCheck, Shirt, ShoppingCart, Smartphone, Sparkles, SquareCheck, Stamp, Ticket, TicketPlus, Trash2, Trees, TriangleAlert, Trophy, UserCheck, UserRound,
  UserRoundPen, UserRoundPlus, Users, UsersRound, Utensils, X, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'arrow-right': ArrowRight, 'arrow-up': ArrowUp, award: Award, 'badge-check': BadgeCheck, badge: Badge, bell: Bell, 'book-open': BookOpen, briefcase: Briefcase, building: Building, 'building-2': Building2,
  bus: Bus, 'calendar-check': CalendarCheck, 'calendar-days': CalendarDays, 'calendar-plus': CalendarPlus, car: Car, check: Check, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'circle-check': CircleCheck, 'circle-help': CircleQuestionMark, 'clipboard-list': ClipboardList, coffee: Coffee, contact: Contact, cookie: Cookie, copy: Copy, 'credit-card': CreditCard, ellipsis: Ellipsis,
  'file-text': FileText, flag: Flag, gavel: Gavel, gem: Gem, headset: Headset, info: Info, 'key-round': KeyRound, 'key-square': KeySquare, landmark: Landmark, 'layout-grid': LayoutGrid, lock: Lock,
  'lock-keyhole': LockKeyhole, 'log-out': LogOut, mail: Mail, 'map-pin': MapPin, 'map-pin-plus': MapPinPlus, medal: Medal, megaphone: Megaphone, menu: Menu, 'message-circle': MessageCircle,
  'message-square': MessageSquare, music: Music, newspaper: Newspaper, package: Package, pencil: Pencil, plus: Plus, presentation: Presentation, puzzle: Puzzle, repeat: Repeat, 'scan-face': ScanFace,
  'scroll-text': ScrollText, search: Search, send: Send, 'shield-check': ShieldCheck, shirt: Shirt, 'shopping-cart': ShoppingCart, smartphone: Smartphone, sparkles: Sparkles, 'square-check': SquareCheck,
  stamp: Stamp, ticket: Ticket, 'ticket-plus': TicketPlus, 'trash-2': Trash2, trees: Trees, 'triangle-alert': TriangleAlert, trophy: Trophy, 'user-check': UserCheck, 'user-round': UserRound,
  'user-round-pen': UserRoundPen, 'user-round-plus': UserRoundPlus, users: Users, 'users-round': UsersRound, utensils: Utensils, x: X,
};
export const Icon = ({ n, className }: { n: string; className?: string }) => { const C = ICONS[n] ?? Package; return <C className={`lucide ${className ?? ''}`} aria-hidden="true" />; };
