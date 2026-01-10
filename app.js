let mediaRecorder;
let recordedChunks = [];
let consoleLogs = [];

// 1. Capture Console Logs
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    consoleLogs.push({ type: 'LOG', message: args.join(' '), time: new Date().toLocaleTimeString() });
    originalLog.apply(console, args);
    updatePreview();
};

console.error = (...args) => {
    consoleLogs.push({ type: 'ERROR', message: args.join(' '), time: new Date().toLocaleTimeString() });
    originalError.apply(console, args);
    updatePreview();
};

function updatePreview() {
    const report = {
        title: document.getElementById('bugTitle').value || "Unnamed Bug",
        severity: document.getElementById('severity').value,
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
            document.getElementById('downloadBtn').disabled = false;
        };

        mediaRecorder.start();
        document.getElementById('startBtn').innerText = "Recording...";
    } catch (err) {
        console.error("Recording failed: " + err);
    }
});

// 3. Triple Download (PNG, Video, JSON)
document.getElementById('downloadBtn').addEventListener('click', () => {
    const reportData = JSON.parse(document.getElementById('jsonPreview').innerText);

    // --- A. Download PNG ---
    const canvas = document.getElementById('reportCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 500;
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4ec9b0";
    ctx.font = "20px monospace";
    ctx.fillText(`BUG REPORT: ${reportData.title}`, 40, 50);
    ctx.fillStyle = "#d4d4d4";
    let y = 100;
    reportData.logs.slice(-10).forEach(log => {
        ctx.fillText(`[${log.time}] ${log.message}`, 40, y);
        y += 30;
    });
    const pngLink = document.createElement('a');
    pngLink.download = 'bug-snapshot.png';
    pngLink.href = canvas.toDataURL("image/png");
    pngLink.click();

    // --- B. Download Video ---
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoLink = document.createElement('a');
    videoLink.download = 'bug-video.webm';
    videoLink.href = URL.createObjectURL(videoBlob);
    videoLink.click();

    // --- C. Download JSON ---
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.download = 'technical-data.json';
    jsonLink.href = URL.createObjectURL(jsonBlob);
    jsonLink.click();
});
