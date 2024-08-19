import React, { useEffect, useRef } from "react";
import "../styles.css"; // CSS 파일을 import

const VideoStream = ({
    youtubeUrl,
    logs,
    videoFps,
    setCurrentTime,
    currentTime,
    setCurrentLog,
}) => {
    const playerRef = useRef(null);

    useEffect(() => {
        if (youtubeUrl) {
            const url = new URL(youtubeUrl);
            let videoId = null;

            if (url.hostname === "youtu.be") {
                videoId = url.pathname.slice(1);
            } else if (url.hostname.includes("youtube.com")) {
                const urlParams = new URLSearchParams(url.search);
                videoId = urlParams.get("v");
            }

            if (videoId) {
                window.onYouTubeIframeAPIReady = () => {
                    playerRef.current = new window.YT.Player("youtube-player", {
                        videoId: videoId,
                        events: {
                            onReady: onPlayerReady,
                            onStateChange: onPlayerStateChange,
                        },
                    });
                };

                if (!window.YT) {
                    const script = document.createElement("script");
                    script.src = "https://www.youtube.com/iframe_api";
                    document.body.appendChild(script);
                } else {
                    window.onYouTubeIframeAPIReady();
                }
            }
        }
    }, [youtubeUrl]);

    const onPlayerReady = (event) => {
        event.target.playVideo();
    };

    const onPlayerStateChange = (event) => {
        const player = event.target;

        if (player && typeof player.getCurrentTime === "function") {
            const updateCurrentTime = () => {
                const currentTime = player.getCurrentTime();
                setCurrentTime(currentTime);
            };

            if (event.data === window.YT.PlayerState.PLAYING) {
                updateCurrentTime(); // 재생 시작 시 즉시 호출
                const logInterval = setInterval(updateCurrentTime, 1000 / videoFps);
                playerRef.current.logInterval = logInterval;
            } else if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.ENDED
            ) {
                clearInterval(playerRef.current.logInterval);
            }
        } else {
            console.error(
                "The player object is not valid or does not have a getCurrentTime method."
            );
        }
    };

    // logs나 currentTime이 변경될 때마다 currentLog를 업데이트
    useEffect(() => {
        if (logs && logs.length > 0 && currentTime != null) {
            const currentFrame = Math.floor(currentTime * videoFps);
            const filteredLogs = logs
                .filter((log) => log.frame <= currentFrame)
                .sort((a, b) => {
                    if (a.frame === b.frame) {
                        return a.type.localeCompare(b.type); // type A, B 순서로 정렬
                    }
                    return a.frame - b.frame;
                })
                .slice(-4); // 최신 4개의 로그만 유지

            setCurrentLog(filteredLogs);
        }
    });

    return (
        <div style={{ width: "100%", height: "0", paddingBottom: "56.25%", position: "relative" }}>
            <div
                id="youtube-player"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
            ></div>
        </div>
    );
};
export default VideoStream;