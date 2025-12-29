/**
 * CSV Export Utility
 * Converts test cases to CSV format for Jira/Zephyr import
 */

export function exportToCSV(
  testCasesContent: string,
  format: 'table' | 'gherkin',
  fileName: string = 'test-cases'
): void {
  let csvContent = '';

  if (format === 'table') {
    // Parse table format
    const lines = testCasesContent.split('\n');
    const rows: string[][] = [];

    // Extract table rows
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('|') && !trimmed.startsWith('---')) {
        const cells = trimmed
          .split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
    }

    // Convert to CSV
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
    });
  } else {
    // Parse Gherkin format
    const scenarios = testCasesContent.split(/Scenario:/);
    const rows: string[][] = [['ID', 'Title', 'Steps', 'Expected Result', 'Priority']];

    scenarios.forEach((scenario, index) => {
      if (scenario.trim()) {
        const lines = scenario.split('\n').map(l => l.trim()).filter(l => l);
        const title = lines[0] || `Scenario ${index}`;
        const steps = lines
          .filter(l => l.startsWith('Given') || l.startsWith('When') || l.startsWith('Then') || l.startsWith('And'))
          .join(' | ');
        const expectedResult = lines
          .filter(l => l.startsWith('Then'))
          .map(l => l.replace(/^Then\s+/, ''))
          .join(' | ') || 'See steps';

        rows.push([
          `TC-${index + 1}`,
          title,
          steps,
          expectedResult,
          'Medium', // Default priority
        ]);
      }
    });

    csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  // Add header if not present
  if (!csvContent.includes('ID') && !csvContent.includes('Test ID')) {
    const header = 'ID,Title,Steps,Expected Result,Priority\n';
    csvContent = header + csvContent;
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}-test-cases-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


