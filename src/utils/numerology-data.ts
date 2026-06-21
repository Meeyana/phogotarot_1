// import fullNumerologyData from '../data/numerology-data.json';

const markdownFiles = import.meta.glob('../content/numerology/**/*.md', { eager: true });

function formatMarkdownData(entry: any) {
  if (!entry) return null;
  return {
      ...entry.frontmatter,
      content: entry.compiledContent()
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
