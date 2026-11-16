import { z } from 'zod';

export const publicIdSchema = z.uuid({ message: 'Identificador inválido' });
