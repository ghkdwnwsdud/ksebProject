from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# 웹 드라이버 설정
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get('https://www.koreabaseball.com/Record/Player/HitterBasic/Basic1.aspx')

# 연도 선택 (예시: 2024)
year_select = Select(driver.find_element(By.ID, 'cphContents_cphContents_cphContents_ddlSeason_ddlSeason'))
year_select.select_by_value('2024')

# 팀 선택 및 데이터 크롤링
teams = ['KIA', 'LG', '삼성', '두산', 'SSG', 'NC', 'KT', '롯데', '한화', '키움']
team_data = []

for team in teams:
    # 팀 선택
    team_select = Select(driver.find_element(By.ID, 'cphContents_cphContents_cphContents_ddlTeam_ddlTeam'))
    team_select.select_by_visible_text(team)
    
    # 데이터 로드 대기
    time.sleep(2)  # 데이터가 로드되는 시간을 기다림

    # 데이터 크롤링
    table = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, 'cphContents_cphContents_cphContents_udpContent'))
    )
    rows = table.find_elements(By.TAG_NAME, 'tr')[1:]  # 첫 번째 행은 헤더이므로 제외

    for row in rows:
        columns = row.find_elements(By.TAG_NAME, 'td')
        # 모든 셀의 텍스트를 다시 가져오기
        player_data = [team] + [cell.text for cell in columns]
        team_data.append(player_data)

# 데이터프레임으로 변환 및 저장
columns = ['팀명', '순위', '선수명', '팀명2', 'AVG', 'G', 'PA', 'AB', 'R', 'H', '2B', '3B', 'HR', 'TB', 'RBI', 'SAC', 'SF']
df = pd.DataFrame(team_data, columns=columns)

# '팀명2' 컬럼 제거
df = df.drop(columns=['팀명2'])

# 데이터 저장
df.to_csv(r'D:\project_kseb\backend\team_player_stats.csv', index=False, encoding='utf-8-sig')

driver.quit()
