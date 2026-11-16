import { Router } from 'express';
import { z } from 'zod';
import { emailSchema } from '../../shared/email.ts';
import { AppError } from '../../shared/errors.ts';
import { publicIdSchema } from '../../shared/ids.ts';
import { parse } from '../../shared/validate.ts';
import { parseContactsImport } from './import-parser.ts';
import type { ListsRepository } from './repository.ts';

const MAX_IMPORT_CONTACTS = 50_000;

const nameSchema = z.object({ name: z.string().trim().min(1, 'Informe o nome').max(120) });
const listParams = z.object({ listId: publicIdSchema });
const contactParams = z.object({ listId: publicIdSchema, contactId: publicIdSchema });
const contactsQuery = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
const contactBody = z.object({
  email: emailSchema,
  name: z.string().trim().max(200).optional().transform((v) => v || null),
});
const importBody = z.object({ text: z.string().min(1, 'Cole ao menos um e-mail').max(5_000_000) });

const PAGE_SIZE = 50;

export function listsRouter(repo: ListsRepository) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await repo.all());
  });

  router.post('/', async (req, res) => {
    const { name } = parse(nameSchema, req.body);
    res.status(201).json(await repo.create(name));
  });

  router.get('/:listId', async (req, res) => {
    const { listId } = parse(listParams, req.params);
    res.json(await repo.get(listId));
  });

  router.patch('/:listId', async (req, res) => {
    const { listId } = parse(listParams, req.params);
    const { name } = parse(nameSchema, req.body);
    res.json(await repo.rename(listId, name));
  });

  router.delete('/:listId', async (req, res) => {
    const { listId } = parse(listParams, req.params);
    await repo.remove(listId);
    res.status(204).end();
  });

  router.get('/:listId/contacts', async (req, res) => {
    const { listId } = parse(listParams, req.params);
    const { search, page } = parse(contactsQuery, req.query);
    const result = await repo.contacts(listId, { search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    res.json({ ...result, page, pageSize: PAGE_SIZE });
  });

  router.post('/:listId/contacts', async (req, res) => {
    const { listId } = parse(listParams, req.params);
    const contact = parse(contactBody, req.body);
    const { added } = await repo.addContacts(listId, [contact]);
    if (!added) throw new AppError(409, 'conflict', 'Este e-mail já está na lista.');
    res.status(201).json({ added });
  });

  router.post('/:listId/contacts/import', async (req, res) => {
    const { listId } = parse(listParams, req.params);
    const { text } = parse(importBody, req.body);
    const parsed = parseContactsImport(text);
    if (parsed.contacts.length > MAX_IMPORT_CONTACTS) {
      throw new AppError(400, 'too_large', `Importe no máximo ${MAX_IMPORT_CONTACTS} e-mails por vez.`);
    }
    const { added, alreadyInList } = await repo.addContacts(listId, parsed.contacts);
    res.json({
      added,
      alreadyInList,
      duplicatesInInput: parsed.duplicatesInInput,
      invalid: parsed.invalid.slice(0, 100),
      invalidCount: parsed.invalid.length,
    });
  });

  router.delete('/:listId/contacts/:contactId', async (req, res) => {
    const { listId, contactId } = parse(contactParams, req.params);
    await repo.removeContact(listId, contactId);
    res.status(204).end();
  });

  return router;
}
