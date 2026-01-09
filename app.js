let mediaRecorder;
let recordedChunks = [];
let consoleLogs = [];

// Capture Console Errors & Logs
const originalError = console.error;
console.error = (...args) => {
    consoleLogs.push({ type: 'ERROR', message: args.join(' '), time: new Date().toLocaleTimeString() });
    originalError.apply(console, args);
    updatePreview();
};

document.getElementById('startBtn').addEventListener('click', async () => {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        alert("Security Error: Recording only works on HTTPS links!");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            document.getElementById('status').innerText = "Assets Ready!";
            document.getElementById('downloadBtn').disabled = false;
            generateReport();
        };

        mediaRecorder.start();
        document.getElementById('status').innerText = "Recording...";
        
        // Auto-stop after 8 seconds
        setTimeout(() => { if(mediaRecorder.state !== "inactive") mediaRecorder.stop(); }, 8000);

    } catch (err) {
        console.error("User cancelled or permission denied: " + err);
    }
});

function updatePreview() {
    document.getElementById('jsonPreview').innerText = JSON.stringify({ logs: consoleLogs }, null, 2);
}

function generateReport() {
    const report = {
        title: document.getElementById('bugTitle').value || "Unnamed Bug",
        severity: document.getElementById('severity').value,
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent,
        logs: consoleLogs
    };
    document.getElementById('jsonPreview').innerText = JSON.stringify(report, null, 2);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bug-video.webm';
    a.click();
});
