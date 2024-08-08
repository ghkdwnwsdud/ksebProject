import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  TextField,
  Button,
  Paper,
  Box,
} from "@mui/material";
import "../styles.css"; // CSS 파일을 import

const SERVER_URL = "https://a1c8-34-85-164-122.ngrok-free.app";

const VideoStream = ({
  youtubeUrl,
  logs,
  videoFps,
  setCurrentTime,
  currentTime, // 현재 시간을 props로 받음
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
      const currentTime = player.getCurrentTime();

      if (
        event.data === window.YT.PlayerState.PLAYING ||
        event.data === window.YT.PlayerState.SEEKING
      ) {
        const logInterval = setInterval(() => {
          const newTime = player.getCurrentTime();
          setCurrentTime(newTime);  // currentTime 업데이트
        }, 1000 / videoFps);
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
      let closestLog = null;
      let closestFrameDifference = Number.MAX_SAFE_INTEGER;

      logs.forEach((log) => {
        const logFrame = log[0];
        const frameDifference = Math.abs(logFrame - currentFrame);

        if (frameDifference < closestFrameDifference) {
          closestLog = log;
          closestFrameDifference = frameDifference;
        }
      });

      setCurrentLog(closestLog);
    }
  }, [logs, currentTime]); // logs나 currentTime이 변경될 때마다 실행

  return (
    <div>
      <div id="youtube-player" style={{ width: "100%", height: "auto" }}></div>
    </div>
  );
};

const Layout = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [logs, setLogs] = useState([]); // 모델 분석 로그 상태 추가
  const [videoFps, setVideoFps] = useState(30); // FPS 상태 추가
  const [currentTime, setCurrentTime] = useState(0); // 현재 재생 시간 상태 추가
  const [currentLog, setCurrentLog] = useState(null); // 현재 동기화된 로그 상태 추가
  const [rankings, setRankings] = useState([]); // KBO 팀 순위 상태 추가
  const [date, setDate] = useState(""); // 날짜 상태 추가
  const [team1, setTeam1] = useState(""); // 첫 번째 팀 상태 추가
  const [team2, setTeam2] = useState(""); // 두 번째 팀 상태 추가
  const [team1Players, setTeam1Players] = useState([]); // 첫 번째 팀 선수 정보 상태 추가
  const [team2Players, setTeam2Players] = useState([]); // 두 번째 팀 선수 정보 상태 추가

  const submitUrl = async () => {
    if (!youtubeUrl) {
      alert("Please enter a valid YouTube URL.");
      return;
    }

    try {
      setIsVideoLoaded(true);

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
      setLogs(data.results);
      setVideoFps(data.fps || 30);
      console.log("Fetched logs:", data.results); // 콘솔에 출력
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

  useEffect(() => {
    fetch("http://localhost:5000/api/kbo-rank")
      .then((response) => response.json())
      .then((data) => {
        setRankings(data.data);
        setDate(data.date);
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to fetch KBO rankings");
      });
  }, []);

  const formatTime = (frame) => {
    const totalSeconds = Math.floor(frame / videoFps);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Box
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "white",
      }}
    >
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <div className="header">
            <div className="header-logo"></div>
            <Typography variant="h4" className="header-title">
              오늘은 해설왕
            </Typography>
          </div>
          <Button color="inherit" href="https://github.com/your-repo-link">
            GitHub
          </Button>
        </Toolbar>
      </AppBar>
      <Container>
        <Grid container spacing={3} sx={{ marginTop: 2 }}>
          <Grid item xs={12} sm={8}>
            {isVideoLoaded ? (
              <VideoStream
                youtubeUrl={youtubeUrl}
                logs={logs}
                videoFps={videoFps}
                setCurrentTime={setCurrentTime}
                currentTime={currentTime}
                setCurrentLog={setCurrentLog}
              />
            ) : (
              <Paper className="video-container">
                <Typography variant="h6" className="text-gray">
                  URL을 입력해주세요
                </Typography>
              </Paper>
            )}
            <Paper className="log-container">
              <Typography variant="h6" style={{ padding: 20 }}>
                실시간 경기 해설 출력창
              </Typography>
              <Box
                p={2}
                id="log"
                className="text-small text-gray"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                {currentLog ? (
                  <Typography variant="body2">
                    {formatTime(currentLog[0])} Model Result:{" "}
                    {currentLog[2] === 1 ? "Positive" : "Negative"}
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    분석된 결과가 없습니다.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <div className="url-input-container">
              <div className="link-label">link</div>
              <div className="link-input">Enter the link here</div>
              <div className="link-divider">|</div>
              <TextField
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { color: "white" }, // 텍스트 필드의 텍스트 색상 변경
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={submitUrl}
                style={{ marginLeft: "10px" }}
              >
                Submit
              </Button>
            </div>
            <Paper className="kbo-ranking-container">
              <Typography variant="h6" style={{ padding: 20 }}>
                KBO 팀 순위표 ({date})
              </Typography>
              <Box p={2} className="ranking-content">
                <table>
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>팀명</th>
                      <th>경기</th>
                      <th>승</th>
                      <th>패</th>
                      <th>무</th>
                      <th>승률</th>
                      <th>게임차</th>
                      <th>최근10경기</th>
                      <th>연속</th>
                      <th>홈</th>
                      <th>방문</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((ranking, index) => (
                      <tr key={index}>
                        <td>{ranking.rank}</td>
                        <td>{ranking.team}</td>
                        <td>{ranking.games}</td>
                        <td>{ranking.win}</td>
                        <td>{ranking.lose}</td>
                        <td>{ranking.draw}</td>
                        <td>{ranking.win_rate}</td>
                        <td>{ranking.game_behind}</td>
                        <td>{ranking.recent_10}</td>
                        <td>{ranking.streak}</td>
                        <td>{ranking.home}</td>
                        <td>{ranking.away}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
            <Paper className="summary-container">
              <Typography variant="h6" style={{ padding: 20 }}>
                {team1} 선수 정보
              </Typography>
              <Box p={2}>
                {team1Players.map((player, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {`${player.선수명} - AVG: ${player.AVG}, G: ${player.G}, PA: ${player.PA}, AB: ${player.AB}`}
                  </Typography>
                ))}
              </Box>
            </Paper>
            <Paper className="summary-container">
              <Typography variant="h6" style={{ padding: 20 }}>
                {team2} 선수 정보
              </Typography>
              <Box p={2}>
                {team2Players.map((player, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {`${player.선수명} - AVG: ${player.AVG}, G: ${player.G}, PA: ${player.PA}, AB: ${player.AB}`}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Layout;
