import { expect, test } from '@playwright/test';

const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025';

test('Primeiro acesso: criar conta → onboarding → feed → confirmar presença', async ({ page }) => {
  const email = `e2e-${Date.now()}@teste.dev`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByLabel('Confirmar senha').fill('senha-forte-123');
  await page.getByText('Li e aceito').click();
  await page.getByText('Tenho 18 anos ou mais').click();
  await page.getByRole('button', { name: 'Criar conta' }).last().click();

  await expect(page).toHaveURL(/onboarding\/tipos/);
  await page.getByRole('button', { name: 'Festas' }).click();
  await page.getByRole('button', { name: /Continuar/ }).click();
  await expect(page).toHaveURL(/onboarding\/cidade/);
  await page.getByRole('radio', { name: /Curitiba/ }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Agora não/ }).click();
  await expect(page.getByText(/rolês nos próximos dias/)).toBeVisible();
  await page.getByRole('button', { name: 'Bora explorar' }).click();

  await expect(page).toHaveURL(/\/explorar$/);
  await expect(page.getByRole('heading', { name: /Hoje|Amanhã|Este fim de semana|Próximos/ }).first()).toBeVisible();

  // abre um evento público com vaga e confirma presença
  await page.goto('/explorar/busca');
  await page.getByLabel('Buscar rolês').fill('Feira Gastronômica');
  await page.locator('a[href^="/app/e/feira-gastronomica"]').first().click();
  await page.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(page.getByRole('heading', { name: 'Você vai!' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver o rolê' }).click();
  await expect(page.getByRole('button', { name: /Vou · cancelar/ })).toBeVisible();
});

test('Reset de senha com e-mail real no Mailpit', async ({ page, request }) => {
  await page.goto('/recuperar-senha');
  await page.getByLabel('E-mail').fill('marina.lopes@rolego.dev');
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(page.getByText('Confira seu e-mail')).toBeVisible();

  let link: string | undefined;
  for (let i = 0; i < 20 && !link; i++) {
    await page.waitForTimeout(500);
    const list = await (await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:marina.lopes@rolego.dev subject:"Redefinir"')}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) {
      const msg = await (await request.get(`${MAILPIT}/api/v1/message/${id}`)).json();
      link = /https?:\/\/[^\s"]+redefinir-senha\?token=[\w-]+/.exec(msg.Text)?.[0];
    }
  }
  expect(link).toBeTruthy();
  await page.goto(new URL(link ?? '').pathname + new URL(link ?? '').search);
  await page.getByLabel('Nova senha').fill('rolego2026');
  await page.getByLabel('Confirmar senha').fill('rolego2026');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page).toHaveURL(/\/explorar/);
});
