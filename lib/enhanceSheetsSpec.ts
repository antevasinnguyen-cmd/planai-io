/**
 * Enhance Google Sheets specification for premium tiers
 * Creates comprehensive 7-sheet structure for financial planning
 */

export function enhanceSheetsSpec(tier: string, userInfo: any, planData: any) {
  // Only enable for pro and premium tiers
  if (tier !== 'pro' && tier !== 'premium') {
    return {
      enabled: false,
      title: 'Upgrade to Pro/Premium for Google Sheets automation'
    }
  }

  const timeline = userInfo?.timeline || '12 tháng'
  const months = parseInt(timeline) || 12
  
  return {
    enabled: true,
    title: `Financial Plan Tracker - ${userInfo?.full_name || 'User'}`,
    sheets: [
      {
        name: 'Dashboard',
        headers: ['Metric', 'Current', 'Target', 'Progress %', 'Status'],
        rows: [
          ['Total Goals', '0', String(planData.totalGoals || 0), '=B2/C2*100', '=IF(D2>=100,"✅","⏳")'],
          ['Monthly Savings', '0', String(planData.monthlySavings || 0), '=B3/C3*100', '=IF(D3>=100,"✅","⏳")'],
          ['Income Growth', String(userInfo.income || 0), String(planData.targetIncome || 0), '=B4/C4*100', '=IF(D4>=100,"✅","⏳")'],
          ['Net Worth', '0', String(planData.targetNetWorth || 0), '=B5/C5*100', '=IF(D5>=100,"✅","⏳")'],
          ['Emergency Fund', '0', String((userInfo.income || 0) * 6), '=B6/C6*100', '=IF(D6>=100,"✅","⏳")']
        ],
        formatting: {
          conditionalFormat: 'D:D',
          colors: { '<50': 'red', '50-80': 'yellow', '>80': 'green' }
        }
      },
      {
        name: 'Roadmap',
        headers: ['Timeline', 'Milestone', 'Actions', 'Status', 'Notes'],
        rows: generateRoadmapRows(months),
        formatting: {
          conditionalFormat: 'D:D',
          checkboxColumn: 'D'
        }
      },
      {
        name: 'Checklist',
        headers: ['Category', 'Task', 'Due Date', 'Done', 'Priority', 'Link'],
        rows: [
          ['Financial', 'Open savings account', '=TODAY()+7', '☐', 'High', 'https://www.vietcombank.com.vn'],
          ['Financial', 'Setup auto-transfer', '=TODAY()+14', '☐', 'High', 'Banking app'],
          ['Investment', 'Open trading account', '=TODAY()+30', '☐', 'Medium', 'https://www.ssi.com.vn'],
          ['Investment', 'Research ETFs', '=TODAY()+21', '☐', 'Medium', 'https://www.vndirect.com.vn'],
          ['Learning', 'Complete finance course', '=TODAY()+60', '☐', 'High', 'https://www.coursera.org'],
          ['Income', 'Update LinkedIn profile', '=TODAY()+3', '☐', 'High', 'https://www.linkedin.com'],
          ['Income', 'Apply for freelance gigs', '=TODAY()+7', '☐', 'High', 'https://www.upwork.com'],
          ['Business', 'Register business license', '=TODAY()+30', '☐', 'Medium', 'https://dangkykinhdoanh.gov.vn'],
          ['Skills', 'Learn Excel advanced', '=TODAY()+14', '☐', 'Medium', 'https://www.youtube.com'],
          ['Review', 'Monthly finance review', '=EOMONTH(TODAY(),0)', '☐', 'High', 'This spreadsheet']
        ],
        formatting: {
          checkboxColumn: 'D',
          priorityColors: { 'High': 'red', 'Medium': 'yellow', 'Low': 'green' }
        }
      },
      {
        name: 'Savings Tracker',
        headers: ['Month', 'Income', 'Expenses', 'Savings', 'Cumulative', 'Goal', 'Gap'],
        rows: generateSavingsRows(months, userInfo.income || 0),
        formatting: {
          currencyColumns: 'B:G',
          conditionalFormat: 'G:G',
          colors: { '<0': 'red', '>=0': 'green' }
        }
      },
      {
        name: 'Income Growth',
        headers: ['Source', 'Current', 'Month 3', 'Month 6', 'Month 12', 'Growth %', 'Actions'],
        rows: [
          ['Main Job', String(userInfo.income || 0), '=B2*1.05', '=C2*1.05', '=D2*1.1', '=(E2-B2)/B2*100', 'Ask for raise'],
          ['Freelance', '0', '5000000', '10000000', '20000000', '=IF(B3=0,0,(E3-B3)/B3*100)', 'Start on Upwork'],
          ['Side Business', '0', '0', '5000000', '15000000', '=IF(B4=0,0,(E4-B4)/B4*100)', 'Launch product'],
          ['Investments', '0', '500000', '1000000', '3000000', '=IF(B5=0,0,(E5-B5)/B5*100)', 'Buy stocks/crypto'],
          ['Other', '0', '0', '1000000', '2000000', '=IF(B6=0,0,(E6-B6)/B6*100)', 'Affiliate marketing'],
          ['TOTAL', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)', '=SUM(E2:E6)', '=(E7-B7)/B7*100', '']
        ],
        formatting: {
          currencyColumns: 'B:E',
          percentColumn: 'F',
          boldRow: '7'
        }
      },
      {
        name: 'Business Metrics',
        headers: ['Metric', 'Month 1', 'Month 3', 'Month 6', 'Month 12', 'Target', 'Formula'],
        rows: [
          ['MRR', '0', '10000000', '30000000', '100000000', '100000000', 'Monthly Recurring Revenue'],
          ['ARR', '=B2*12', '=C2*12', '=D2*12', '=E2*12', '=F2*12', 'Annual Recurring Revenue'],
          ['Customers', '0', '10', '50', '200', '200', 'Total paying customers'],
          ['Churn Rate %', '0', '5', '3', '2', '2', 'Customer loss rate'],
          ['CAC', '500000', '400000', '300000', '200000', '200000', 'Customer Acquisition Cost'],
          ['LTV', '0', '2000000', '5000000', '10000000', '10000000', 'Lifetime Value'],
          ['LTV/CAC', '=IF(B6=0,0,B7/B6)', '=IF(C6=0,0,C7/C6)', '=IF(D6=0,0,D7/D6)', '=IF(E6=0,0,E7/E6)', '=IF(F6=0,0,F7/F6)', 'Should be > 3'],
          ['Burn Rate', '10000000', '15000000', '20000000', '10000000', '5000000', 'Monthly cash burn'],
          ['Runway (months)', '=IF(B9=0,0,50000000/B9)', '=IF(C9=0,0,50000000/C9)', '=IF(D9=0,0,100000000/D9)', '=IF(E9=0,0,200000000/E9)', '24', 'Months until cash out'],
          ['Profit Margin %', '-100', '-50', '0', '20', '30', 'Net profit margin']
        ],
        formatting: {
          currencyColumns: 'B:F',
          percentRows: '4,10',
          conditionalFormat: 'G:G'
        }
      },
      {
        name: 'Skills & Resources',
        headers: ['Category', 'Skill/Resource', 'Current Level', 'Target Level', 'Course/Link', 'Hours', 'Status'],
        rows: [
          ['Technical', 'Excel/Google Sheets', 'Basic', 'Advanced', 'https://www.coursera.org/learn/excel-basics', '20', '☐'],
          ['Technical', 'Data Analysis', 'None', 'Intermediate', 'https://www.udemy.com/course/data-analysis-python', '40', '☐'],
          ['Finance', 'Investment Basics', 'Basic', 'Advanced', 'https://www.youtube.com/watch?v=investment101', '30', '☐'],
          ['Finance', 'Tax Planning', 'None', 'Intermediate', 'https://thuedientu.gdt.gov.vn', '15', '☐'],
          ['Business', 'Digital Marketing', 'None', 'Advanced', 'https://learndigital.withgoogle.com', '50', '☐'],
          ['Business', 'Sales Skills', 'Basic', 'Expert', 'https://www.linkedin.com/learning/sales', '25', '☐'],
          ['Soft Skills', 'Negotiation', 'Basic', 'Advanced', 'https://www.masterclass.com/negotiation', '10', '☐'],
          ['Soft Skills', 'Leadership', 'None', 'Intermediate', 'https://www.ted.com/topics/leadership', '20', '☐'],
          ['Language', 'Business English', 'Intermediate', 'Advanced', 'https://www.britishcouncil.org', '100', '☐'],
          ['Mindset', 'Financial Psychology', 'None', 'Good', 'Book: Psychology of Money', '10', '☐']
        ],
        formatting: {
          checkboxColumn: 'G',
          levelColors: { 'None': 'red', 'Basic': 'yellow', 'Intermediate': 'blue', 'Advanced': 'green' }
        }
      }
    ]
  }
}

