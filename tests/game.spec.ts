import { test, expect, Page } from '@playwright/test';
import { puzzles } from '../src/puzzles';

const APP_URL = '/?mock=1';

/** Switch to a specific day so tests are independent of the host clock. */
async function gotoDay(page: Page, day: number) {
  await page.goto(APP_URL);
  await page.getByTestId(`day-btn-${day}`).click();
  await expect(page.getByTestId('puzzle-heading')).toHaveText(`Audio Connections ${day}`);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.locator('.tile')).toHaveCount(16);
}

/**
 * Map themeIdx → array of loaded track ids in the grid.
 * Each loaded track's stable `id` is its position (0–15) in the unshuffled
 * theme×track list, so `themeIdx = floor(id / 4)`.
 */
function groupByTheme(ids: number[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (const id of ids) {
    const t = Math.floor(id / 4);
    const arr = out.get(t) ?? [];
    arr.push(id);
    out.set(t, arr);
  }
  return out;
}

async function readTrackIds(page: Page): Promise<number[]> {
  return await page.$$eval('.tile[data-track-id]', (els) =>
    els.map((el) => Number((el as HTMLElement).dataset.trackId)),
  );
}

async function selectIds(page: Page, ids: number[]) {
  for (const id of ids) {
    await page.getByTestId(`select-${id}`).click();
  }
}

test.describe('Audio Connections — Day 1 gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDay(page, 1);
  });

  test('renders heading, date, and 16 tiles', async ({ page }) => {
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.getByTestId('puzzle-date')).not.toBeEmpty();
    await expect(page.locator('.tile')).toHaveCount(16);
  });

  test('submit button is disabled until 4 are selected; Deselect clears', async ({ page }) => {
    const submit = page.getByTestId('submit-btn');
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText('Submit (0/4)');

    const ids = await readTrackIds(page);
    const themes = groupByTheme(ids);
    const firstTheme = themes.get(0)!;
    await selectIds(page, [firstTheme[0]!]);
    await expect(submit).toHaveText('Submit (1/4)');
    await expect(submit).toBeDisabled();

    await selectIds(page, firstTheme.slice(1));
    await expect(submit).toHaveText('Submit (4/4)');
    await expect(submit).toBeEnabled();

    await page.getByTestId('deselect-btn').click();
    await expect(submit).toHaveText('Submit (0/4)');
    await expect(submit).toBeDisabled();
  });

  test('submitting a correct group shows the solved banner and removes tiles', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    await selectIds(page, themes.get(0)!);
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('solved-row-0')).toBeVisible();
    await expect(page.getByTestId('solved-row-0')).toContainText(puzzles[0]!.themes[0]!.theme);
    await expect(page.locator('.tile')).toHaveCount(12, { timeout: 4000 });
  });

  test('an incorrect group costs a mistake and shows status', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const mixed = [themes.get(0)![0]!, themes.get(1)![0]!, themes.get(2)![0]!, themes.get(3)![0]!];
    await selectIds(page, mixed);
    await page.getByTestId('submit-btn').click();
    await expect(page.getByTestId('status')).toContainText(/Not a group|One away/);
    await expect(page.locator('.mistake-dot.used')).toHaveCount(1);
  });

  test('"one away" message when 3 of 4 share a theme', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const oneAway = [
      themes.get(0)![0]!,
      themes.get(0)![1]!,
      themes.get(0)![2]!,
      themes.get(1)![0]!,
    ];
    await selectIds(page, oneAway);
    await page.getByTestId('submit-btn').click();
    await expect(page.getByTestId('status')).toContainText('One away');
  });

  test('solving all four themes shows the end panel with share text', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    for (let t = 0; t < 4; t++) {
      await selectIds(page, themes.get(t)!);
      await page.getByTestId('submit-btn').click();
      await expect(page.getByTestId(`solved-row-${t}`)).toBeVisible();
    }
    await expect(page.getByTestId('end-panel')).toBeVisible();
    await expect(page.getByTestId('end-panel')).toContainText('Solved!');
    await expect(page.getByTestId('share-text')).toContainText('Audio Connections 1');
    const share = await page.getByTestId('share-text').textContent();
    expect(share!.split('\n').length).toBe(5);
  });

  test('four wrong guesses ends the game with "Game over"', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const wrongSets = [
      [themes.get(0)![0]!, themes.get(1)![0]!, themes.get(2)![0]!, themes.get(3)![0]!],
      [themes.get(0)![1]!, themes.get(1)![1]!, themes.get(2)![1]!, themes.get(3)![1]!],
      [themes.get(0)![2]!, themes.get(1)![2]!, themes.get(2)![2]!, themes.get(3)![2]!],
      [themes.get(0)![3]!, themes.get(1)![3]!, themes.get(2)![3]!, themes.get(3)![3]!],
    ];
    for (let i = 0; i < wrongSets.length; i++) {
      if (i > 0) await page.getByTestId('deselect-btn').click();
      await selectIds(page, wrongSets[i]!);
      await page.getByTestId('submit-btn').click();
    }
    await expect(page.getByTestId('end-panel')).toBeVisible();
    await expect(page.getByTestId('end-panel')).toContainText('Game over');
    await expect(page.locator('.mistake-dot.used')).toHaveCount(4);
  });

  test('tile note input persists value while typing', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const id = themes.get(0)![0]!;
    const input = page.locator(`[data-testid="tile-${id}"] .tile-label-input`);
    await input.fill('mine');
    await input.press('Enter');
    await expect(input).toHaveValue('mine');
  });
});

test.describe('Audio Connections — day switching', () => {
  test('Day 1, 2, 3 are all reachable when releaseAt has passed for them', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('day-btn-1').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.locator('.tile')).toHaveCount(16);

    await page.getByTestId('day-btn-2').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 2');
    await expect(page.locator('.tile')).toHaveCount(16);
  });
});
