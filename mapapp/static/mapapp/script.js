// mapapp/static/mapapp/script.js

// 시도코드 변환용 객체 - 카카오맵 API에서 반환하는 시/도 이름(중요, 이름으로 가져옴)을 KEPCO의 metroCd로 변환
const KEPCO_METRO_CD_FROM_KAKAO_NAME = {
    "서울특별시": "11",
    "부산광역시": "21", // 카카오 region_1depth_name "부산광역시" -> KEPCO metroCd "21"
    "대구광역시": "22",
    "인천광역시": "23",
    "광주광역시": "24",
    "대전광역시": "25",
    "울산광역시": "26",
    "세종특별자치시": "29",
    "경기도": "31",
    "강원도": "32",       // 카카오가 "강원특별자치도"로 반환하면 키를 맞춰야 함
    "강원특별자치도": "32",
    "충청북도": "33",
    "충청남도": "34",
    "전라북도": "35",       // 카카오가 "전북특별자치도"로 반환하면 키를 맞춰야 함
    "전북특별자치도": "35",
    "전라남도": "36",
    "경상북도": "37",
    "경상남도": "38",
    "제주특별자치도": "39"
};


// 두 지점 간의 거리를 계산하는 함수 (기존과 동일)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

  /*
  지도와 충전소 정보를 로드하는 주 함수 부분(loadMapAndStations, fetchStations)

  구조 요약:
  해당 지역의 주소 각출, 이후 카카오맵 API를 통해 행정구역 코드로 변환
  카카오맵 API를 상부의 KEPCO_METRO_CD_FROM_KAKAO_NAME 객체를 통해 KEPCO metroCd로 변환 > views.py로 전달
  각 충전소의 주소를 받게 됨

  받은 충전소 주소를 다시 카카오맵 API를 호출하여 각 충전소별 lat, lon 초기화
  이를 기반으로 getDistance 함수를 사용하여 충전소와의 거리를 계산함
  */

function loadMapAndStations() {
  const listContainer = document.getElementById('list-container');
  listContainer.innerHTML = '현재 위치를 찾는 중...';

  navigator.geolocation.getCurrentPosition(function(position) {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    listContainer.innerHTML = '행정구역 코드 찾는 중 (카카오맵 API 호출)...';

    const geocoder = new kakao.maps.services.Geocoder();

    geocoder.coord2RegionCode(userLon, userLat, function(result, status) {
      if (status === kakao.maps.services.Status.OK) {
        console.log('카카오 coord2RegionCode 전체 결과:', result[0]);
    
        if (result.length > 0 && result[0].code) {
          const kakaoFullRegionCode = result[0].code;        // 예: "2711012400"
          const kakaoMetroName = result[0].region_1depth_name;  // 예: "대구광역시"
          // const kakaoSigunguName = result[0].region_2depth_name; // 예: "중구" (시군구 매핑이 가능해지면 사용)

          console.log('카카오가 알려준 시/도 이름:', kakaoMetroName);
          console.log('카카오가 알려준 전체 행정 코드:', kakaoFullRegionCode);

          // 1. KEPCO용 metroCd 변환 (카카오 시/도 이름을 KEPCO 코드로)
          const kepcoMetroCd = KEPCO_METRO_CD_FROM_KAKAO_NAME[kakaoMetroName];

          if (!kepcoMetroCd) {
            listContainer.innerHTML = `지원하지 않는 시/도 지역입니다: ${kakaoMetroName}`;
            console.error("KEPCO용 metroCd를 맵핑할 수 없습니다:", kakaoMetroName);
            return;
          }

          // 2. KEPCO용 cityCd 추출 (카카오 전체 코드의 3,4번째 자리)
          // 일단은 냅두겠으나...사용할지는 의문.
          let kepcoCityCd = ''; 
          if (kakaoFullRegionCode.length >= 4) {
             kepcoCityCd = kakaoFullRegionCode.substring(2, 4); 
          } else {
             console.warn("카카오 전체 행정 코드가 짧아서 cityCd를 추출할 수 없습니다:", kakaoFullRegionCode);
             // cityCd 없이 보내거나, KEPCO API가 cityCd 필수를 요구하지 않으면 괜찮음
             // (KEPCO EVcharge.do API는 cityCd가 선택사항임)
          }
          
          console.log('KEPCO로 보낼 최종 metroCd:', kepcoMetroCd); // 예: 대구 -> '22'
          console.log('KEPCO로 보낼 최종 cityCd:', kepcoCityCd);  // 예: '27110...' -> '11'
          
          // 추출된 코드로 충전소 정보 요청
          fetchStations(userLat, userLon, kepcoMetroCd, kepcoCityCd);

        } else {
          listContainer.innerHTML = '행정구역 코드를 찾을 수 없습니다. (카카오 API 응답 오류)';
          console.error('coord2RegionCode 결과에서 유효한 코드를 찾지 못했습니다.');
        }
      } else {
        listContainer.innerHTML = '행정구역 코드 변환에 실패했습니다. (카카오 API 호출 실패)';
        console.error('coord2RegionCode API 호출 실패:', status);
      }
    });

  }, function(error) { 
    console.error('navigator.geolocation 오류:', error.message);
    listContainer.innerHTML = `현재 위치를 가져올 수 없습니다. (${error.message})`;
  });
}


