# glso0215_project_7

## 일렉트릭스팟 (ElectricSpot)

전기 자동차의 충전소 위치를 알려주는 웹 페이지 **‘일렉트릭스팟’** 프로젝트입니다.

<br>

### 프로젝트 주제 설명

- **주제**  
  전기 자동차의 충전소 위치를 알려주는 웹 페이지 ‘일렉트릭스팟’

- **배경**  
  전기 자동차의 상용화 및 사용량 증가로 인해, 전기차 충전소의 위치를 알려주는 시스템의 필요성이 증가하고 있습니다.  
  전기차 산업이 확장되기 위해서는 충전 인프라의 구축이 필수이며, 단순히 충전소를 많이 설치하는 것이 아니라,<br>
  설치된 충전소의 위치를 알려주는 프로그램도 인프라의 일부라고 생각합니다.<br>
  ‘일렉트릭스팟’은 그 인프라의 일환으로써 기능할 수 있습니다.

  <br>

### 개발 툴

- **공공 데이터 활용**
  - 한국전력공사_전기차 충전소 설치현황 [데이터 링크 바로가기](https://www.data.go.kr/data/15101407/openapi.do)

- **카카오맵 API 활용**
  - 카카오맵 Web API 서비스 [카카오맵 API 바로가기](https://apis.map.kakao.com/web/)

- **웹 페이지 개발 프레임워크**
  - Django [링크 바로가기](https://www.djangoproject.com/)
    
    Python 기반의 웹 프레임워크로, 접근성이 좋고 구조가 명확하여 웹 개발을 쉽고 빠르게 시작할 수 있다는 장점이 있습니다.  
    또한, 강력한 관리 도구(admin), ORM, 보안 기능 등 다양한 내장 기능을 제공해 웹 서비스 개발에 적합합니다.

<br>

### 기대 효과

- 전기차 충전소의 위치 정보를 효율적으로 제공하여 사용자 편의성을 향상
- 전기차 산업 인프라 확장에 기여

<br>

### 실행 방법

```
> pip install -r downloads.txt
> python manage.py migrate
> python manage.py runserver [포트번호(선택사항)]
```

<br>

명령어 실행 후 아래와 같은 메시지가 출력됩니다. **(포트/IP 주소 지정 여부에 따라 서버 주소는 달라질 수 있습니다.)**

`Starting development server at http://127.0.0.1:8000/`

<br>

위에 표시된 서버 주소로 접속 시 로컬에서 프로젝트를 확인할 수 있습니다.

<br>

### 기본 목표

- **사용자의 현재 위치를 기준으로 주변 전기차 충전소 조회**
- 임의의 충전소 선택시 해당 충전소 세부 정보 출력
- 현재 위치와 가장 가까운 충전소의 최단 경로 출력

<br>

### 추가 목표

- **조회된 각 충전소와 사용자의 현재 위치별 거리 계산**
- 충전소 조회 필터링 기능
- 사용자별 즐겨찾기 기능

<br>

### 참여 인원

| [<img src="https://github.com/BandoSouth.png" width="100px">](https://github.com/BandoSouth) | [<img src="https://github.com/wkddnjswns.png" width="100px">](https://github.com/wkddnjswns) | [<img src="https://github.com/sdk0124.png" width="100px">](https://github.com/sdk0124) |
| :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: |
|                         [손희철](https://github.com/BandoSouth)                          |                         [장원준](https://github.com/Kiyeon-Nam)                          |                         [김성덕](https://github.com/sdk0124)

<br>

### 컨트리뷰트 관련 참고 문서

[CONTRIBUTING.md](https://github.com/sdk0124/glso0215_project_7/blob/main/CONTRIBUTING.md) 파일을 참고해주세요.
