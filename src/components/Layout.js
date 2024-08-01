import React, { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, Container, Grid, TextField, Button, Paper, Box } from '@mui/material';
import '../style.css'; // CSS 파일을 import

const VideoStream = ({ youtubeUrl, startTime }) => {
    const videoRef = useRef(null);
    const logRef = useRef(null);

    useEffect(() => {
        if (youtubeUrl) {
            const ws = new WebSocket('ws://localhost:8765');
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                ws.send(JSON.stringify({ url: youtubeUrl }));
            };

            ws.onmessage = (event) => {
                const currentTime = Date.now();
                if (typeof event.data === 'string') {
                    console.log('Received log:', event.data); // 로그 출력
                    if (logRef.current) {
                        const elapsed = ((currentTime - startTime) / 1000).toFixed(2);
                        logRef.current.textContent += `${elapsed}s: LOG: ${event.data}\n`;
                        // 최신 10개의 로그만 유지
                        const logLines = logRef.current.textContent.split('\n').slice(-11).join('\n');
                        logRef.current.textContent = logLines;
                    }
                } else {
                    const blob = new Blob([event.data], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    if (videoRef.current) {
                        videoRef.current.src = url;
                    }
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };

            return () => {
                ws.close();
            };
        }
    }, [youtubeUrl, startTime]);

    return (
        <div>
            <img ref={videoRef} alt="Video Stream" style={{ width: '100%' }} />
            <pre ref={logRef} id="log" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></pre>
        </div>
    );
};

const Layout = () => {
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [logs, setLogs] = useState([]); // 상태 추가
    const [rankings, setRankings] = useState([]); // 상태 추가
    const [date, setDate] = useState(''); // 상태 추가
    const [team1, setTeam1] = useState(''); // 첫 번째 팀 상태 추가
    const [team2, setTeam2] = useState(''); // 두 번째 팀 상태 추가
    const [team1Players, setTeam1Players] = useState([]); // 첫 번째 팀 선수 정보 상태 추가
    const [team2Players, setTeam2Players] = useState([]); // 두 번째 팀 선수 정보 상태 추가
    const [startTime, setStartTime] = useState(null); // 시작 시간 상태 추가

    const submitUrl = () => {
        fetch('http://localhost:5000/set_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: youtubeUrl })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'URL set') {
                alert('URL set successfully');
                setIsVideoLoaded(true);
                setTeam1(data.team1); // 첫 번째 팀 설정
                setTeam2(data.team2); // 두 번째 팀 설정
                setStartTime(Date.now()); // 시작 시간 설정
                fetchPlayerStats(data.team1, data.team2); // 선수 정보 가져오기
            } else {
                console.error('Error:', data.error); // 에러 메시지 콘솔에 출력
                alert('Failed to set URL');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to set URL');
        });
    };

    const fetchPlayerStats = (team1, team2) => {
        fetch(`http://localhost:5000/api/player-stats?team1=${team1}&team2=${team2}`)
            .then(response => response.json())
            .then(data => {
                setTeam1Players(data[team1]);
                setTeam2Players(data[team2]);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch player stats');
            });
    };

    useEffect(() => {
        fetch('http://localhost:5000/api/kbo-rank')
            .then(response => response.json())
            .then(data => {
                setRankings(data.data);
                setDate(data.date);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch KBO rankings');
            });
    }, []);

    return (
        <Box style={{ width: '100%', height: '100%', position: 'relative', background: 'white' }}>
            <AppBar position="static" className="app-bar">
                <Toolbar>
                    <div className="header">
                        <div className="header-logo"></div>
                        <Typography variant="h4" className="header-title">
                            오늘은 해설왕
                        </Typography>
                    </div>
                    <Button color="inherit" href="https://github.com/your-repo-link">GitHub</Button>
                </Toolbar>
            </AppBar>
            <Container>
                <Grid container spacing={3} sx={{ marginTop: 2 }}>
                    <Grid item xs={12} sm={8}>
                        {isVideoLoaded ? (
                            <VideoStream youtubeUrl={youtubeUrl} startTime={startTime} />
                        ) : (
                            <Paper className="video-container">
                                <Typography variant="h6" className="text-gray">
                                    URL을 입력해주세요
                                </Typography>
                            </Paper>
                        )}
                        <Paper className="log-container">
                            <Typography variant="h6" style={{ padding: 20 }}>실시간 경기 해설 출력창</Typography>
                            <Box p={2} id="log" className="text-small text-gray" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {logs.map((log, index) => (
                                    <Typography key={index} variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                                        {log}
                                    </Typography>
                                ))}
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
                                    style: { color: 'white' }, // 텍스트 필드의 텍스트 색상 변경
                                }}
                            />
                            <Button variant="contained" color="primary" onClick={submitUrl} style={{ marginLeft: '10px' }}>
                                Submit
                            </Button>
                        </div>
                        <Paper className="kbo-ranking-container">
                            <Typography variant="h6" style={{ padding: 20 }}>KBO 팀 순위표 ({date})</Typography>
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
                            <Typography variant="h6" style={{ padding: 20 }}>{team1} 선수 정보</Typography>
                            <Box p={2}>
                                {team1Players.map((player, index) => (
                                    <Typography key={index} variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                                        {`${player.선수명} - AVG: ${player.AVG}, G: ${player.G}, PA: ${player.PA}, AB: ${player.AB}`}
                                    </Typography>
                                ))}
                            </Box>
                        </Paper>
                        <Paper className="summary-container">
                            <Typography variant="h6" style={{ padding: 20 }}>{team2} 선수 정보</Typography>
                            <Box p={2}>
                                {team2Players.map((player, index) => (
                                    <Typography key={index} variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
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
