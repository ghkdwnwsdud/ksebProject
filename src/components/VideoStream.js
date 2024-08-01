import React, { useEffect, useRef } from 'react';

const VideoStream = () => {
    const videoRef = useRef(null);
    const logRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8765');
        ws.binaryType = 'arraybuffer';

        ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                console.log('Received log:', event.data); // 로그 출력
                if (logRef.current) {
                    logRef.current.textContent += event.data + '\n';
                }
            } else {
                const blob = new Blob([event.data], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                if (videoRef.current) {
                    videoRef.current.src = url;
                }
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div>
            <img ref={videoRef} alt="Video Stream" style={{ width: '100%' }} />
            <pre ref={logRef} id="log" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></pre>
        </div>
    );
};

export default VideoStream;
