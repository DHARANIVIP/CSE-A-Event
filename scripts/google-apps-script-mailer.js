/**
 * =========================================================================
 * DETECTRIX 2026 – AUTOMATED STUDENT CREDENTIALS MAILER (Google Apps Script)
 * =========================================================================
 * 
 * INSTRUCTIONS FOR SETUP:
 * 1. Open Google Sheets (https://sheets.google.com).
 * 2. File -> Import -> Upload the "content/student-credentials-distribution.csv"
 *    (or your student spreadsheet).
 * 3. In the top menu, go to: Extensions -> Apps Script.
 * 4. Delete any existing code in Code.gs, paste this entire file, and click Save (💾).
 * 5. Refresh your Google Sheet. You will see a new menu: "🕵️ DETECTRIX DISPATCHER".
 * 6. Click "🕵️ DETECTRIX DISPATCHER" -> "✉️ Send All Login Credentials".
 * 7. When prompted, grant Google Mail permissions.
 * =========================================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🕵️ DETECTRIX DISPATCHER")
    .addItem("🧪 Test Send (First Student Only)", "sendTestCredentialEmail")
    .addSeparator()
    .addItem("✉️ Send All Login Credentials", "sendAllStudentCredentials")
    .addToUi();
}

/**
 * Send test email to the first eligible student in the sheet
 */
function sendTestCredentialEmail() {
  processEmails(true);
}

/**
 * Send credentials to all pending students in the sheet
 */
function sendAllStudentCredentials() {
  processEmails(false);
}

function processEmails(isTestMode) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    SpreadsheetApp.getUi().alert("⚠️ Sheet contains no student data rows.");
    return;
  }

  const rawHeaders = data[0];
  const headers = rawHeaders.map(h => String(h).toLowerCase().trim().replace(/[^a-z0-9]/g, ""));

  const findCol = (...keys) => headers.findIndex(h => keys.some(k => h === k || h.includes(k)));

  const emailCol = findCol("email", "emailid", "studentemail", "leaderemail");
  const regNoCol = findCol("registernumber", "regno", "rollno", "leaderreg");
  const nameCol = findCol("studentname", "leadername", "name", "fullname");
  const teamCol = findCol("teamname", "team");
  const teamIdCol = findCol("teamid", "id");
  const passCol = findCol("password", "pass", "pin");
  const urlCol = findCol("loginurl", "url", "portalurl");
  let statusCol = findCol("emailstatus", "status");

  if (emailCol === -1 || passCol === -1) {
    SpreadsheetApp.getUi().alert("❌ Required columns missing. Sheet must contain at least 'Email ID' and 'Password' columns.");
    return;
  }

  // If status column doesn't exist, create it in the next column
  if (statusCol === -1) {
    statusCol = rawHeaders.length;
    sheet.getRange(1, statusCol + 1).setValue("Email Status");
  }

  const rowsToProcess = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = String(row[emailCol] || "").trim();
    const status = String(row[statusCol] || "").toUpperCase();

    if (email && email.includes("@") && !status.startsWith("SENT")) {
      rowsToProcess.push({
        rowIndex: i + 1,
        email: email,
        regNo: regNoCol !== -1 ? String(row[regNoCol] || "").trim() : "—",
        name: nameCol !== -1 ? String(row[nameCol] || "").trim() : "Investigator",
        team: teamCol !== -1 ? String(row[teamCol] || "").trim() : "Assigned Squad",
        teamId: teamIdCol !== -1 ? String(row[teamIdCol] || "").trim() : "DTX",
        password: String(row[passCol] || "").trim(),
        loginUrl: urlCol !== -1 && row[urlCol] ? String(row[urlCol]).trim() : "http://localhost:3000/enter",
      });
      if (isTestMode) break;
    }
  }

  if (rowsToProcess.length === 0) {
    SpreadsheetApp.getUi().alert("✅ All students have already been sent credentials! No pending rows found.");
    return;
  }

  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    isTestMode ? "🧪 Test Dispatch Confirmation" : "✉️ Batch Dispatch Confirmation",
    `Ready to send credentials email to ${rowsToProcess.length} student(s)?\n\nDaily Remaining Quota: ${MailApp.getRemainingDailyEmails()} emails.`,
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) {
    return;
  }

  let sentCount = 0;
  let failCount = 0;

  rowsToProcess.forEach((item) => {
    try {
      const subject = `🕵️ DETECTRIX 2026: Case File Station Login Credentials [Team ${item.team}]`;
      const htmlBody = generateDetectiveEmailHtml(item);

      MailApp.sendEmail({
        to: item.email,
        subject: subject,
        htmlBody: htmlBody,
        name: "Detectrix Case Bureau",
      });

      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      sheet.getRange(item.rowIndex, statusCol + 1).setValue(`SENT (${timestamp})`);
      sentCount++;
    } catch (err) {
      sheet.getRange(item.rowIndex, statusCol + 1).setValue(`FAILED: ${err.message}`);
      failCount++;
    }
  });

  ui.alert(
    "🎉 Dispatch Complete!",
    `Successfully dispatched: ${sentCount} email(s)\nFailed: ${failCount}\nRemaining quota today: ${MailApp.getRemainingDailyEmails()}`,
    ui.ButtonSet.OK
  );
}

