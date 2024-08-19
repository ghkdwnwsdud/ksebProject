import React from "react";
import { Box, Typography,TextField, Button} from "@mui/material";
import "../styles.css"; // CSS 파일을 import

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

export default FirstPage;