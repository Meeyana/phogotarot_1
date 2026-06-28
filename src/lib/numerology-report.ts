import {
  calculateLifePath,
  calculateDestiny,
  calculateSoul,
  calculatePersonality,
  calculateAttitude,
  calculateMaturity,
  calculateRationalThought,
  calculatePyramid,
  calculateChartData,
  calculatePeriodCycles,
  calculateKarmicDebt,
  calculateKarmicLessons,
  calculatePersonalityPercentages,
  calculateCareerPercentages,
  calculateForecast
} from '../utils/numerology';
import * as numData from '../utils/numerology-data';

export type NumerologyReportInput = {
  fullName: string;
  dobStr: string;
  nickname?: string;
  gender?: string;
};

export function getNumerologyProfileId(input: NumerologyReportInput) {
  return `${input.fullName.toLowerCase().trim()}|${input.dobStr}|${(input.nickname || '').toLowerCase().trim()}|${(input.gender || '').toLowerCase().trim()}`;
}

export async function buildNumerologyReport(input: NumerologyReportInput) {
  const fullName = input.fullName || 'Bạn Mình';
  const dobStr = input.dobStr || '2000-01-01';
  const nickname = input.nickname || '';
  const gender = input.gender || '';
  const [yStr, mStr, dStr] = dobStr.split('-');
  const day = parseInt(dStr);
  const month = parseInt(mStr);
  const year = parseInt(yStr);
  const formattedDob = `${day}/${month}/${year}`;
  const kv = null;

  const lifePath = calculateLifePath(day, month, year);
  const destiny = calculateDestiny(fullName);
  const soul = calculateSoul(fullName);
  const personality = calculatePersonality(fullName);
  const attitude = calculateAttitude(day, month);
  const maturity = calculateMaturity(lifePath, destiny);
  const rational = calculateRationalThought(day, destiny);
  const pyramid = calculatePyramid(day, month, year, lifePath);
  const chartData = calculateChartData(day, month, year, fullName, nickname);
  const periodCycles = calculatePeriodCycles(day, month, year, lifePath);
  const karmicDebts = calculateKarmicDebt(day, month, year, fullName);
  const karmicLessons = calculateKarmicLessons(fullName);
  const personalityStats = calculatePersonalityPercentages(chartData.strengthData, chartData.nameData, lifePath, destiny, soul, personality);
  const careerStats = calculateCareerPercentages(day, month, year, fullName, nickname, lifePath, destiny, soul);
  const forecast = calculateForecast(day, month);

  const coreStatsDataMap = {
    destiny: await numData.getDestinyDataKV(kv, destiny),
    soul: await numData.getSoulDataKV(kv, soul),
    personality: await numData.getPersonalityDataKV(kv, personality),
    attitude: await numData.getAttitudeDataKV(kv, attitude),
    maturity: await numData.getMaturityDataKV(kv, maturity),
    rational: await numData.getRationalDataKV(kv, rational)
  };

  const strengthDataStore: Record<number, any> = {};
  for (let index = 0; index < chartData.strengthData.length; index++) {
    const count = chartData.strengthData[index];
    if (count > 0) strengthDataStore[index + 1] = await numData.getGridDataKV(kv, 'strengthGrid', index + 1);
  }

  const synthesisDataStore: Record<number, any> = {};
  for (let index = 0; index < chartData.synthesisData.length; index++) {
    const count = chartData.synthesisData[index];
    if (count > 0) synthesisDataStore[index + 1] = await numData.getGridDataKV(kv, 'synthesisGrid', index + 1);
  }

  const arrowStore: Record<string, any> = {};
  const mapArrows = async (arrowList: any[], chartType: 'strength' | 'synthesis') => {
    if (!arrowList) return;
    for (const arrow of arrowList) {
      if (!arrowStore[arrow.id]) arrowStore[arrow.id] = {};
      arrowStore[arrow.id][arrow.type] = await numData.getArrowDataKV(kv, chartType, arrow.id, arrow.type);
    }
  };
  await mapArrows(chartData.strengthArrows, 'strength');
  await mapArrows(chartData.synthesisArrows, 'synthesis');

  const missingStore: Record<number, any> = {};
  const mapMissing = async (missingList: number[], chartType: 'strength' | 'synthesis') => {
    if (!missingList) return;
    for (const num of missingList) {
      missingStore[num] = await numData.getMissingNumberDataKV(kv, chartType, num);
    }
  };
  await mapMissing(chartData.strengthMissingNums, 'strength');
  await mapMissing(chartData.synthesisMissingNums, 'synthesis');

  const cyclesDataStore: Record<number, any> = {
    [periodCycles.c1.number]: await numData.getPeriodCycleDataKV(kv, periodCycles.c1.number),
    [periodCycles.c2.number]: await numData.getPeriodCycleDataKV(kv, periodCycles.c2.number),
    [periodCycles.c3.number]: await numData.getPeriodCycleDataKV(kv, periodCycles.c3.number)
  };

  const yearDataStore: Record<number, any> = {};
  for (const item of forecast.years) {
    yearDataStore[item.number] = await numData.getForecastYearDataKV(kv, item.number);
  }

  const monthDataStore: Record<number, any> = {};
  for (const item of forecast.months) {
    monthDataStore[item.number] = await numData.getForecastMonthDataKV(kv, item.number);
  }

  const pyramidDataStore = {
    peaks: {
      [pyramid.peaks.p1]: await numData.getPyramidDataKV(kv, 'peaks', pyramid.peaks.p1),
      [pyramid.peaks.p2]: await numData.getPyramidDataKV(kv, 'peaks', pyramid.peaks.p2),
      [pyramid.peaks.p3]: await numData.getPyramidDataKV(kv, 'peaks', pyramid.peaks.p3),
      [pyramid.peaks.p4]: await numData.getPyramidDataKV(kv, 'peaks', pyramid.peaks.p4)
    },
    challenges: {
      [pyramid.challenges.c1]: await numData.getPyramidDataKV(kv, 'challenges', pyramid.challenges.c1),
      [pyramid.challenges.c2]: await numData.getPyramidDataKV(kv, 'challenges', pyramid.challenges.c2),
      [pyramid.challenges.c3]: await numData.getPyramidDataKV(kv, 'challenges', pyramid.challenges.c3),
      [pyramid.challenges.c4]: await numData.getPyramidDataKV(kv, 'challenges', pyramid.challenges.c4)
    }
  };

  const debtDataStore: Record<number, any> = {};
  for (const debt of karmicDebts) {
    debtDataStore[debt] = await numData.getKarmicDebtDataKV(kv, debt);
  }

  const lessonDataStore: Record<number, any> = {};
  for (const lesson of karmicLessons) {
    lessonDataStore[lesson] = await numData.getKarmicLessonDataKV(kv, lesson);
  }

  return {
    input: { fullName, dobStr, nickname, gender, formattedDob, day, month, year },
    numbers: { lifePath, destiny, soul, personality, attitude, maturity, rational },
    pyramid,
    chartData,
    periodCycles,
    karmicDebts,
    karmicLessons,
    personalityStats,
    careerStats,
    forecast,
    content: {
      lifePath: await numData.getLifePathDataKV(kv, lifePath),
      coreStatsDataMap,
      strengthDataStore,
      synthesisDataStore,
      arrowStore,
      missingStore,
      cyclesDataStore,
      yearDataStore,
      monthDataStore,
      pyramidDataStore,
      debtDataStore,
      lessonDataStore,
      personalityChart: await numData.getPersonalityChartDataKV(kv),
      careerChart: await numData.getCareerChartDataKV(kv)
    }
  };
}
