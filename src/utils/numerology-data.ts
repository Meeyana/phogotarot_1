// import fullNumerologyData from '../data/numerology-data.json';

const markdownFiles = import.meta.glob('../content/numerology/**/*.md', { eager: true });

function formatMarkdownData(entry: any) {
  if (!entry) return null;
  return {
      ...entry.frontmatter,
      content: entry.compiledContent()
  };
}

const FRONTMATTER_KEYS = new Set([
  'category',
  'number',
  'title',
  'subCategory',
  'description',
  'slug',
  'order',
  'draft'
]);

function parseScalarValue(value: string) {
  const v = String(value ?? '').trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (!Number.isNaN(Number(v)) && v !== '') return Number(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseYamlLikeFrontmatter(yamlText: string) {
  const frontmatter: Record<string, any> = {};
  for (const line of String(yamlText || '').split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (key) frontmatter[key] = parseScalarValue(value);
    }
  }
  return frontmatter;
}

function parseFrontmatterFromRawMarkdown(rawMarkdown: string) {
  const raw = String(rawMarkdown || '').replace(/^\uFEFF/, '');
  const delimited = raw.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (delimited) {
    return {
      frontmatter: parseYamlLikeFrontmatter(delimited[1]),
      body: delimited[2].replace(/^\s+/, '')
    };
  }

  const lines = raw.split(/\r?\n/);
  const frontmatter: Record<string, any> = {};
  let cursor = 0;
  let consumed = 0;

  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor];
    if (!line.trim()) {
      if (consumed > 0) cursor++;
      break;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) break;

    const field = line.slice(0, colonIdx).trim();
    if (!FRONTMATTER_KEYS.has(field)) break;

    frontmatter[field] = parseScalarValue(line.slice(colonIdx + 1));
    consumed++;
  }

  return consumed > 0
    ? { frontmatter, body: lines.slice(cursor).join('\n').replace(/^\s+/, '') }
    : { frontmatter: {}, body: raw };
}

function stripLeakedFrontmatterHtml(content: string) {
  let html = String(content || '').trimStart();

  // Bad KV entries produced from raw frontmatter look like:
  // <hr> category: ... title: ... <hr> <h3>...
  const hrMatch = html.match(/^<hr\s*\/?>\s*([\s\S]*?)\s*<hr\s*\/?>\s*/i);
  if (hrMatch) {
    return {
      frontmatter: parseYamlLikeFrontmatter(hrMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')),
      content: html.slice(hrMatch[0].length).trimStart()
    };
  }

  // A second defensive path for entries where the --- lines were already dropped.
  const textPrefix = html.match(/^((?:(?:category|number|title|subCategory|description|slug|order|draft):[^\n<]*(?:\n|<br\s*\/?>))+)\s*/i);
  if (textPrefix) {
    return {
      frontmatter: parseYamlLikeFrontmatter(textPrefix[1].replace(/<br\s*\/?>/gi, '\n')),
      content: html.slice(textPrefix[0].length).trimStart()
    };
  }

  return { frontmatter: {}, content };
}

function normalizeKvData(kvData: any) {
  const rawParsed = kvData?.rawMarkdown ? parseFrontmatterFromRawMarkdown(kvData.rawMarkdown) : null;
  const htmlParsed = stripLeakedFrontmatterHtml(kvData?.content || '');

  return {
    ...(rawParsed?.frontmatter || {}),
    ...(htmlParsed.frontmatter || {}),
    ...(kvData?.frontmatter || {}),
    content: htmlParsed.content
  };
}

// Helper để lấy data theo category an toàn
export function getCategoryData(category: string, key: string | number, subCategory: string | null = null) {
  let targetPath = `../content/numerology/${category}/${key}.md`;
  if (subCategory) {
      targetPath = `../content/numerology/${category}/${subCategory}/${key}.md`;
  }
  
  if (markdownFiles[targetPath]) {
      return formatMarkdownData(markdownFiles[targetPath]);
  }
  
  // fallback to default if exists
  const defaultPath = subCategory 
      ? `../content/numerology/${category}/${subCategory}/default.md` 
      : `../content/numerology/${category}/default.md`;
  
  if (markdownFiles[defaultPath]) {
      return formatMarkdownData(markdownFiles[defaultPath]);
  }
  
  return null;
}

export function getLifePathData(number: number) {
  return getCategoryData('lifePath', number);
}

export function getDestinyData(number: number) {
  return getCategoryData('destiny', number);
}

export function getSoulData(number: number) {
  return getCategoryData('soul', number);
}

export function getPersonalityData(number: number) {
  return getCategoryData('personality', number);
}

export function getAttitudeData(number: number) {
  return getCategoryData('attitude', number);
}

export function getMaturityData(number: number) {
  return getCategoryData('maturity', number);
}

export function getRationalData(number: number) {
  return getCategoryData('rational', number);
}

export function getGridData(type: 'strengthGrid' | 'synthesisGrid', number: number) {
  // strengthGrid and synthesisGrid were in JSON root or sub? Wait.
  // In our script, they were actually named 'strengthGrid' and 'synthesisGrid' at root?
  // Let's check script:
  // Wait, I did not include 'strengthGrid' in simpleCategories!
  // Oh no! simpleCategories = ['lifePath', 'destiny', 'soul', 'personality', 'attitude', 'maturity', 'rational', 'karmicDebt', 'karmicLessons', 'periodCycleMeanings', 'personalYear', 'personalMonth', 'personalityChart', 'careerChart'];
  // But JSON had strengthGrid and synthesisGrid?
  return getCategoryData(type, number);
}

export function getArrowData(chartType: 'strength' | 'synthesis', arrowId: string, arrowType: 'present' | 'missing') {
  return getCategoryData('arrows', arrowId, `${chartType}_${arrowType}`);
}

export function getMissingNumberData(chartType: 'strength' | 'synthesis', number: number) {
  return getCategoryData('missingNumbers', number, chartType);
}

export function getKarmicDebtData(number: number) {
  return getCategoryData('karmicDebt', number);
}

export function getKarmicLessonData(number: number) {
  return getCategoryData('karmicLessons', number);
}

export function getPeriodCycleData(number: number) {
  return getCategoryData('periodCycleMeanings', number);
}

export function getForecastYearData(number: number) {
  return getCategoryData('personalYear', number);
}

export function getForecastMonthData(number: number) {
  return getCategoryData('personalMonth', number);
}

export function getPyramidData(type: 'peaks' | 'challenges', number: number) {
  return getCategoryData('pyramid', number, type);
}

export function getPersonalityChartData() {
  // Was mapped to personalityChart/personalityChart or personalityChart/default ?
  // Actually the JSON was: { "personalityChart": { "title": "...", "content": "..." } }
  // So the script output `src/content/numerology/personalityChart/personalityChart.md`
  // Wait, if it was an object at root:
  return getCategoryData('personalityChart', 'personalityChart') || getCategoryData('personalityChart', 'default');
}

export function getCareerChartData() {
  return getCategoryData('careerChart', 'careerChart') || getCategoryData('careerChart', 'default');
}

// ============================================================
// KV-FIRST DATA ACCESS (Primary: KV, Fallback: File)
// ============================================================

/**
 * Đọc dữ liệu từ KV trước, nếu không có thì fallback về file cứng.
 * @param kv - KVNamespace (env.NUMEROLOGY_KV), có thể null/undefined
 */
async function getCategoryDataFromKV(
  kv: any,
  category: string,
  key: string | number,
  subCategory: string | null = null
): Promise<any> {
  // 1. Thử đọc từ KV
  if (kv) {
    try {
      const kvKey = subCategory
        ? `numerology:${category}:${subCategory}:${key}`
        : `numerology:${category}:${key}`;
      const kvData = await kv.get(kvKey, 'json');
      if (kvData && kvData.content) {
        return normalizeKvData(kvData);
      }
    } catch (e) {
      // KV lỗi → fallback
    }
  }

  // 2. Fallback về file cứng (build-time)
  return getCategoryData(category, String(key), subCategory);
}

// --- KV-First exported functions ---

export async function getLifePathDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'lifePath', number);
}

