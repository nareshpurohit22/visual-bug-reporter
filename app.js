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
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bug-report-video.webm';
    a.click();
});

