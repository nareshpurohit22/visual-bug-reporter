let mediaRecorder;
let recordedChunks = [];
let consoleLogs = [];

// 1. Enhanced Log Capturer (Tracks File and Line Numbers)
const captureLog = (type, args) => {
    const stack = new Error().stack.split('\n')[2] || "";
    const location = stack.includes('at ') ? stack.split('at ')[1] : "Unknown Location";
    
    consoleLogs.push({
        type: type.toUpperCase(),
        message: args.join(' '),
        location: location.trim(), // Tells you WHICH line/file the bug is on
        time: new Date().toLocaleTimeString()
    });
    updatePreview();
};

console.log = (...args) => { captureLog('log', args); };
console.error = (...args) => { captureLog('error', args); };

function updatePreview() {
    const report = {
        title: document.getElementById('bugTitle').value || "Technical Bug Report",
        severity: document.getElementById('severity').value,
        browser: navigator.userAgent,
        logs: consoleLogs
    };
    document.getElementById('jsonPreview').innerText = JSON.stringify(report, null, 2);
}

// 2. Recording & Download Logic
document.getElementById('startBtn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            document.getElementById('downloadBtn').disabled = false;
        };
        mediaRecorder.start();
        document.getElementById('startBtn').innerText = "Recording...";
    } catch (err) { console.error("Media Error: " + err); }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const reportText = document.getElementById('jsonPreview').innerText;
    
    // Download JSON
    const jsonBlob = new Blob([reportText], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.download = 'detailed-bug-report.json';
    jsonLink.href = URL.createObjectURL(jsonBlob);
    jsonLink.click();

    // Download Video
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoLink = document.createElement('a');
    videoLink.download = 'bug-video.webm';
    videoLink.href = URL.createObjectURL(videoBlob);
    videoLink.click();
});