export async function getDestinyDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'destiny', number);
}

export async function getSoulDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'soul', number);
}

export async function getPersonalityDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'personality', number);
}

export async function getAttitudeDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'attitude', number);
}

export async function getMaturityDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'maturity', number);
}

export async function getRationalDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'rational', number);
}

export async function getGridDataKV(kv: any, type: 'strengthGrid' | 'synthesisGrid', number: number) {
  return getCategoryDataFromKV(kv, type, number);
}

export async function getArrowDataKV(kv: any, chartType: 'strength' | 'synthesis', arrowId: string, arrowType: 'present' | 'missing') {
  return getCategoryDataFromKV(kv, 'arrows', arrowId, `${chartType}_${arrowType}`);
}

export async function getMissingNumberDataKV(kv: any, chartType: 'strength' | 'synthesis', number: number) {
  return getCategoryDataFromKV(kv, 'missingNumbers', number, chartType);
}

export async function getKarmicDebtDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'karmicDebt', number);
}

export async function getKarmicLessonDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'karmicLessons', number);
}

export async function getPeriodCycleDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'periodCycleMeanings', number);
}

export async function getForecastYearDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'personalYear', number);
}

export async function getForecastMonthDataKV(kv: any, number: number) {
  return getCategoryDataFromKV(kv, 'personalMonth', number);
}

export async function getPyramidDataKV(kv: any, type: 'peaks' | 'challenges', number: number) {
  return getCategoryDataFromKV(kv, 'pyramid', number, type);
}

export async function getPersonalityChartDataKV(kv: any) {
  const result = await getCategoryDataFromKV(kv, 'personalityChart', 'personalityChart');
  if (result) return result;
  return getCategoryDataFromKV(kv, 'personalityChart', 'default');
}

export async function getCareerChartDataKV(kv: any) {
  const result = await getCategoryDataFromKV(kv, 'careerChart', 'careerChart');
  if (result) return result;
  return getCategoryDataFromKV(kv, 'careerChart', 'default');
}
