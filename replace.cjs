const fs = require('fs');
const files = [
  'src/components/numerology/ChartGridSection.astro',
  'src/components/numerology/CoreStatsSection.astro',
  'src/components/numerology/ForecastSection.astro',
  'src/components/numerology/KarmicSection.astro',
  'src/components/numerology/LifePathSection.astro',
  'src/components/numerology/PeriodCyclesSection.astro',
  'src/components/numerology/PersonalityCareerSection.astro',
  'src/components/numerology/PyramidSection.astro'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/<div class="text-center p-4">🔒 Nội dung Premium đang bị khóa<\/div>/g, '<LockedPlaceholder />');
  if (!content.includes('import LockedPlaceholder')) {
    content = content.replace(/---/, '---\nimport LockedPlaceholder from \'./LockedPlaceholder.astro\';');
  }
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated ' + f);
});