/**
 * Generate roadmap rows based on timeline
 */
function generateRoadmapRows(months: number): string[][] {
  const rows: string[][] = []
  const quarters = Math.ceil(months / 3)
  
  for (let q = 1; q <= quarters; q++) {
    rows.push([
      `Q${q} ${new Date().getFullYear()}`,
      `Quarter ${q} Goals`,
      'Define quarterly objectives',
      '☐',
      ''
    ])
    
    for (let m = 1; m <= 3 && (q - 1) * 3 + m <= months; m++) {
      const monthNum = (q - 1) * 3 + m
      rows.push([
        `Month ${monthNum}`,
        `Month ${monthNum} Milestone`,
        'Specific monthly actions',
        '☐',
        ''
      ])
    }
  }
  
  return rows
}

/**
 * Generate savings tracker rows
 */
function generateSavingsRows(months: number, income: number): string[][] {
  const rows: string[][] = []
  const targetSavingsRate = 0.3 // 30% savings rate
  
  for (let m = 1; m <= months; m++) {
    const row = m + 1 // Account for header row
    rows.push([
      `Month ${m}`,
      String(income),
      String(income * 0.7), // 70% expenses
      `=B${row}-C${row}`, // Savings formula
      m === 1 ? `=D${row}` : `=E${row - 1}+D${row}`, // Cumulative
      String(income * targetSavingsRate), // Goal
      `=D${row}-F${row}` // Gap
    ])
  }
  
  return rows
}

