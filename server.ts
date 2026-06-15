import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Predict Student Exam Readiness Score and analyze study gaps/metrics
app.post("/api/predict-readiness", async (req, res) => {
  try {
    const {
      targetExam = "Unscheduled Exam",
      targetScore = 100,
      examDate = "",
      subjects = [],
      tasks = [],
      studyLogs = [],
      quizzes = [],
    } = req.body;

    // First, let's calculate a baseline mathematical score to ensure deterministic stability.
    // This is incredibly important when there are few data points or when key is missing,
    // and guides the AI's predictions so it matches user's true learning state.
    const totalSubjects = subjects.length || 0;
    const totalTasks = tasks.length || 0;
    const completedTasks = tasks.filter((t: any) => t.completed).length || 0;
    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    const totalStudyMinutes = studyLogs.reduce((acc: number, log: any) => acc + (Number(log.durationMinutes) || 0), 0);
    const totalStudyHours = totalStudyMinutes / 60;
    const averageFocusScore = studyLogs.length > 0 
      ? studyLogs.reduce((acc: number, log: any) => acc + (Number(log.focusScore) || 5), 0) / studyLogs.length 
      : 0;

    const quizScores = quizzes.map((q: any) => Number(q.score) || 0);
    const averageQuizScore = quizScores.length > 0
      ? quizScores.reduce((acc: number, s: number) => acc + s, 0) / quizScores.length
      : 0;

    // Calculation Weighting:
    // - Quizzes: 45% weight (proves mastery)
    // - Math Study Hours (Normalized against a standard target of 120 hours total for exams): 25% weight
    // - Task Completion: 20% weight (milestones reached)
    // - Focus/Difficulty consistency: 10% weight
    const quizComponent = quizScores.length > 0 ? (averageQuizScore / 100) * 45 : 0;
    const hoursTarget = totalSubjects > 0 ? totalSubjects * 30 : 50; // roughly 30 hours target per subject
    const hoursRatio = Math.min(totalStudyHours / hoursTarget, 1);
    const hoursComponent = hoursRatio * 25;
    const taskComponent = taskCompletionRate * 20;
    const focusRatio = averageFocusScore > 0 ? averageFocusScore / 5 : 0;
    const consistencyComponent = focusRatio * 10;

    let computedScoreValue = quizComponent + hoursComponent + taskComponent + consistencyComponent;
    
    // Absolute Zero-Data Cold Start rule: "Every new account starts completely empty (0 study hours, 0 XP, 0 subjects, 0 tasks)."
    // If subjects, tasks, and study logs are all zero, score is exactly 0.
    if (totalSubjects === 0 && totalTasks === 0 && studyLogs.length === 0 && quizzes.length === 0) {
      computedScoreValue = 0;
    } else {
      computedScoreValue = Math.min(Math.max(Math.round(computedScoreValue), 0), 100);
    }

    const getRiskLevel = (score: number) => {
      if (score === 0 && totalSubjects === 0) return "onboarding"; // custom flow for brand new
      if (score < 30) return "critical"; // 0-29 Critical
      if (score < 45) return "caution";  // 30-44 High Risk
      if (score < 60) return "warning";  // 45-59 Behind Schedule
      if (score < 75) return "slightly_behind"; // 60-74 Slightly Behind
      if (score < 90) return "on_track"; // 75-89 On Track
      return "ready"; // 90-100 Exam Ready with shimmer
    };

    const riskLevel = getRiskLevel(computedScoreValue);

    // Let's inspect the Gemini API Key
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim() !== "") {
      try {
        console.log("Using Gemini API for high-fidelity readiness analysis...");
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        // Construct high fidelity context
        const studentProfileText = `
Student Information:
Target Exam: ${targetExam}
Target Exam Date: ${examDate}
Target Score Target: ${targetScore}

Learning Assets & Status:
- Total Subjects Registered: ${totalSubjects} (${subjects.map((s: any) => `${s.name} (target: ${s.targetScore})`).join(", ")})
- Total Tasks/To-Dos Created: ${totalTasks}
- Completed Tasks: ${completedTasks} (Completion Rate: ${(taskCompletionRate * 100).toFixed(1)}%)
- Total Logged Study Hours: ${totalStudyHours.toFixed(1)} hours (across ${studyLogs.length} sessions)
- Average Studiousness Focus Rating: ${averageFocusScore.toFixed(1)}/5
- Total Practice Quizzes Logged: ${quizzes.length}
- Average Diagnostic Quiz Score: ${averageQuizScore.toFixed(1)}%

Our deterministic diagnostic math calculated a baseline Readiness rating of: ${computedScoreValue}/100.
Rule Risk categories:
- 0-29: critical
- 30-44: caution
- 45-59: warning
- 60-74: slightly_behind
- 75-89: on_track
- 90-100: ready
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: "Analyze the student's preparation state and return the readiness report.",
          config: {
            systemInstruction: `You are Atodemic's main AI Readiness engine. Your job is to calculate an highly precise Readiness Score between 0 and 100 reflecting the student's true preparation levels toward their target exam, mapping to one of the strict status keys: 'critical','caution','warning','slightly_behind','on_track','ready'.
Absolute Zero-Data Cold Start rule: If things are empty (0 core subjects, 0 hours), you MUST output exactly 0 for readinessScore, and output highly contextual onboarding recommendations.
Analyze quantitative trends like mock grades, task completion speed, hours left until exam, and consistency. Output exactly a JSON block matching the responseSchema. Keep suggestions actionable, premium, and concise. Do not use markdown markup inside the JSON text values.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                readinessScore: { type: Type.INTEGER, description: "Highly precise score based on analysis, between 0 and 100" },
                riskLevel: { type: Type.STRING, description: "Must match one of: critical, caution, warning, slightly_behind, on_track, ready" },
                gaps: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Specific academic, tactical, or timing vulnerabilities spotted" 
                },
                recommendations: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Direct action steps to elevate the score" 
                },
                subjectScores: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subjectName: { type: Type.STRING },
                      estimatedReadyScore: { type: Type.INTEGER }
                    }
                  }
                }
              },
              required: ["readinessScore", "riskLevel", "gaps", "recommendations"]
            },
            temperature: 0.2
          }
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsedResult = JSON.parse(textOutput.trim());
          return res.json({
            ...parsedResult,
            calculatedAt: new Date().toISOString(),
            isAiPowered: true,
          });
        }
      } catch (gemError) {
        console.error("Gemini API computation failed, using high-precision math engine logic:", gemError);
      }
    }

    // Mathematical Engine / Key Missing Fallback
    // Lets yield deterministic high quality gaps and recommendations if offline or key is missing
    const gaps: string[] = [];
    const recommendations: string[] = [];

    if (totalSubjects === 0) {
      gaps.push("No academic study subjects have been configured yet.");
      recommendations.push("Define your academic subject disciplines in the sidebar grid to unlock tracking.");
    } else {
      if (totalStudyHours === 0) {
        gaps.push("No active study sessions logged for registered subjects.");
        recommendations.push("Log your first active study block using the Timer to record hours and focus stats.");
      }
      if (quizzes.length === 0) {
        gaps.push("No mock quizzes or practice questions recorded.");
        recommendations.push("Record a practice quiz score to prove core concept mastery and feed test metrics.");
      } else if (averageQuizScore < targetScore) {
        gaps.push(`Average quiz accuracy (${averageQuizScore.toFixed(0)}%) is currently trailing behind your target score (${targetScore}%).`);
        recommendations.push("Target weaker quiz topics specifically for deep study before taking another math quiz.");
      }
      if (totalTasks > 0 && taskCompletionRate < 0.5) {
        gaps.push(`Action plan task backlog is building up. Completion rate is at ${(taskCompletionRate * 100).toFixed(0)}%.`);
        recommendations.push("Focus on checking off high priority milestoned tasks to clear backlog.");
      }
    }

    if (gaps.length === 0) {
      gaps.push("We are currently gathering baseline performance patterns. Continue studying to reveal advanced gaps.");
      recommendations.push("Maximize score calculations by adding upcoming milestone exams and mock scores.");
    }

    // Build default subject breakdown
    const subjectScores = subjects.map((s: any) => {
      // rough breakdown for this subject
      const subLogs = studyLogs.filter((l: any) => l.subjectId === s.id);
      const subQuizzes = quizzes.filter((q: any) => q.subjectId === s.id);
      const subQuizzesAvg = subQuizzes.length > 0 ? subQuizzes.reduce((acc, q) => acc + q.score, 0) / subQuizzes.length : 0;
      let score = subLogs.length > 0 ? 55 : 30;
      if (subQuizzes.length > 0) score = Math.round(subQuizzesAvg);
      return {
        subjectName: s.name,
        estimatedReadyScore: Math.min(Math.max(score, 0), 100)
      };
    });

    res.json({
      readinessScore: computedScoreValue,
      riskLevel: riskLevel,
      gaps,
      recommendations,
      subjectScores,
      calculatedAt: new Date().toISOString(),
      isAiPowered: false,
    });

  } catch (error) {
    console.error("Predict endpoint error:", error);
    res.status(500).json({ error: "Internal Server Error in readiness engine" });
  }
});

// Configure Vite dynamic serving of assets & views
async function startup() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Atodemic Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startup();
