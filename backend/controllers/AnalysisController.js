const OpenAI = require("openai");
const statEngine = require("../services/statEngine");
const NewsService = require("../services/NewsService");

const llmClient = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio"
});

// =======================
// SYSTEM PROMPTS
// =======================

const PLANNER_PROMPT = `
You are an autonomous data analysis planner.

STRICT RULES:
- Output the JSON object ONLY. No explanations, no markdown, no <think> blocks.
- Output MUST start with { and end with }
- No trailing commas
- external_ticker MUST be a Yahoo Finance symbol (e.g. "CL=F" for oil, "AAPL" for Apple, "BTC-USD" for Bitcoin, "^GSPC" for S&P 500, "TSLA" for Tesla)

FORMAT:
{
  "intent": "",
  "analysis_type": "statistical | ml | hybrid",
  "data_requirements": {
    "dataset_fields_needed": [],
    "filters": {},
    "aggregations": []
  },
  "external_ticker": "^GSPC",
  "target_variable": "price_data",
  "feature_candidates": ["sentiment_scores"],
  "mcp_tasks": ["statistics", "regression"]
}
`;

const INTERPRETER_PROMPT = `
You are a top-tier financial data analyst. Answer concisely in 3-5 sentences.
Your task is to answer the user's specific question using the provided statistical results.

STRICT RULES:
1. Start your response with a direct answer to the user's question.
2. Cite specific numbers from the data (correlation values, R² score, price ranges).
3. Do NOT output <think> blocks or markdown. Plain text only.
4. If data is insufficient, state the limitation clearly.
`;

// =======================
// KEYWORD-BASED FALLBACK PLANNER
// (used when LM Studio is offline or too slow)
// =======================

const TICKER_MAP = {
  "oil": "CL=F", "crude": "CL=F", "pétrole": "CL=F", "petrol": "CL=F",
  "bitcoin": "BTC-USD", "btc": "BTC-USD", "crypto": "BTC-USD",
  "ethereum": "ETH-USD", "eth": "ETH-USD",
  "gold": "GC=F", "or": "GC=F",
  "apple": "AAPL", "aapl": "AAPL",
  "tesla": "TSLA", "tsla": "TSLA",
  "amazon": "AMZN", "google": "GOOGL", "microsoft": "MSFT",
  "s&p": "^GSPC", "sp500": "^GSPC", "nasdaq": "^IXIC",
  "dow jones": "^DJI", "dow": "^DJI",
  "natural gas": "NG=F", "gaz naturel": "NG=F",
  "silver": "SI=F", "argent": "SI=F",
  "iran": "CL=F", "russia": "CL=F", "ukraine": "CL=F",
};

function buildFallbackPlan(question) {
    const q = question.toLowerCase();
    let ticker = "^GSPC";

    for (const [keyword, symbol] of Object.entries(TICKER_MAP)) {
        if (q.includes(keyword)) {
            ticker = symbol;
            break;
        }
    }

    return {
        intent: `Analyze relationship between financial news sentiment and ${ticker}`,
        analysis_type: "hybrid",
        data_requirements: { dataset_fields_needed: [], filters: {}, aggregations: [] },
        external_ticker: ticker,
        target_variable: "price_data",
        feature_candidates: ["sentiment_scores"],
        mcp_tasks: ["statistics", "regression"]
    };
}

function buildFallbackExplanation(question, mcpResults) {
    const stats = mcpResults?.statistics;
    const models = mcpResults?.models;

    let corr = null;
    if (stats?.correlations?.pearson?.sentiment_scores) {
        const vals = stats.correlations.pearson.sentiment_scores;
        const priceKey = Object.keys(vals).find(k => k.includes("price") && k !== "sentiment_scores");
        if (priceKey) corr = vals[priceKey];
    }

    let explanation = `Based on statistical analysis of ${mcpResults?.summary || "the dataset"}: `;

    if (corr !== null) {
        const direction = corr > 0 ? "positive" : "negative";
        const strength = Math.abs(corr) > 0.5 ? "strong" : Math.abs(corr) > 0.25 ? "moderate" : "weak";
        explanation += `A **${strength} ${direction} correlation** of **${corr.toFixed(3)}** was detected between news sentiment and market price. `;
    } else {
        explanation += `No significant direct correlation was found between sentiment and price in the current dataset. `;
    }

    if (models?.performance?.r2 !== undefined) {
        explanation += `The predictive model (${models.model || "Random Forest"}) achieved an **R² of ${(models.performance.r2 * 100).toFixed(1)}%** — `;
        explanation += models.performance.r2 > 0.5
            ? `indicating sentiment is a **meaningful predictor**.`
            : `suggesting **additional market factors** beyond news sentiment drive price movements.`;
    }

    const insights = mcpResults?.insights || [];
    if (insights.length > 0) explanation += ` Key findings: ${insights.join(" | ")}`;

    return explanation;
}

