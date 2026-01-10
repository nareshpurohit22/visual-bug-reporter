import React, { useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import html2canvas from 'html2canvas';

// Styled using a centralized object to keep the code clean and professional
const styles = {
  container: { padding: '40px', backgroundColor: '#0a0a0c', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: '#e0e0e0' },
  header: { color: '#00f2fe', textShadow: '0 0 10px rgba(0,242,254,0.3)', marginBottom: '30px' },
  editorWrapper: { background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '15px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '25px' },
  reportCard: { background: '#16161a', borderRadius: '16px', padding: '25px', borderLeft: '5px solid #4facfe', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  reportTitle: { color: '#4facfe', marginTop: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' },
  reportContent: { whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1rem', fontFamily: 'monospace' },
  button: { marginTop: '25px', padding: '12px 28px', background: 'linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }
};

export default function App() {
  const [report, setReport] = useState("SYSTEM READY: Awaiting code input for deep scan...");
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef(null);

  const handleCodeAnalysis = (value) => {
    if (!value || value.length < 10) return;

    // Clear previous timeout to "debounce" (prevents calling AI on every single keystroke)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setReport("🔍 SCANNING ARCHITECTURE... ANALYZING LOGIC PATHS...");

      try {
        const API_KEY = process.env.REACT_APP_AI_KEY;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: `Act as a Senior QA Engineer. Analyze this code: "${value}". 
                If no bugs found, say "✅ STATUS: CLEAN. No logical or syntax flaws detected."
                If bugs found, use this EXACT format:
                🚨 BUG TYPE: [Critical / Warning / Optimization]
                📂 CATEGORY: [Logic / Syntax / Security / Performance]
                📝 DESCRIPTION: [One sentence explanation]
                💡 PROPOSED FIX: [One sentence fix]` 
              }] 
            }]
          })
        });

        const data = await response.json();

        if (data.error) {
          setReport(`❌ API ERROR: ${data.error.message}\nCheck your .env file and restart terminal.`);
        } else {
          const aiFeedback = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from auditor.";
          setReport(aiFeedback);
        }
      } catch (error) {
        setReport("❌ NETWORK ERROR: Ensure your API key is valid and you are online.");
      } finally {
        setIsLoading(false);
      }
    }, 1200); // 1.2 second delay to ensure user finished typing
  };

  const captureReport = () => {
    const element = document.getElementById('report-area');
    html2canvas(element, { backgroundColor: '#0a0a0c', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Audit_Report_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>BugScout AI Auditor</h1>
      
      <div id="report-area">
        <div style={styles.editorWrapper}>
          <Editor 
            height="45vh" 
            theme="vs-dark" 
            defaultLanguage="javascript" 
            defaultValue="// Paste your code here for a professional audit..."
            onChange={handleCodeAnalysis} 
            options={{ fontSize: 14, minimap: { enabled: false }, roundedSelection: true }}
          />
        </div>

        <div style={styles.reportCard}>
          <h3 style={styles.reportTitle}>Audit Feedback:</h3>
          <div style={{
            ...styles.reportContent,
            color: report.includes('🚨') || report.includes('❌') ? '#ff4b2b' : '#00ff87'
          }}>
            {isLoading ? "🔄 PROCESSING THROUGH GEMINI 1.5 FLASH..." : report}
          </div>
        </div>
      </div>

      <button 
        style={styles.button} 
        onClick={captureReport}
        onMouseOver={(e) => e.target.style.opacity = '0.8'}
        onMouseOut={(e) => e.target.style.opacity = '1'}
      >
        Download Visual Audit Report
      </button>
    </div>
  );
}
