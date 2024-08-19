import React, { useState, useEffect } from "react";
import FirstPage from "./FirstPage"; // FirstPage 컴포넌트 import
import SecondPage from "./SecondPage"; // SecondPage 컴포넌트 import
import "../styles.css"; // CSS 파일을 import

// 서버 URL을 .env 파일로부터 불러옴
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const Layout = () => {
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [logs, setLogs] = useState([]);
    const [videoFps, setVideoFps] = useState(30);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentLog, setCurrentLog] = useState([]);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [team1, setTeam1] = useState(""); // 첫 번째 팀 상태 추가
    const [team2, setTeam2] = useState(""); // 두 번째 팀 상태 추가

    const fetchVideoTitle = async (videoId) => {
        const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const title = data.items[0].snippet.title;
            extractTeams(title);
        } catch (error) {
            console.error("Error fetching video title:", error);
        }
    };
    const extractTeams = (title) => {
        const match = title.match(/(.+?) vs (.+)/i); // "VS"를 기준으로 분리
        if (match) {
            // 각 팀 이름을 정제하여 상태에 저장
            const team1Name = match[1].trim().toUpperCase();
            const team2Name = match[2].trim().toUpperCase();

            // 팀 이름을 정제하여 로고와 일치하는 이름만 사용
            const validTeams = ['KIA', 'LG', '삼성', '두산', 'SSG', 'KT', '롯데', 'NC', '한화', '키움'];
            const finalTeam1 = validTeams.find(team => team1Name.includes(team));
            const finalTeam2 = validTeams.find(team => team2Name.includes(team));

            if (finalTeam1 && finalTeam2) {
                setTeam1(finalTeam1);
                setTeam2(finalTeam2);
            }
        }
    };

    const submitUrl = async () => {
        if (!youtubeUrl) {
            alert("Please enter a valid YouTube URL.");
            return;
        }

        try {
            setIsVideoLoaded(true);
            setIsSubmitted(true);

            const formData = new FormData();
            formData.append("url", youtubeUrl);

            const response = await fetch(`${SERVER_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                fetchLogs();
            } else {
                throw new Error("Failed to upload video");
            }
        } catch (error) {
            alert("Failed to set URL");
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/results`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "69420",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // 데이터 구조 변환
            const transformedResults = data.results.map(item => ({
                type: item[0],
                frame: item[1],
                time: item[2],
                results: item[3],
            }));

            setLogs(transformedResults); // logs 데이터를 업데이트
            setVideoFps(data.fps || 30); // fps 값을 설정 (데이터에서 가져오거나 기본값 30)
            console.log("Fetched logs:", transformedResults); // 콘솔에 출력
            console.log("currentTime:", currentTime);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    useEffect(() => {
        const logInterval = setInterval(fetchLogs, 5000); // 5초마다 fetchLogs 호출
        return () => clearInterval(logInterval); // 컴포넌트 언마운트 시 인터벌 클리어
    }, []);

    useEffect(() => {
        fetchLogs(); // 컴포넌트가 마운트될 때 최초로 로그를 가져옵니다.
    }, []);

    const extractVideoId = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "youtu.be") {
                return urlObj.pathname.slice(1);
            } else if (urlObj.hostname.includes("youtube.com")) {
                const urlParams = new URLSearchParams(urlObj.search);
                return urlParams.get("v");
            }
        } catch (error) {
            console.error("Invalid URL:", error);
            return null;
        }
    };

    useEffect(() => {
        if (youtubeUrl) {
            const videoId = extractVideoId(youtubeUrl);
            if (videoId) fetchVideoTitle(videoId);
        }
    }, [youtubeUrl]);

    if (!isSubmitted) {
        return (
            <FirstPage
                onSubmitUrl={submitUrl}
                youtubeUrl={youtubeUrl}
                setYoutubeUrl={setYoutubeUrl}
            />
        );
    }

    return (
        <SecondPage
            youtubeUrl={youtubeUrl}
            logs={logs}
            videoFps={videoFps}
            setCurrentTime={setCurrentTime}
            currentTime={currentTime}
            currentLog={currentLog}
            setCurrentLog={setCurrentLog}
            team1={team1}
            team2={team2}
            isVideoLoaded={isVideoLoaded}
        />
    );
};

export default Layout;