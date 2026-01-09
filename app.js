const startBtn = document.getElementById('startBtn');
const saveBtn = document.getElementById('saveBtn');
const jsonPreview = document.getElementById('jsonPreview');
const statusIndicator = document.getElementById('statusIndicator');

let capturedLogs = [];
let screenshotData = null;
let generatedReport = null;

// Console Hook
(function() {
    const logGrabber = (type, args) => {
        capturedLogs.push({ type, message: args.join(' '), time: new Date().toLocaleTimeString() });
    };
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => { logGrabber('log', args); originalLog.apply(console, args); };
    console.error = (...args) => { logGrabber('error', args); originalError.apply(console, args); };
})();

async function recordBug() {
    try {
        capturedLogs = [];
        // Request screen
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        // Take Screenshot immediately
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        screenshotData = canvas.toDataURL('image/png');

        // Setup Video Recording
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            downloadFile(videoBlob, 'bug-video.webm');
            generateReport();
            statusIndicator.innerText = "Captured! Ready to download.";
            saveBtn.disabled = false;
            startBtn.disabled = false;
        };

        mediaRecorder.start();
        startBtn.disabled = true;
        statusIndicator.innerText = "Recording (10s)... Screenshot saved!";
        setTimeout(() => { if (mediaRecorder.state === "recording") mediaRecorder.stop(); }, 10000);

    } catch (err) {
        statusIndicator.innerText = "Error: " + err.message;
    }
}

function generateReport() {
    generatedReport = {
        title: document.getElementById('bugTitle').value || "Untitled Bug",
        severity: document.getElementById('severity').value,
        steps: document.getElementById('steps').value.split('\n'),
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent,
        logs: capturedLogs
    };
    jsonPreview.textContent = JSON.stringify(generatedReport, null, 4);
}

function downloadFile(content, fileName) {
    const url = content instanceof Blob ? URL.createObjectURL(content) : 
                'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content, null, 4));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
}

startBtn.addEventListener('click', recordBug);
saveBtn.addEventListener('click', () => {
    downloadFile(generatedReport, 'report.json');
    const link = document.createElement("a");
    link.href = screenshotData;
    link.download = 'screenshot.png';
    link.click();
});