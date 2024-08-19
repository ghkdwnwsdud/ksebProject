import React, { useState, useEffect, useRef } from "react";
import Papa from 'papaparse';  // PapaParse를 가져옵니다
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

const videoFps = 30;

const formatTime = (frame) => {
  const totalSeconds = Math.floor(frame / videoFps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const SERVER_URL = "https://5318-34-125-51-4.ngrok-free.app";

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

const TeamPlayerInfo = ({ teamName }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/team_player_stats.csv');

        const text = await response.text();  // response.body 대신 text() 사용

        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const teamPlayers = results.data.filter(player => player.팀명.toUpperCase() === teamName.toUpperCase());
            setPlayers(teamPlayers);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Failed to fetch players:", error);
        setLoading(false);
      }
    };

    if (teamName) {  // 팀 이름이 유효할 때만 fetch 실행
      fetchPlayers();
    }
  }, [teamName]);  // teamName이 변경될 때마다 실행

  if (loading) {
    return <div>선수 정보 로딩중...</div>;
  }

  return (
    <div class="scroll" style={{ flex: 1, overflowX: 'hidden', maxHeight: '300px' }}>
      <h3 class="white-text centered-title">{teamName} 선수 정보</h3> 
      <div className="team-info-container">
      <table className="team-info-table">
        <thead>
          <tr>
            <th>선수명</th>
            <th>AVG</th>
            <th>Games</th>
            <th>PA</th>
            <th>AB</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={index}>
              <td>{player.선수명}</td>
              <td>{player.AVG}</td>
              <td>{player.G}</td>
              <td>{player.PA}</td>
              <td>{player.AB}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const KboRankings = () => {
  const [rankings, setRankings] = useState([]);
  const [filteredRankings, setFilteredRankings] = useState([]);
  const [currentDate, setCurrentDate] = useState('2024-08-17');
  const [selectedTeam, setSelectedTeam] = useState(null); // 선택된 팀 상태

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/kbo_rankings_2024.csv');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      const result = await reader.read();
      const csvData = decoder.decode(result.value);

      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          setRankings(results.data);
        },
      });
    };

    fetchData();
  }, []);

  const formatDateToMatchCSV = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  useEffect(() => {
    const formattedDate = formatDateToMatchCSV(currentDate);
    const filtered = rankings.filter(
      (ranking) => ranking.date === formattedDate
    );
    setFilteredRankings(filtered);
  }, [rankings, currentDate]);

  const handlePrevDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setCurrentDate(prevDay.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay.toISOString().split('T')[0]);
  };

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
  };

  return (
    <div>
       <h3 style={{ textAlign: 'center', color: '#FFFFFF' }}>KBO Rankings 2024</h3>
      <div class ="centered-title">
        <button onClick={handlePrevDay}>{'<'}</button>
        <span class="white-text">{currentDate}</span>
        <button onClick={handleNextDay}>{'>'}</button>
      </div>
      <table className="kbo-ranking-container">
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
          </tr>
          </thead>
        <tbody>
          {filteredRankings.length > 0 ? (
            filteredRankings.map((ranking, index) => (
              <tr key={index} onClick={() => handleTeamClick(ranking.team)}>
                <td>{ranking.rank}</td>
                <td style={{ cursor: 'pointer' }}>{ranking.team}</td>
                <td>{ranking.games}</td>
                <td>{ranking.win}</td>
                <td>{ranking.lose}</td>
                <td>{ranking.draw}</td>
                <td>{ranking.win_rate}</td>
                <td>{ranking.game_behind}</td>
                <td>{ranking.recent_10}</td>
                <td>{ranking.streak}</td>
                
              </tr>
            ))
          ) : (
            <tr>
              <td class="white-text" colSpan="12">데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>

      </table>


    </div>
  );
};

const TeamDetails = ({ selectedTeam }) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!selectedTeam) return;

    const fetchPlayerData = async () => {
      try {
        const response = await fetch('/team_player_stats.csv');
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const result = await reader.read();
        const csvData = decoder.decode(result.value);

        Papa.parse(csvData, {
          header: false, // CSV 파일에 헤더가 없음을 설정
          skipEmptyLines: true,
          complete: function (results) {
            const teamPlayers = results.data.filter(
              (player) => player[0].trim() === selectedTeam.trim()  // 팀명으로 필터링
            );
            setPlayers(teamPlayers);
          },
        });
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };

    fetchPlayerData();
  }, [selectedTeam]);

  if (!selectedTeam) {
    return <div class="white-text">팀을 선택해주세요.</div>;
  }

  return (
    <div>
      <h3 class="white-text">{selectedTeam} 선수 정보</h3>
      {players.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>AVG</th>
              <th>G</th>
              <th>PA</th>
              <th>AB</th>
              <th>R</th>
              <th>H</th>
              <th>2B</th>
              <th>3B</th>
              <th>HR</th>
              <th>TB</th>
              <th>RBI</th>
              <th>SAC</th>
              <th>SF</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={index}>
                <td>{player[1]}</td> {/* Rank */}
                <td>{player[2]}</td> {/* Player */}
                <td>{player[3]}</td> {/* AVG */}
                <td>{player[4]}</td> {/* G */}
                <td>{player[5]}</td> {/* PA */}
                <td>{player[6]}</td> {/* AB */}
                <td>{player[7]}</td> {/* R */}
                <td>{player[8]}</td> {/* H */}
                <td>{player[9]}</td> {/* 2B */}
                <td>{player[10]}</td> {/* 3B */}
                <td>{player[11]}</td> {/* HR */}
                <td>{player[12]}</td> {/* TB */}
                <td>{player[13]}</td> {/* RBI */}
                <td>{player[14]}</td> {/* SAC */}
                <td>{player[15]}</td> {/* SF */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>선수 정보가 없습니다.</div>
      )}
    </div>
  );
};

// 첫 번째 페이지 스타일 적용 부분
const FirstPage = ({ onSubmitUrl, youtubeUrl, setYoutubeUrl }) => {
  return (
    <Box className="first-page-container">
      <Box className="first-page-content">
        <img src={process.env.PUBLIC_URL + "/image.png"} alt="logo" className="first-page-logo" />
        <Typography variant="h4" className="first-page-title">
          오늘은 해설왕
        </Typography>
        <Typography variant="h6" className="first-page-subtitle">
          야구 영상 보는 것 힘드신가요? 저희 오늘의 해설왕을 이용해보세요
        </Typography>
        <Box className="url-input-container">
          <TextField
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            variant="outlined"
            fullWidth
            placeholder="URL을 입력해주세요"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmitUrl}
            style={{ marginLeft: "10px" }}
          >
            SUBMIT
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// 두 번째 페이지 스타일 적용 부분
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
        <div className = "dark-overlay">
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
                <div style={{ display: 'flex', overflowX: 'auto'}}>
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

const Layout = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [logs, setLogs] = useState([]); 
  const [videoFps, setVideoFps] = useState(30); 
  const [currentTime, setCurrentTime] = useState(0); 
  const [currentLog, setCurrentLog] = useState([]); 
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [team1, setTeam1] = useState(""); // 첫 번째 팀 상태 추가
  const [team2, setTeam2] = useState(""); // 두 번째 팀 상태 추가

  const fetchVideoTitle = async (videoId) => {
    const API_KEY = 'AIzaSyDB8Azf7gOs1wti330R4pCBohb35UqwIHo';
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