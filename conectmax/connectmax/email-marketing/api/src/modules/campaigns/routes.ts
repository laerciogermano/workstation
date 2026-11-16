import { Router } from 'express';
import { z } from 'zod';
import { publicIdSchema } from '../../shared/ids.ts';
import { parse } from '../../shared/validate.ts';
import type { CampaignsRepository } from './repository.ts';

const params = z.object({ campaignId: publicIdSchema });
const createBody = z.object({ name: z.string().trim().min(1, 'Informe o nome').max(120) });
const patchBody = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(120).optional(),
    subject: z.string().trim().max(200).optional(),
    bodyHtml: z.string().max(200_000).optional(),
    listId: publicIdSchema.nullable().optional(),
  })
  .strict();

export function campaignsRouter(repo: CampaignsRepository) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await repo.all());
  });

  router.post('/', async (req, res) => {
    const { name } = parse(createBody, req.body);
    res.status(201).json(await repo.create(name));
  });

  router.get('/:campaignId', async (req, res) => {
    const { campaignId } = parse(params, req.params);
    res.json(await repo.get(campaignId));
  });

  router.patch('/:campaignId', async (req, res) => {
    const { campaignId } = parse(params, req.params);
    res.json(await repo.update(campaignId, parse(patchBody, req.body)));
  });

  router.delete('/:campaignId', async (req, res) => {
    const { campaignId } = parse(params, req.params);
    await repo.remove(campaignId);
    res.status(204).end();
  });

  // CU-04
  router.post('/:campaignId/send', async (req, res) => {
    const { campaignId } = parse(params, req.params);
    res.status(202).json(await repo.startSending(campaignId));
  });

  return router;
}
