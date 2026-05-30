import fullNumerologyData from '../data/numerology-data.json';

// Helper để lấy data theo category an toàn
export function getCategoryData(category: string, key: string | number) {
  const catData = (fullNumerologyData as any)[category];
  if (!catData) return null;
  return catData[key] || catData['default'] || null;
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
  return getCategoryData(type, number);
}

export function getArrowData(chartType: 'strength' | 'synthesis', arrowId: string, arrowType: 'present' | 'missing') {
  const arrows = (fullNumerologyData as any).arrows;
  if (!arrows || !arrows[chartType] || !arrows[chartType][arrowId]) return null;
  return arrows[chartType][arrowId][arrowType] || null;
}

export function getMissingNumberData(chartType: 'strength' | 'synthesis', number: number) {
  const missing = (fullNumerologyData as any).missingNumbers;
  if (!missing || !missing[chartType]) return null;
  return missing[chartType][number] || null;
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
  const pyramid = (fullNumerologyData as any).pyramid;
  if (!pyramid || !pyramid[type]) return null;
  return pyramid[type][number] || null;
}

export function getPersonalityChartData() {
  return (fullNumerologyData as any).personalityChart || null;
}

export function getCareerChartData() {
  return (fullNumerologyData as any).careerChart || null;
}
