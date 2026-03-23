require('dotenv').config();
const Groq = require('groq-sdk');
const { ACCURACY_REPORT_SYSTEM_PROMPT, INSIGHT_SUMMARY_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateAccuracyReport(processedClaims) {
  if (!processedClaims || processedClaims.length === 0) {
    return {
      total_claims: 0,
      true: 0,
      false: 0,
      partial: 0,
      not_verifiable: 0,
      confidence: 0,
      risk_level: "LOW"
    };
  }

  // Format claims for the LLM
  let claimsStr = '';
  processedClaims.forEach((c, idx) => {
    // Expected to have confidenceScore 0.0-1.0 from verificationEngine JS, translating to 0-100 for LLM prompt
    const conf = c.confidenceScore !== undefined ? Math.round(c.confidenceScore * 100) : 0;
    claimsStr += `Claim [${idx + 1}]:\n- Verdict: ${c.verdict}\n- Confidence Score: ${conf}\n\n`;
  });

  const userPrompt = `Generate the accuracy report using the following verified claims data:\n\n${claimsStr}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      messages: [
        { role: 'system', content: ACCURACY_REPORT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (err) {
    console.error("Error generating granular accuracy report with LLM:", err.message);
    // Fallback logic closely matching original in case API fails
    const total = processedClaims.length;
    const trueCount = processedClaims.filter(c => c.verdict === 'True').length;
    const partialCount = processedClaims.filter(c => c.verdict === 'Partially True').length;
    const falseCount = processedClaims.filter(c => c.verdict === 'False').length;
    const unverifiableCount = processedClaims.filter(c => c.verdict === 'Unverifiable').length;

    let avgConf = 0;
    processedClaims.forEach(c => avgConf += (c.confidenceScore || 0));
    avgConf = (avgConf / total) * 100;

    let riskLevel = 'HIGH';
    if (falseCount > total / 2) riskLevel = 'HIGH';
    else if (partialCount > 0) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
      total_claims: total,
      true: trueCount,
      false: falseCount,
      partial: partialCount,
      not_verifiable: unverifiableCount,
      confidence: Math.round(avgConf),
      risk_level: riskLevel
    };
  }
}

async function generateInsightSummary(reportData) {
  if (!reportData || reportData.total_claims === 0) {
    return 'No claims were processed to generate insights.';
  }

  const userPrompt = `Input:
Total Claims: ${reportData.total_claims}
True: ${reportData.true}
False: ${reportData.false}
Partial: ${reportData.partial}
Confidence: ${reportData.confidence}
Risk: ${reportData.risk_level}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      messages: [
        { role: 'system', content: INSIGHT_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    });
    return response.choices[0]?.message?.content?.trim() || 'Summary could not be generated.';
  } catch (err) {
    console.error("Error generating insight summary:", err.message);
    return 'Summary temporarily unavailable due to processing delay.';
  }
}

module.exports = { generateAccuracyReport, generateInsightSummary };