// =======================
// HELPERS
// =======================

function validatePlan(plan) {
    if (!plan) return false;
    if (!plan.analysis_type) return false;
    if (!Array.isArray(plan.mcp_tasks)) return false;
    return true;
}

function stripThinkBlocks(text) {
    // Remove DeepSeek-R1 style <think>...</think> reasoning blocks
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
        )
    ]);
};

// =======================
// MAIN CONTROLLER
// =======================

const analyzeData = async (req, res) => {
    try {
        const { question, datasetId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: "Question is required." });
        }

        // =======================
        // 1. PLANNER LLM (with keyword fallback)
        // =======================
        let plan = null;
        let usedFallbackPlanner = false;

        try {
            const plannerRes = await withTimeout(
                llmClient.chat.completions.create({
                    model: "deepseek/deepseek-r1-0528-qwen3-8b",
                    messages: [
                        { role: "system", content: PLANNER_PROMPT },
                        { role: "user", content: `Query: ${question}` }
                    ],
                    temperature: 0.1,
                    max_tokens: 300  // Cap to prevent 5-minute think blocks
                }),
                12000  // 12s timeout — if model is slow, use fallback
            );

            let raw = plannerRes.choices[0].message.content;
            raw = stripThinkBlocks(raw);  // Strip <think> from reasoning models
            raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                plan = JSON.parse(jsonMatch[0]);
            }
        } catch (llmErr) {
            console.warn(`[Planner] LLM failed (${llmErr.message}). Using keyword fallback.`);
            usedFallbackPlanner = true;
        }

        if (!plan || !validatePlan(plan)) {
            plan = buildFallbackPlan(question);
            usedFallbackPlanner = true;
        }

        // =======================
        // 2. DATA FETCH
        // =======================
        const dataset = await NewsService.getDatasetById(datasetId, {
            limit: 500,
            fields: plan.data_requirements?.dataset_fields_needed || []
        });

        if (!dataset || dataset.length === 0) {
            return res.status(200).json({
                question, plan,
                explanation: "No news data found in the database. Please sync news articles first.",
                results: null
            });
        }

        // =======================
        // 3. MCP CONFIG
        // =======================
        const mcpConfig = {
            target_column: plan.target_variable || "price_data",
            features: plan.feature_candidates?.length ? plan.feature_candidates : ["sentiment_scores"],
            tasks: plan.mcp_tasks?.length ? plan.mcp_tasks : ["statistics", "regression"],
            external_ticker: plan.external_ticker || "^GSPC",
            filters: plan.data_requirements?.filters || {},
            aggregations: plan.data_requirements?.aggregations || []
        };

        // =======================
        // 4. MCP EXECUTION
        // =======================
        const mcpResults = await withTimeout(
            statEngine.runStatisticalAnalysis(dataset, mcpConfig),
            50000  // 50s for Python + yfinance download
        );

        // =======================
        // 5. INTERPRETER LLM (with fallback)
        // =======================
        let explanation = "";

        try {
            const interpreterRes = await withTimeout(
                llmClient.chat.completions.create({
                    model: "deepseek/deepseek-r1-0528-qwen3-8b",
                    messages: [
                        { role: "system", content: INTERPRETER_PROMPT },
                        { role: "user", content: `User's Question: "${question}"\n\nData:\n${JSON.stringify(mcpResults).substring(0, 3000)}` }
                    ],
                    temperature: 0.3,
                    max_tokens: 400
                }),
                20000  // 20s for interpretation
            );
            explanation = stripThinkBlocks(interpreterRes.choices[0].message.content);
            if (!explanation) throw new Error("Empty response after stripping think blocks");
        } catch (interpErr) {
            console.warn(`[Interpreter] LLM failed (${interpErr.message}). Using data-driven fallback.`);
            explanation = buildFallbackExplanation(question, mcpResults);
        }

        // =======================
        // 6. FINAL RESPONSE
        // =======================
        return res.json({
            question,
            plan,
            explanation,
            results: mcpResults,
            meta: { usedFallbackPlanner, datapoints: dataset.length }
        });

    } catch (error) {
        console.error("[AnalysisController] Fatal:", error.message);
        return res.status(500).json({
            error: "AI pipeline failed",
            details: error.message
        });
    }
};

module.exports = { analyzeData };