/**
 * Generate responsive, branded Detective detective HTML email
 */
function generateDetectiveEmailHtml(student) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DETECTRIX 2026 Investigator Credentials</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #e8dcc8; font-family: 'Courier New', Courier, monospace; color: #1c140d;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #fcf7ee; border: 3px solid #1c140d; border-radius: 6px; box-shadow: 6px 6px 0px #1c140d; overflow: hidden;">
    <!-- HEADER -->
    <tr>
      <td style="background-color: #8b1e1e; padding: 24px 20px; text-align: center; border-bottom: 3px solid #1c140d;">
        <h1 style="margin: 0; color: #fcf7ee; font-size: 26px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">
          DETECTRIX 2026
        </h1>
        <p style="margin: 6px 0 0 0; color: #f4c430; font-size: 13px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">
          ★ OFFICIAL CASE FILE STATION ACCESS PASS ★
        </p>
      </td>
    </tr>

    <!-- CONTENT BODY -->
    <tr>
      <td style="padding: 30px 24px;">
        <p style="font-size: 15px; margin: 0 0 16px 0; font-weight: bold;">
          ATTENTION: Investigator ${student.name},
        </p>
        <p style="font-size: 13px; line-height: 1.6; margin: 0 0 20px 0; color: #33261a;">
          Your squad has been officially registered for the <strong>DETECTRIX Mystery Box Digital Case Investigation</strong>. Use the secure credentials below to access your team case dossier and submit investigation answers.
        </p>

        <!-- CREDENTIALS DOSSIER CARD -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f4ebd9; border: 2px dashed #8b1e1e; border-radius: 4px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 18px 20px;">
              <table width="100%" border="0" cellpadding="4" cellspacing="0" style="font-size: 13px;">
                <tr>
                  <td width="40%" style="font-weight: bold; color: #8b1e1e;">ASSIGNED SQUAD:</td>
                  <td width="60%" style="font-weight: bold; color: #1c140d;">${student.team} (${student.teamId})</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; color: #8b1e1e;">ROLL / REGISTER NO:</td>
                  <td style="font-weight: bold; color: #1c140d;">${student.regNo}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; color: #8b1e1e;">REGISTERED EMAIL:</td>
                  <td style="color: #1c140d;">${student.email}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; color: #8b1e1e;">CASE ACCESS PASSWORD:</td>
                  <td style="font-weight: 900; font-size: 16px; color: #8b1e1e; letter-spacing: 1px;">${student.password}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ACTION BUTTON -->
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${student.loginUrl}" target="_blank" style="background-color: #8b1e1e; color: #fcf7ee; padding: 14px 28px; text-decoration: none; font-weight: 900; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; border: 2px solid #1c140d; border-radius: 4px; display: inline-block; box-shadow: 4px 4px 0px #1c140d;">
            OPEN CASE FILE PORTAL →
          </a>
        </div>

        <p style="font-size: 12px; color: #665240; text-align: center; margin: 0 0 20px 0;">
          Direct Access URL: <a href="${student.loginUrl}" style="color: #8b1e1e; text-decoration: underline;">${student.loginUrl}</a>
        </p>

        <!-- INSTRUCTIONS -->
        <div style="background-color: #ece0cd; padding: 14px 16px; border-left: 4px solid #8b1e1e; border-radius: 2px; font-size: 12px; line-height: 1.5; color: #3d2f21;">
          <strong>INVESTIGATION PROTOCOL:</strong><br>
          1. Navigate to the portal link above.<br>
          2. Enter your <strong>Roll Number</strong> (or Email) and <strong>Password</strong>.<br>
          3. Inspect the crime scene evidence, decipher the 10 questions, and submit your code before the station countdown ends.
        </div>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background-color: #241911; padding: 16px 20px; text-align: center; border-top: 2px solid #1c140d;">
        <p style="margin: 0; color: #d4c5b3; font-size: 11px; letter-spacing: 1px;">
          DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING · DETECTRIX 2026
        </p>
        <p style="margin: 4px 0 0 0; color: #a39281; font-size: 10px;">
          DO NOT SHARE YOUR PASSWORD. YOUR CREDENTIALS ARE CONFIDENTIAL TO YOUR SQUAD.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
