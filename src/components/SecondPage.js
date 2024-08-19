import React from "react";
import { Box, AppBar, Toolbar, Typography, Button, Container, Grid, Paper } from "@mui/material";
import KboRankings from "./KboRankings"; // KboRankings 컴포넌트를 사용할 때 파일 경로 확인
import TeamPlayerInfo from "./TeamPlayerInfo"; // TeamPlayerInfo 컴포넌트를 사용할 때 파일 경로 확인
import VideoStream from "./VideoStream"; // VideoStream 컴포넌트를 사용할 때 파일 경로 확인
import "../styles.css"; // CSS 파일을 import

const videoFps = 30;

const formatTime = (frame) => {
    const totalSeconds = Math.floor(frame / videoFps);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
const SecondPage = ({
    youtubeUrl,
    logs,
    videoFps,
    setCurrentTime,
    currentTime,
    currentLog,  // currentLog를 props로 받도록 수정
    setCurrentLog,
    team1,
    team2,
    isVideoLoaded,
}) => {
    return (
        <Box className="main-container">
            <div className="main-container">
                <div className="overlay">
                    <div className="dark-overlay">
                        <Box className="content">
                            <AppBar position="static" className="app-bar1" sx={{ backgroundColor: '#000', boxShadow: 'none', padding: 0 }}>
                                <Toolbar>
                                    <div className="header">
                                        <div className="header-logo"></div>
                                        <Typography variant="h4" className="header-title">
                                            오늘은 해설왕
                                        </Typography>
                                    </div>
                                    <Button color="inherit" href="https://github.com/ghkdwnwsdud/ksebProject/tree/main">
                                        GitHub
                                    </Button>
                                </Toolbar>
                            </AppBar>
                            <Container>
                                <Grid container spacing={3} sx={{ marginTop: 2 }}>
                                    <Grid item xs={12} sm={8} md={8}>
                                        {isVideoLoaded ? (
                                            <VideoStream
                                                youtubeUrl={youtubeUrl}
                                                logs={logs}
                                                videoFps={videoFps}
                                                setCurrentTime={setCurrentTime}
                                                currentTime={currentTime}
                                                setCurrentLog={setCurrentLog}  // currentLog를 VideoStream에 전달
                                            />
                                        ) : (
                                            <Paper className="video-container">
                                            </Paper>
                                        )}
                                        <Paper className="log-container">
                                            <Box
                                                p={2}
                                                id="log"
                                                className="text-small text-gray"
                                                style={{ maxHeight: "400px", overflowY: "auto" }}
                                            >
                                                {currentLog && currentLog.length > 0 ? (
                                                    currentLog.map((log, index) => (
                                                        <Typography
                                                            key={index}
                                                            variant="body2"
                                                            style={{
                                                                color: log.type === "A" ? "black" : "#03793ec8",
                                                                marginTop: "0px",
                                                                marginBottom: "3px",
                                                                fontSize: '18px',
                                                                fontWeight: "bold",
                                                                lineHeight: "2"
                                                            }}
                                                        >
                                                            {log.results === "under process" ? (
                                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                                    <img
                                                                        src="/loading.gif" // 로딩 이미지 경로 지정
                                                                        alt="Loading"
                                                                        style={{ width: "20px", marginRight: "10px" }}
                                                                    />
                                                                    분석 진행중...
                                                                </div>
                                                            ) : (
                                                                `${formatTime(log.frame)}: ${log.results}`
                                                            )}
                                                        </Typography>
                                                    ))
                                                ) : (
                                                    <Typography variant="body2">
                                                        분석된 결과가 없습니다.
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4} md={4}>
                                        {/* KBO 순위와 선수 정보 표시 */}
                                        <KboRankings />
                                        <div style={{ display: 'flex', overflowX: 'auto' }}>
                                            <TeamPlayerInfo teamName={team1} />
                                            <TeamPlayerInfo teamName={team2} />
                                        </div>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Box>
                    </div>
                </div>
            </div>
        </Box>
    );
};

export default SecondPage;
