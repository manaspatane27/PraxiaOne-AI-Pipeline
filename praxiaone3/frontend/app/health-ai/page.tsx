"use client";

import { useEffect, useRef, useState, useCallback, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Stack,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha,
  Divider,
} from "@mui/material";
import {
  Send,
  AttachFile,
  Close,
  Psychology,
  AutoAwesome,
  MoreVert,
  VolumeUp,
} from "@mui/icons-material";
import { apiFetch } from "@/lib/api";
import { ThemeCtx } from "../providers";

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg = {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  sources?: string[];
  isStreaming?: boolean;
  results?: {
    deepseek?: string;
    med42?: string;
  };
};

type ChatResponse = {
  reply: string;
  results?: {
    deepseek?: string;
    med42?: string;
  };
  sources?: string[];
};

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function renderMarkdown(text: string, isDark: boolean = true): string {
  if (!text) return "";
  const cText = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)";
  const cHead = isDark ? "#93c5fd" : "#0284c7";
  const cSubHead = isDark ? "#60a5fa" : "#0369a1";
  const cBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
  const cBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const cCodeBg = isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)";
  const cCode = isDark ? "#86efac" : "#166534";
  const cInlineCode = isDark ? "#93c5fd" : "#0ea5e9";
  const cInlineBg = isDark ? "rgba(147,197,253,0.1)" : "rgba(2,132,199,0.06)";

  return text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre style="background: ${cCodeBg}; padding: 12px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; color: ${cCode}; border: 1px solid ${cBorder}; margin: 10px 0;"><code class="${lang}">${escHtml(code.trim())}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, `<code style="background: ${cInlineBg}; border: 1px solid ${cBorder}; border-radius: 4px; padding: 2px 4px; font-family: monospace; color: ${cInlineCode};">$1</code>`)
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="color: ${cSubHead}; font-weight: 800;">$1</strong>`)
    // Headings
    .replace(/^## (.+)$/gm, `<h2 style="font-size: 1.25rem; font-weight: 800; margin: 1rem 0 0.5rem; color: ${cHead}; border-bottom: 1px solid ${cBorder}; padding-bottom: 4px;">$1</h2>`)
    .replace(/^### (.+)$/gm, `<h3 style="font-size: 1rem; font-weight: 800; margin: 0.75rem 0 0.25rem; color: ${cSubHead};">$1</h3>`)
    // Lists
    .replace(/^[-*] (.+)$/gm, `<li style="margin-bottom: 4px; color: ${cText};">$1</li>`)
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="padding-left: 20px; margin: 0.5rem 0;">${m}</ul>`)
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_m, header, body) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = body.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      const th = headers.map((h: string) => `<th style="text-align: left; padding: 8px; background: ${cBg}; border-bottom: 2px solid ${cBorder}; color: ${cSubHead}; font-weight: 800;">${h}</th>`).join('');
      const tr = rows.map((r: string[]) =>
        `<tr>${r.map((c) => `<td style="padding: 8px; border-bottom: 1px solid ${cBorder}; color: ${cText};">${c}</td>`).join('')}</tr>`
      ).join('');
      return `<div style="overflow-x: auto; margin: 12px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 13px;"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener" style="color: ${cSubHead}; text-decoration: underline;">$1</a>`)
    // Newlines
    .replace(/\n/g, '<br />');
}

function escHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HealthAIPage() {
  const theme = useTheme();
  const { themeName } = useContext(ThemeCtx);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const [focusedDocId, setFocusedDocId] = useState<number | null>(null);
  const [focusedDocName, setFocusedDocName] = useState<string | null>(null);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch real history from backend
    const fetchHistory = async () => {
      try {
        const history = await apiFetch<any[]>("/health-chat/");
        if (history && history.length > 0) {
          const mapped = history.map(h => ({
            role: h.role,
            text: h.text,
            timestamp: new Date(h.created_at)
          }));
          setMessages(mapped);
        } else {
          // Fallback to greeting if empty
          setMessages([
            {
              role: "ai",
              text: "## Hello! I'm PraxiaOne's AI Assistant.\nI can help you analyze medical documents, interpret lab results, and provide personalized wellness insights based on your profile.\n\n**What would you like to discuss today?**",
              timestamp: new Date(),
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
        // Fallback
        setMessages([
          {
            role: "ai",
            text: "## Welcome back!\n(Chat history could not be loaded, but I'm ready to help).",
            timestamp: new Date(),
          }
        ]);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const playTTS = (text: string, index: number) => {
    if (speakingMsgIdx === index) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    setSpeakingMsgIdx(index);

    try {
      // 🎯 CLINICAL SUMMARY EXTRACTION (Single-Line DeepSeek focus)
      // Extract Case No. and Name if present
      const caseMatch = text.match(/## Case No\.\s*([\w\d\s\-\:]+)/i);
      const caseStr = caseMatch ? caseMatch[1].trim() : "";
      
      // Extract Diagnosis from tables or bullet points
      // Look for | Diagnosis | [Result] | or similar
      const diagMatch = text.match(/Diagnosis[:\s]+([\w\s,]+)/i);
      const diagStr = diagMatch ? diagMatch[1].trim().split("\n")[0] : "";
      
      // Build the single-line summary
      let summary = "";
      if (caseStr && diagStr) {
        summary = `Case details for ${caseStr}. The extracted diagnosis is ${diagStr}.`;
      } else if (caseStr) {
        summary = `Details for ${caseStr}. Review the parallel analysis for specific findings.`;
      } else {
        // Fallback: Take the first sentence or first 100 chars
        summary = text.split(".")[0].replace(/[#*|]/g, "").trim() + ".";
      }

      // Cleanup
      const cleanText = summary.slice(0, 300);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.name.includes("Google US English") || v.lang === "en-US");
      if (bestVoice) utterance.voice = bestVoice;
      
      utterance.onend = () => setSpeakingMsgIdx(null);
      utterance.onerror = () => setSpeakingMsgIdx(null);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Summary TTS failed", err);
      setSpeakingMsgIdx(null);
    }
  };

  const onSend = useCallback(async () => {
    if ((!input.trim() && !selectedFile) || sending) return;

    const userText = input.trim();
    const fileName = selectedFile?.name;
    const tempMessage = userText + (fileName ? `\n\n[Attached File: ${fileName}]` : "");

    // 1. Add User Message
    const userMsg: Msg = { role: "user", text: tempMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // 2. Handle File Upload if exists
    let contextHint = "";
    let uploadedDocId: number | null = null;
    if (selectedFile) {
      try {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("doc_type", "lab_result");
        fd.append("title", selectedFile.name);
        const docRes = await apiFetch<any>("/documents/", { method: "POST", body: fd });
        if (docRes && docRes.id) {
          uploadedDocId = docRes.id;
          setFocusedDocId(docRes.id);
          setFocusedDocName(selectedFile.name);
        }
        contextHint = `Analyzing document: ${selectedFile.name}...`;
        setSelectedFile(null);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    // 3. Get AI Response
    try {
      const res = await apiFetch<ChatResponse>("/health-chat/", {
        method: "POST",
        body: JSON.stringify({ 
          message: userText || `Analyze the uploaded document ${fileName || focusedDocName || "currently focused"}`,
          doc_id: uploadedDocId || focusedDocId 
        }),
      });

      setMessages(prev => [...prev, {
        role: "ai",
        text: res.reply,
        results: res.results,
        timestamp: new Date(),
        sources: res.sources,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "## Sorry, I encountered an error.\nPlease make sure **Ollama** is running locally (`ollama serve`).",
        timestamp: new Date(),
      }]);
    } finally {
      setSending(false);
    }
  }, [input, selectedFile, sending]);

  if (!mounted) return null;

  const isDark = themeName !== "light";

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", maxWidth: 1600, mx: "auto", position: "relative" }}>
      
      {/* Header Info */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
            <Psychology fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "white" : "text.primary", lineHeight: 1 }}>
              Health AI Chat
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Powered by Local LLM & RAG Engine
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 10, bgcolor: alpha(theme.palette.success.main, 0.1), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`, display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: theme.palette.success.main }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>AI Online</Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Window */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          mb: 2,
          display: "flex",
          flexDirection: "column",
          bgcolor: isDark ? alpha("#0b1220", 0.6) : "white",
          borderRadius: 4,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          overflow: "hidden",
        }}
      >
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 3 },
          }}
        >
          {messages.map((m, i) => (
            <Box key={i} sx={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: m.role === "user" ? "85%" : "100%", width: m.role === "user" ? "auto" : "100%" }}>
              <Stack direction={m.role === "user" ? "row-reverse" : "row"} spacing={1.5}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    bgcolor: m.role === "user" ? theme.palette.primary.main : theme.palette.secondary.main,
                    boxShadow: `0 0 10px ${alpha(m.role === "user" ? theme.palette.primary.main : theme.palette.secondary.main, 0.3)}`
                  }}
                >
                  {m.role === "user" ? "U" : <Psychology fontSize="small" />}
                </Avatar>
                <Box>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: m.role === "user" ? "20px 4px 20px 20px" : "4px 20px 20px 20px",
                      background: m.role === "user"
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        : isDark ? alpha("#1e293b", 0.8) : "#f1f5f9",
                      color: m.role === "user" ? "white" : "inherit",
                      boxShadow: m.role === "user" ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                      position: "relative",
                    }}
                  >
                    {m.role === "ai" && (
                      <IconButton
                        size="small"
                        onClick={() => playTTS(m.text, i)}
                        sx={{
                          position: "absolute",
                          right: -40,
                          top: 0,
                          color: speakingMsgIdx === i ? theme.palette.primary.main : "inherit",
                          animation: speakingMsgIdx === i ? "pulse 1.5s infinite" : "none",
                          "@keyframes pulse": {
                            "0%": { opacity: 0.5 },
                            "50%": { opacity: 1 },
                            "100%": { opacity: 0.5 },
                          }
                        }}
                      >
                        <VolumeUp fontSize="small" />
                      </IconButton>
                    )}
                    {m.results ? (
                      <Box sx={{ mt: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, width: "100%", overflowX: "auto" }}>
                        {/* DeepSeek */}
                        <Paper sx={{ flex: 1, minWidth: 300, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.15 : 0.4)}` }}>
                          <Typography variant="caption" sx={{ color: isDark ? theme.palette.primary.main : theme.palette.primary.dark, fontWeight: 900, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Psychology fontSize="inherit" /> DEEPSEEK-R1
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: "0.85rem", opacity: 0.9, color: isDark ? "inherit" : alpha("#000", 0.85) }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.results.deepseek || "", isDark) }} />
                        </Paper>

                        {/* Med42 */}
                        <Paper sx={{ flex: 1, minWidth: 300, p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), border: `1px solid ${alpha(theme.palette.secondary.main, isDark ? 0.15 : 0.4)}` }}>
                          <Typography variant="caption" sx={{ color: isDark ? theme.palette.secondary.light : theme.palette.secondary.dark, fontWeight: 900, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <AutoAwesome fontSize="inherit" /> MED42 AI
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: "0.85rem", opacity: 0.9, color: isDark ? "inherit" : alpha("#000", 0.85) }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.results.med42 || "", isDark) }} />
                        </Paper>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: 1.6,
                          "& ul": { m: 0, p: 0, pl: 2 },
                          "& p": { m: 0 }
                        }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text, isDark) }}
                      />
                    )}
                    
                    {m.sources && m.sources.length > 0 && (
                      <Box sx={{ mt: 1.5, pt: 1, borderTop: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.1)}` }}>
                        <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, display: "block", mb: 0.5 }}>
                          SOURCES USED:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {m.sources.map((s, si) => (
                            <Box key={si} sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: alpha(isDark ? "#ffffff" : "#000000", 0.1), fontSize: 10, fontWeight: 700, opacity: 0.8 }}>
                              📄 {s}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                  <Typography variant="caption" sx={{ mt: 0.5, display: "block", textAlign: m.role === "user" ? "right" : "left", opacity: 0.4 }}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
          {sending && (
            <Box sx={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 2, ml: 6 }}>
              <CircularProgress size={16} thickness={6} />
              <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.6 }}>AI is thinking...</Typography>
            </Box>
          )}
        </Box>

        {/* File Preview Bar */}
        {selectedFile && (
          <Box sx={{ px: 3, py: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <AttachFile fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight={700} color="primary.main">{selectedFile.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>({(selectedFile.size / 1024).toFixed(0)} KB)</Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedFile(null)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Input Controls */}
        <Box sx={{ p: 2, bgcolor: isDark ? alpha("#000000", 0.2) : alpha("#ffffff", 0.5), borderTop: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.05)}` }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Tooltip title="Attach Medical Document">
              <IconButton onClick={() => fileInputRef.current?.click()} color="primary" disabled={sending}>
                <AttachFile />
              </IconButton>
            </Tooltip>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
            />
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask anything about your health or uploaded reports..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSend())}
              disabled={sending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: isDark ? alpha("#fff", 0.03) : "#fff",
                  fontSize: 14,
                }
              }}
            />
            <IconButton
              disabled={sending || (!input.trim() && !selectedFile)}
              onClick={onSend}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: "white",
                "&:hover": { bgcolor: theme.palette.primary.dark },
                "&.Mui-disabled": { opacity: 0.3, bgcolor: theme.palette.primary.main, color: "white" },
                width: 48,
                height: 48,
                borderRadius: 3
              }}
            >
              <Send />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

      {/* Footer hint */}
      <Typography variant="caption" sx={{ textAlign: "center", display: "block", opacity: 0.4, mb: 2 }}>
        Medical insights are generated by AI. Always verify with your clinical records.
      </Typography>
    </Box>
  );
}
