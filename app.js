let mediaRecorder;
let recordedChunks = [];
let consoleLogs = [];

// 1. Capture Console Errors & Logs
const originalError = console.error;
console.error = (...args) => {
    consoleLogs.push({ type: 'ERROR', message: args.join(' '), time: new Date().toLocaleTimeString() });
    originalError.apply(console, args);
    updatePreview();
};

function updatePreview() {
    const report = {
        title: document.getElementById('bugTitle').value || "Unnamed Bug",
        severity: document.getElementById('severity').value,
        browser: navigator.userAgent,
        logs: consoleLogs
    };
    document.getElementById('jsonPreview').innerText = JSON.stringify(report, null, 2);
}

// 2. Recording Logic
document.getElementById('startBtn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            document.getElementById('status').innerText = "Report Ready!";
            document.getElementById('downloadBtn').disabled = false;
            updatePreview();
        };

        mediaRecorder.start();
        document.getElementById('status').innerText = "Recording... (Stop sharing to finish)";
    } catch (err) {
        console.error("Recording failed: " + err);
    }
});

// 3. Triple Download Logic (Video, JSON, PNG)
document.getElementById('downloadBtn').addEventListener('click', () => {
    const reportText = document.getElementById('jsonPreview').innerText;
    const reportData = JSON.parse(reportText);

    // --- Part A: Create & Download PNG ---
    const canvas = document.getElementById('reportCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4ec9b0";
    ctx.font = "bold 24px monospace";
    ctx.fillText("SNAPBUG VISUAL REPORT", 40, 60);
    ctx.fillStyle = "#d4d4d4";
    ctx.font = "16px monospace";
    ctx.fillText(`Title: ${reportData.title}`, 40, 110);
    ctx.fillText(`Severity: ${reportData.severity}`, 40, 140);
    ctx.fillStyle = "#f44747";
    ctx.fillText("Technical Logs:", 40, 190);
    let y = 220;
    reportData.logs.slice(-10).forEach(log => {
        ctx.fillText(`[${log.time}] ${log.message}`, 40, y);
        y += 25;
    });
    const pngLink = document.createElement('a');
    pngLink.download = 'bug-snapshot.png';
    pngLink.href = canvas.toDataURL("image/png");
    pngLink.click();

    // --- Part B: Download JSON ---
    const jsonBlob = new Blob([reportText], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.download = 'technical-report.json';
    jsonLink.href = URL.createObjectURL(jsonBlob);
    jsonLink.click();

    // --- Part C: Download Video ---
    if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoLink = document.createElement('a');
        videoLink.download = 'bug-video.webm';
        videoLink.href = URL.createObjectURL(videoBlob);
        videoLink.click();
    }
});
