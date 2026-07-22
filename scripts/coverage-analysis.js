#!/usr/bin/env node

/**
 * Coverage Analysis Script
 * Analyzes test coverage and generates detailed reports
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, 'coverage');
const COVERAGE_SUMMARY = path.join(COVERAGE_DIR, 'coverage-summary.json');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Format percentage with color
 */
function formatPercentage(value, threshold = 70) {
  const color = value >= threshold ? colors.green : value >= 50 ? colors.yellow : colors.red;
  return `${color}${value.toFixed(2)}%${colors.reset}`;
}

/**
 * Read coverage summary
 */
function readCoverageSummary() {
  try {
    if (!fs.existsSync(COVERAGE_SUMMARY)) {
      console.log(`${colors.yellow}Coverage summary not found. Run tests with coverage first.${colors.reset}`);
      console.log('Run: npm test -- --coverage');
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(COVERAGE_SUMMARY, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}Error reading coverage summary: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Analyze coverage data
 */
function analyzeCoverage(summary) {
  const total = summary.total;
  
  console.log(`\n${colors.cyan}=== Code Coverage Report ===${colors.reset}\n`);
  
  // Global coverage
  console.log(`${colors.blue}Global Coverage:${colors.reset}`);
  console.log(`  Lines:       ${formatPercentage(total.lines.pct)}`);
  console.log(`  Statements:  ${formatPercentage(total.statements.pct)}`);
  console.log(`  Functions:   ${formatPercentage(total.functions.pct)}`);
  console.log(`  Branches:    ${formatPercentage(total.branches.pct)}`);
  
  // File-level coverage
  console.log(`\n${colors.blue}File Coverage:${colors.reset}`);
  
  const files = Object.entries(summary)
    .filter(([key]) => key !== 'total')
    .sort(([a], [b]) => a.localeCompare(b));
  
  let lowCoverageFiles = [];
  
  files.forEach(([file, coverage]) => {
    const linesCov = coverage.lines.pct;
    const isCritical = file.includes('api') || file.includes('lib');
    const threshold = isCritical ? 70 : 50;
    
    if (linesCov < threshold) {
      lowCoverageFiles.push({ file, coverage: linesCov, threshold });
    }
    
    console.log(`  ${file}`);
    console.log(`    Lines: ${formatPercentage(linesCov, threshold)}`);
  });
  
  // Summary
  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total Files: ${files.length}`);
  console.log(`  Low Coverage Files: ${colors.red}${lowCoverageFiles.length}${colors.reset}`);
  
  if (lowCoverageFiles.length > 0) {
    console.log(`\n${colors.yellow}Files Below Threshold:${colors.reset}`);
    lowCoverageFiles.forEach(({ file, coverage, threshold }) => {
      console.log(`  ${file}: ${formatPercentage(coverage, threshold)} (threshold: ${threshold}%)`);
    });
  }
  
  // Coverage trends
  console.log(`\n${colors.blue}Coverage Metrics:${colors.reset}`);
  console.log(`  Covered Lines: ${total.lines.covered}/${total.lines.total}`);
  console.log(`  Covered Statements: ${total.statements.covered}/${total.statements.total}`);
  console.log(`  Covered Functions: ${total.functions.covered}/${total.functions.total}`);
  console.log(`  Covered Branches: ${total.branches.covered}/${total.branches.total}`);
  
  // Recommendations
  console.log(`\n${colors.blue}Recommendations:${colors.reset}`);
  if (total.lines.pct < 60) {
    console.log(`  ${colors.yellow}• Increase unit test coverage for critical paths${colors.reset}`);
  }
  if (total.branches.pct < 60) {
    console.log(`  ${colors.yellow}• Add tests for conditional branches and error cases${colors.reset}`);
  }
  if (lowCoverageFiles.length > 0) {
    console.log(`  ${colors.yellow}• Focus on improving coverage for: ${lowCoverageFiles.map(f => f.file).join(', ')}${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}=== End of Report ===${colors.reset}\n`);
  
  // Return exit code based on coverage
  return total.lines.pct >= 60 ? 0 : 1;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(summary) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Code Coverage Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 30px;
    }
    .metric {
      display: inline-block;
      margin: 10px 20px 10px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #007bff;
      border-radius: 4px;
    }
    .metric-label {
      font-weight: bold;
      color: #666;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      margin-top: 5px;
    }
    .good { color: #28a745; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #007bff;
      color: white;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background-color: #28a745;
      transition: width 0.3s ease;
    }
    .progress-fill.warning {
      background-color: #ffc107;
    }
    .progress-fill.danger {
      background-color: #dc3545;
    }
    .timestamp {
      color: #999;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Code Coverage Report</h1>
    
    <h2>Global Coverage</h2>
    <div>
      ${generateMetricHTML('Lines', summary.total.lines.pct)}
      ${generateMetricHTML('Statements', summary.total.statements.pct)}
      ${generateMetricHTML('Functions', summary.total.functions.pct)}
      ${generateMetricHTML('Branches', summary.total.branches.pct)}
    </div>
    
    <h2>File Coverage Details</h2>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Lines</th>
          <th>Statements</th>
          <th>Functions</th>
          <th>Branches</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(summary)
          .filter(([key]) => key !== 'total')
          .map(([file, coverage]) => `
            <tr>
              <td>${file}</td>
              <td>${generateProgressBar(coverage.lines.pct)}</td>
              <td>${generateProgressBar(coverage.statements.pct)}</td>
              <td>${generateProgressBar(coverage.functions.pct)}</td>
              <td>${generateProgressBar(coverage.branches.pct)}</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
    
    <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
  </div>
</body>
</html>
  `;
  
  const reportPath = path.join(COVERAGE_DIR, 'coverage-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`${colors.green}HTML report generated: ${reportPath}${colors.reset}`);
}

/**
 * Generate metric HTML
 */
function generateMetricHTML(label, value) {
  const className = value >= 70 ? 'good' : value >= 50 ? 'warning' : 'danger';
  return `
    <div class="metric">
      <div class="metric-label">${label}</div>
      <div class="metric-value ${className}">${value.toFixed(2)}%</div>
    </div>
  `;
}

/**
 * Generate progress bar HTML
 */
function generateProgressBar(value) {
  const className = value >= 70 ? '' : value >= 50 ? 'warning' : 'danger';
  return `
    <div class="progress-bar">
      <div class="progress-fill ${className}" style="width: ${value}%"></div>
    </div>
    <span>${value.toFixed(2)}%</span>
  `;
}

// Main execution
const summary = readCoverageSummary();
generateHTMLReport(summary);
const exitCode = analyzeCoverage(summary);
process.exit(exitCode);
