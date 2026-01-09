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
    const reportData = JSON.parse(document.getElementById('jsonPreview').innerText);
    
    // 1. Create a Professional PNG Report
    const canvas = document.getElementById('reportCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Design the PNG (Dark Theme)
    ctx.fillStyle = "#1e1e1e"; // Background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#4ec9b0"; // Title Color
    ctx.font = "bold 24px Courier New";
    ctx.fillText("SNAPBUG VISUAL REPORT", 40, 60);

    ctx.fillStyle = "#d4d4d4"; // Text Color
    ctx.font = "16px Courier New";
    ctx.fillText(`Title: ${reportData.title || 'N/A'}`, 40, 110);
    ctx.fillText(`Severity: ${reportData.severity || 'N/A'}`, 40, 140);
    
    ctx.fillStyle = "#f44747"; // Error Log Color
    ctx.fillText("Technical Logs:", 40, 190);
    
    let yOffset = 220;
    reportData.logs.forEach(log => {
        ctx.fillText(`[${log.time}] ${log.message}`, 40, yOffset);
        yOffset += 25;
    });

    // Download PNG
    const pngLink = document.createElement('a');
    pngLink.download = 'technical-snapshot.png';
    pngLink.href = canvas.toDataURL("image/png");
    pngLink.click();
// 2. Download the Video
    if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoLink = document.createElement('a');
        videoLink.download = 'bug-video.webm';
        videoLink.href = URL.createObjectURL(videoBlob);
        videoLink.click();
    }

    // 3. Download the JSON Report (The Technical Bug Data)
    const reportText = document.getElementById('jsonPreview').innerText;
    const jsonBlob = new Blob([reportText], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.download = 'technical-bug-report.json';
    jsonLink.href = URL.createObjectURL(jsonBlob);
    jsonLink.click();
}); // This closing bracket must be the very last thing in your script
