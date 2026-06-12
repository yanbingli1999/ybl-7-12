import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createStore } from '../storage/fileStore.js';
import type { Template, CreateTemplateDto, UpdateTemplateDto } from '../../shared/types.js';

const router = Router();
const templatesStore = createStore<Template>('templates');

router.get('/', (_req: Request, res: Response) => {
  const templates = templatesStore.getAll();
  res.json(templates);
});

router.get('/:id', (req: Request, res: Response) => {
  const template = templatesStore.getById(req.params.id);
  if (!template) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  res.json(template);
});

router.post('/', (req: Request, res: Response) => {
  const dto = req.body as CreateTemplateDto;
  if (!dto.name || dto.name.trim() === '') {
    res.status(400).json({ error: '模板名称不能为空' });
    return;
  }
  if (!dto.variables || dto.variables.length === 0) {
    res.status(400).json({ error: '模板至少需要一个变量' });
    return;
  }

  const now = new Date().toISOString();
  const template: Template = {
    id: uuidv4(),
    name: dto.name.trim(),
    category: dto.category || 'other',
    description: dto.description?.trim() || '',
    variables: dto.variables.map(v => ({
      name: v.name.trim(),
      type: v.type || 'custom',
      min: Number(v.min),
      max: Number(v.max),
      mostLikely: Number(v.mostLikely),
      weight: Number(v.weight) ?? 1,
      unit: v.unit?.trim() || '',
    })),
    createdAt: now,
    updatedAt: now,
  };

  const created = templatesStore.create(template);
  res.status(201).json(created);
});

router.put('/:id', (req: Request, res: Response) => {
  const dto = req.body as UpdateTemplateDto;
  const existing = templatesStore.getById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }

  const updates: Partial<Template> = { updatedAt: new Date().toISOString() };

  if (dto.name !== undefined) {
    if (dto.name.trim() === '') {
      res.status(400).json({ error: '模板名称不能为空' });
      return;
    }
    updates.name = dto.name.trim();
  }
  if (dto.category !== undefined) updates.category = dto.category;
  if (dto.description !== undefined) updates.description = dto.description.trim();
  if (dto.variables !== undefined) {
    if (dto.variables.length === 0) {
      res.status(400).json({ error: '模板至少需要一个变量' });
      return;
    }
    updates.variables = dto.variables.map(v => ({
      name: v.name.trim(),
      type: v.type || 'custom',
      min: Number(v.min),
      max: Number(v.max),
      mostLikely: Number(v.mostLikely),
      weight: Number(v.weight) ?? 1,
      unit: v.unit?.trim() || '',
    }));
  }

  const updated = templatesStore.update(req.params.id, updates);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = templatesStore.getById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  templatesStore.delete(req.params.id);
  res.json({ success: true });
});

router.post('/:id/copy', (req: Request, res: Response) => {
  const existing = templatesStore.getById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }

  const now = new Date().toISOString();
  const copy: Template = {
    id: uuidv4(),
    name: existing.name + ' (副本)',
    category: existing.category,
    description: existing.description,
    variables: [...existing.variables],
    createdAt: now,
    updatedAt: now,
  };

  const created = templatesStore.create(copy);
  res.status(201).json(created);
});

export default router;