// 지정된 지역 코드로 충전소 정보를 서버에 요청하고 지도를 업데이트하는 함수
function fetchStations(currentLat, currentLon, metroCd, cityCd) {
    const listContainer = document.getElementById('list-container');
    listContainer.innerHTML = '충전소 정보 로딩 중...';

    let fetchUrl = `/stations/?metroCd=${metroCd}`;
    if (cityCd && cityCd.trim()) {
        fetchUrl += `&cityCd=${cityCd}`;
    }
    console.log('Django 서버에 요청할 URL:', fetchUrl);

    // 지도 초기화 (사용자 현재 위치 기준)
    const mapContainer = document.getElementById('map');
    const mapOption = {
        center: new kakao.maps.LatLng(currentLat, currentLon),
        level: 5
    };
    const map = new kakao.maps.Map(mapContainer, mapOption); // map 변수를 여기서 선언
    const zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

    // 사용자 현재 위치 마커
    new kakao.maps.Marker({
        position: new kakao.maps.LatLng(currentLat, currentLon),
        map: map
    });

    const stationMarkerImage = new kakao.maps.MarkerImage(
        '',
        new kakao.maps.Size(32, 32)
    );

    // 카카오 Geocoder 객체 (주소->좌표 변환용)
    const geocoderForStations = new kakao.maps.services.Geocoder();

    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("KEPCO API 응답 데이터:", data);
            const stationsFromKepco = data.data; 

            if (stationsFromKepco && stationsFromKepco.length > 0) {
                const geocodingPromises = stationsFromKepco.map(station => {
                    return new Promise((resolve) => {
                        const stationAddress = station.stnAddr; 
                        const stationName = station.stnPlace || "이름없음"; 
                        const originalStationData = { ...station }; 

                        if (stationAddress) {
                            geocoderForStations.addressSearch(stationAddress, function(results, status) {
                                if (status === kakao.maps.services.Status.OK && results.length > 0) {
                                    const lat = parseFloat(results[0].y);
                                    const lon = parseFloat(results[0].x);
                                    const distance = getDistance(currentLat, currentLon, lat, lon);
                                    resolve({
                                        name: stationName,
                                        address: stationAddress,
                                        lat: lat,
                                        lon: lon,
                                        distance: distance,
                                        originalData: originalStationData 
                                    });
                                } else {
                                    console.warn(`주소 지오코딩 실패: ${stationAddress}`, status); //자주 발생하는 오류 경고, 근처가 로딩이 안되는 경우 전체 수정 필요
                                    resolve({ name: `${stationName} (${stationAddress})`, distance: null, lat: null, lon: null, originalData: originalStationData });
                                }
                            });
                        } else {
                            console.warn("주소 정보가 없는 충전소:", stationName);
                            resolve({ name: stationName, distance: null, lat: null, lon: null, originalData: originalStationData });
                        }
                    });
                });

                Promise.all(geocodingPromises)
                    .then(placeDetails => {
                        listContainer.innerHTML = ''; 

                        placeDetails.sort((a, b) => {
                            if (a.distance === null) return 1;
                            if (b.distance === null) return -1;
                            return a.distance - b.distance;
                        });

                        let nearestPlaceForHighlight = null;
                        if (placeDetails.length > 0 && placeDetails[0].distance !== null) {
                            nearestPlaceForHighlight = placeDetails[0];
                        }
                        
                        placeDetails.forEach((detail, index) => {
                            if (detail.lat && detail.lon) { 
                                const marker = new kakao.maps.Marker({
                                    position: new kakao.maps.LatLng(detail.lat, detail.lon),
                                    map: map,
                                    image: stationMarkerImage
                                });

                                const infoContent = `${detail.name} - ${detail.distance.toFixed(2)} km`; 
                                
                                const infowindow = new kakao.maps.InfoWindow({
                                    content: `<div style="padding:5px 10px; font-size:14px; white-space: nowrap;">${infoContent}</div>`
                                });

                                kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
                                kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
                                kakao.maps.event.addListener(marker, 'click', () => {
                                    const link = `https://map.kakao.com/link/to/${detail.name},${detail.lat},${detail.lon}`;
                                    window.open(link, '_blank');
                                });
                            }

                            const div = document.createElement('div');
                            div.className = 'station-item';
                            div.textContent = `${index + 1}. ${detail.name}` + 
                                              (detail.distance !== null ? ` - ${detail.distance.toFixed(2)} km` : ` (${detail.address || '주소 정보 없음'})`);
                            
                            // 네이버 지도 좌표 이동부
                            div.addEventListener('click', () => {
                                if (detail.lat && detail.lon) {
                                    // 유효한 좌표가 있으면 지도를 해당 위치로 이동(panTo)
                                    const moveLatLon = new kakao.maps.LatLng(detail.lat, detail.lon);
                                    map.panTo(moveLatLon);
                                } else {
                                    // 좌표 정보가 없는 경우, 기존처럼 네이버 검색 실행
                                    const queryName = detail.name.split('(')[0].trim();
                                    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(queryName)}`;
                                    window.open(url, '_blank');
                                    console.warn(`좌표 정보가 없는 충전소(${detail.name}) 클릭됨. 네이버 검색으로 대체합니다.`);
                                }
                            });

                            listContainer.appendChild(div);
                        });

                        if (nearestPlaceForHighlight && nearestPlaceForHighlight.lat && nearestPlaceForHighlight.lon) {
                            const nearestMarker = new kakao.maps.Marker({
                                position: new kakao.maps.LatLng(nearestPlaceForHighlight.lat, nearestPlaceForHighlight.lon),
                                map: map,
                                image: new kakao.maps.MarkerImage(
                                    'https://cdn-icons-png.flaticon.com/512/3103/3103446.png', 
                                    new kakao.maps.Size(40, 40)
                                )
                            });
                            const nearestInfoWindow = new kakao.maps.InfoWindow({
                                content: `<div style="padding:5px 10px; font-size:14px; font-weight:bold; white-space: nowrap;">🔋 가장 가까운 충전소 - ${nearestPlaceForHighlight.name} (${nearestPlaceForHighlight.distance.toFixed(2)} km)</div>`
                            });
                            nearestInfoWindow.open(map, nearestMarker);
                            kakao.maps.event.addListener(nearestMarker, 'click', () => {
                                const link = `https://map.kakao.com/link/to/${nearestPlaceForHighlight.name},${nearestPlaceForHighlight.lat},${nearestPlaceForHighlight.lon}`;
                                window.open(link, '_blank');
                            });
                        }

                    })
                    .catch(error => {
                        console.error("Promise.all 에러 (주소 변환 중 하나 이상 실패):", error);
                        listContainer.innerHTML = '일부 충전소 위치를 변환하는 데 실패했습니다.';
                    });

            } else {
                listContainer.innerHTML = '주변에 충전소 정보가 없거나 불러오는 데 실패했습니다.';
            }
        })
        .catch(error => {
            console.error('Fetch 에러 (KEPCO 데이터 요청 실패):', error);
            listContainer.innerHTML = `충전소 정보를 불러오는 중 오류 발생: ${error.message}`;
        });
}

// 카카오맵 API 및 서비스 라이브러리 로드 후 실행
kakao.maps.load(function() {
    console.log("카카오맵 API 및 서비스 라이브러리 로드 완료!");
    loadMapAndStations();
    document.getElementById('reload-btn').addEventListener('click', function() {
        const listContainer = document.getElementById('list-container');
        if (listContainer) {
            listContainer.innerHTML = '위치를 다시 불러오는 중...';
        }
        loadMapAndStations();
    });
>>>>>>> master
});
