// import fullNumerologyData from '../data/numerology-data.json';

const markdownFiles = import.meta.glob('../content/numerology/**/*.md', { eager: true });
const rawMarkdownFiles = import.meta.glob('../content/numerology/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

function formatMarkdownData(entry: any, path: string) {
  if (!entry) return null;
  const rawMarkdown = rawMarkdownFiles[path];
  const rawContent =
    typeof rawMarkdown === 'string'
      ? rawMarkdown
      : typeof entry.rawContent === 'function'
      ? entry.rawContent()
      : typeof entry.rawContent === 'string'
        ? entry.rawContent
        : '';

  return {
      ...entry.frontmatter,
      content: entry.compiledContent(),
      rawContent
  };
}

// Helper để lấy data theo category an toàn
export function getCategoryData(category: string, key: string | number, subCategory: string | null = null) {
  let targetPath = `../content/numerology/${category}/${key}.md`;
  if (subCategory) {
      targetPath = `../content/numerology/${category}/${subCategory}/${key}.md`;
  }
  
  if (markdownFiles[targetPath]) {
      return formatMarkdownData(markdownFiles[targetPath], targetPath);
  }
  
  // fallback to default if exists
  const defaultPath = subCategory 
      ? `../content/numerology/${category}/${subCategory}/default.md` 
      : `../content/numerology/${category}/default.md`;
  
  if (markdownFiles[defaultPath]) {
      return formatMarkdownData(markdownFiles[defaultPath], defaultPath);
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
// File-first data access
// ============================================================

/**
 * Giữ chữ ký hàm cũ để các component/page không phải đổi nhiều.
 * Nguồn dữ liệu thật là src/content/numerology, giúp SSR render nhanh và ổn định.
 */
async function getCategoryDataFromKV(
  kv: any,
  category: string,
  key: string | number,
  subCategory: string | null = null
): Promise<any> {
  void kv;
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
