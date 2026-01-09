let mediaRecorder;
let recordedChunks = [];
let consoleLogs = [];

// This intercepts your console logs to save them in the report
const originalError = console.error;
console.error = (...args) => {
    consoleLogs.push({ type: 'ERROR', message: args.join(' '), time: new Date().toLocaleTimeString() });
    originalError.apply(console, args);
    document.getElementById('jsonPreview').innerText = JSON.stringify({ logs: consoleLogs }, null, 2);
};

document.getElementById('startBtn').addEventListener('click', async () => {
    // Check for HTTPS - the button WILL NOT work on local C:/ files
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        alert("ERROR: Screen recording requires an HTTPS connection. Please use your GitHub link.");
        return;
    }

    try {
        // This line triggers the browser's recording popup
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            document.getElementById('status').innerText = "Report Ready!";
            document.getElementById('downloadBtn').disabled = false;
            
            // Finalize the JSON data
            const report = {
                title: document.getElementById('bugTitle').value,
                severity: document.getElementById('severity').value,
                browser: navigator.userAgent,
                logs: consoleLogs
            };
            document.getElementById('jsonPreview').innerText = JSON.stringify(report, null, 2);
        };

        mediaRecorder.start();
        document.getElementById('status').innerText = "Recording... (Stop sharing to finish)";

    } catch (err) {
        // This handles cases where the user clicks "Cancel" on the popup
        console.error("Recording failed or was cancelled: " + err);
    }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    // 1. Download the Video File
    if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        const videoLink = document.createElement('a');
        videoLink.href = videoUrl;
        videoLink.download = 'bug-video.webm';
        videoLink.click();
    }

    document.getElementById('downloadBtn').addEventListener('click', () => {
    const reportText = document.getElementById('jsonPreview').innerText;

    // 1. Convert JSON Text to PNG Image
    const canvas = document.getElementById('reportCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set image size
    canvas.width = 600;
    canvas.height = 800;
    
    // Draw Background
    ctx.fillStyle = "#2f3542";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Text
    ctx.fillStyle = "#7bed9f";
    ctx.font = "16px monospace";
    const lines = reportText.split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 40 + (i * 20));
    });

    // Download the PNG
    const pngUrl = canvas.toDataURL("image/png");
    const pngLink = document.createElement('a');
    pngLink.href = pngUrl;
    pngLink.download = 'bug-report-visual.png';
    pngLink.click();

    // 2. Also Download the Video
    if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        const videoLink = document.createElement('a');
        videoLink.href = videoUrl;
        videoLink.download = 'bug-video.webm';
        videoLink.click();
    }
});

    // 2. Download the JSON Report (The Error Bugs)
    
