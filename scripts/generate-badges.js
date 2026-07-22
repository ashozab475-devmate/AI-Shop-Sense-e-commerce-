#!/usr/bin/env node

/**
 * Coverage Badge Generator
 * Generates coverage badges for documentation
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const COVERAGE_SUMMARY = path.join(COVERAGE_DIR, 'coverage-summary.json');

/**
 * Get color for coverage percentage
 */
function getColor(percentage) {
  if (percentage >= 80) return 'brightgreen';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
}

/**
 * Generate SVG badge
 */
function generateBadge(label, percentage) {
  const color = getColor(percentage);
  const value = `${percentage.toFixed(1)}%`;
  
  // SVG badge template
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="140" height="20" role="img" aria-label="${label}: ${value}">
    <title>${label}: ${value}</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb"/>
      <stop offset="1" stop-color="#999"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="140" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="100" height="20" fill="#555"/>
      <rect x="100" width="40" height="20" fill="${color}"/>
      <rect width="140" height="20" fill="url(#s)" opacity="0.1"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
      <text aria-hidden="true" x="500" y="150" fill="#010101" fill-opacity="0.3" transform="scale(.1)" textLength="900">${label}</text>
      <text x="500" y="140" transform="scale(.1)" fill="#fff" textLength="900">${label}</text>
      <text aria-hidden="true" x="1190" y="150" fill="#010101" fill-opacity="0.3" transform="scale(.1)" textLength="300">${value}</text>
      <text x="1190" y="140" transform="scale(.1)" fill="#fff" textLength="300">${value}</text>
    </g>
  </svg>`;
}

/**
 * Generate markdown badges
 */
function generateMarkdownBadges(summary) {
  const total = summary.total;
  
  const badges = {
    lines: generateBadge('Lines', total.lines.pct),
    statements: generateBadge('Statements', total.statements.pct),
    functions: generateBadge('Functions', total.functions.pct),
    branches: generateBadge('Branches', total.branches.pct),
  };
  
  const markdown = `
# Coverage Badges

## Overall Coverage

![Lines](data:image/svg+xml;base64,${Buffer.from(badges.lines).toString('base64')})
![Statements](data:image/svg+xml;base64,${Buffer.from(badges.statements).toString('base64')})
![Functions](data:image/svg+xml;base64,${Buffer.from(badges.functions).toString('base64')})
![Branches](data:image/svg+xml;base64,${Buffer.from(badges.branches).toString('base64')})

## Coverage Summary

- **Lines**: ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})
- **Statements**: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})
- **Functions**: ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})
- **Branches**: ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})
`;
  
  return { markdown, badges };
}

/**
 * Save badges as SVG files
 */
function saveBadges(badges) {
  const badgesDir = path.join(COVERAGE_DIR, 'badges');
  
  if (!fs.existsSync(badgesDir)) {
    fs.mkdirSync(badgesDir, { recursive: true });
  }
  
  Object.entries(badges).forEach(([name, svg]) => {
    const filePath = path.join(badgesDir, `${name}.svg`);
    fs.writeFileSync(filePath, svg);
    console.log(`✓ Badge saved: ${filePath}`);
  });
}

// Main execution
try {
  if (!fs.existsSync(COVERAGE_SUMMARY)) {
    console.error('Coverage summary not found. Run tests with coverage first.');
    process.exit(1);
  }
  
  const summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY, 'utf8'));
  const { markdown, badges } = generateMarkdownBadges(summary);
  
  // Save badges
  saveBadges(badges);
  
  // Save markdown
  const badgesMarkdownPath = path.join(COVERAGE_DIR, 'BADGES.md');
  fs.writeFileSync(badgesMarkdownPath, markdown);
  console.log(`✓ Badges markdown saved: ${badgesMarkdownPath}`);
  
  console.log('\nBadges generated successfully!');
} catch (error) {
  console.error('Error generating badges:', error.message);
  process.exit(1);
}