/**
 * Generate Google Apps Script for automation
 */
export function generateAppsScript(userEmail: string) {
  return `
// Google Apps Script for Financial Plan Automation
// Auto-generated by PlanAI

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PlanAI Tools')
    .addItem('Update Dashboard', 'updateDashboard')
    .addItem('Send Weekly Report', 'sendWeeklyReport')
    .addItem('Reset Checklist', 'resetChecklist')
    .addSeparator()
    .addItem('About', 'showAbout')
    .addToUi();
}

function updateDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName('Dashboard');
  
  // Update progress calculations
  dashboard.getRange('D2:D6').setFormula('=B2/C2*100');
  dashboard.getRange('E2:E6').setFormula('=IF(D2>=100,"✅","⏳")');
  
  // Add timestamp
  dashboard.getRange('A8').setValue('Last Updated:');
  dashboard.getRange('B8').setValue(new Date());
  
  SpreadsheetApp.getUi().alert('Dashboard updated successfully!');
}

function sendWeeklyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName('Dashboard');
  const checklist = ss.getSheetByName('Checklist');
  
  // Get progress data
  const progress = dashboard.getRange('A2:E6').getValues();
  const pendingTasks = checklist.getRange('A2:F11').getValues()
    .filter(row => row[3] === '☐' && row[4] === 'High');
  
  // Compose email
  let emailBody = 'Your Weekly Financial Plan Update:\\n\\n';
  emailBody += '📊 Progress Summary:\\n';
  progress.forEach(row => {
    emailBody += \`• \${row[0]}: \${Math.round(row[3])}% complete \${row[4]}\\n\`;
  });
  
  emailBody += '\\n📋 High Priority Pending Tasks:\\n';
  pendingTasks.forEach(task => {
    emailBody += \`• \${task[1]} (Due: \${task[2]})\\n\`;
  });
  
  // Send email
  MailApp.sendEmail({
    to: '${userEmail}',
    subject: 'PlanAI Weekly Progress Report',
    body: emailBody
  });
  
  SpreadsheetApp.getUi().alert('Weekly report sent to ${userEmail}');
}

function resetChecklist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const checklist = ss.getSheetByName('Checklist');
  
  // Reset all checkboxes
  const range = checklist.getRange('D2:D11');
  range.setValue('☐');
  
  SpreadsheetApp.getUi().alert('Checklist reset for new period');
}

function showAbout() {
  const htmlOutput = HtmlService
    .createHtmlOutput('<p>Financial Plan Tracker by <b>PlanAI</b></p>' +
                     '<p>Version: 1.0</p>' +
                     '<p>Visit: <a href="https://planai.io.vn">planai.io.vn</a></p>')
    .setWidth(300)
    .setHeight(150);
  SpreadsheetApp.getUi()
    .showModalDialog(htmlOutput, 'About PlanAI');
}

// Auto-run weekly report every Monday at 9 AM
function setupTriggers() {
  ScriptApp.newTrigger('sendWeeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
}
`
}
