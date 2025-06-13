let map;
let stationList = [];
let currentLat, currentLon;
let itemsPerPage = 7;
let currentPage = 1;
let showingFavorites = false;

function showToastMessage(message) {
  const toast = document.getElementById('toast-message');
  toast.textContent = message;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

function renderStationPage(pageNumber) {
  currentPage = pageNumber;
  const listContainer = document.getElementById('list-container');
  listContainer.innerHTML = '';

  const startIdx = (pageNumber - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentItems = stationList.slice(startIdx, endIdx);

  currentItems.forEach((detail, index) => {
    const div = document.createElement('div');
    div.className = 'station-item';

    // 즐겨찾기 여부 확인
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.some(
      (fav) => fav.name === detail.name && fav.address === detail.address
    );

    // 충전소 이름 + 거리 표시
    const infoSpan = document.createElement('span');
    infoSpan.textContent =
      `${startIdx + index + 1}. ${detail.name}` +
      (detail.distance !== null
        ? ` - ${detail.distance.toFixed(2)} km`
        : ` (${detail.address || '주소 정보 없음'})`);
    infoSpan.style.marginRight = '10px';

    // 즐겨찾기 버튼
    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn';
    favBtn.textContent = isFavorite ? '⭐' : '☆';
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 클릭 시 지도 이동 방지

      let updatedFavorites = JSON.parse(
        localStorage.getItem('favorites') || '[]'
      );

      if (isFavorite) {
        // 즐겨찾기 해제
        updatedFavorites = updatedFavorites.filter(
          (fav) => !(fav.name === detail.name && fav.address === detail.address)
        );
        showToastMessage('⭐ 즐겨찾기에서 삭제되었습니다.');
      } else {
        // 즐겨찾기 추가
        updatedFavorites.push({
          name: detail.name,
          address: detail.address,
          lat: detail.lat,
          lon: detail.lon,
          distance: detail.distance,
          originalData: detail.originalData, // ✅ 필터링 시 필요한 상세정보!
        });
        showToastMessage('⭐ 즐겨찾기에 추가되었습니다!');
      }


      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      renderStationPage(currentPage); // 다시 렌더링 (토글 반영)
    });

    div.addEventListener('click', () => {
      if (detail.lat && detail.lon) {
        const moveLatLon = new kakao.maps.LatLng(detail.lat, detail.lon);
        map.panTo(moveLatLon);
      } else {
        const queryName = detail.name.split('(')[0].trim();
        const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(
          queryName
        )}`;
        window.open(url, '_blank');
      }
    });

    // DOM 구성
    div.appendChild(infoSpan);
    div.appendChild(favBtn);
    listContainer.appendChild(div);
  });

  renderPaginationButtons();
}

function renderPaginationButtons() {
  const container = document.getElementById('list-container');
  const totalPages = Math.ceil(stationList.length / itemsPerPage);

  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'pagination';

  const createPageButton = (page, label = null, disabled = false) => {
    const btn = document.createElement('button');
    btn.textContent = label || page;
    if (page === currentPage) btn.classList.add('active');
    if (disabled) btn.disabled = true;
    btn.addEventListener('click', () => renderStationPage(page));
    paginationDiv.appendChild(btn);
  };

  createPageButton(currentPage - 1, '←', currentPage === 1);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      createPageButton(i);
    }
  } else {
    createPageButton(1);

    if (currentPage > 4) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'ellipsis';
      paginationDiv.appendChild(ellipsis);
    }

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) {
      createPageButton(i);
    }

    if (currentPage < totalPages - 3) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'ellipsis';
      paginationDiv.appendChild(ellipsis);
    }

    createPageButton(totalPages);
  }

  createPageButton(currentPage + 1, '→', currentPage === totalPages);
  container.appendChild(paginationDiv);
}

function showLoadingMessage(container, message) {
  container.innerHTML = `
    <div class="loading-wrapper">
      <p>${message}</p>
      <div class="loading-bar-bg">
        <div class="loading-bar-fill"></div>
      </div>
    </div>`;
}

const KEPCO_METRO_CD_FROM_KAKAO_NAME = {
  서울특별시: '11',
  부산광역시: '21',
  대구광역시: '22',
  인천광역시: '23',
  광주광역시: '24',
  대전광역시: '25',
  울산광역시: '26',
  세종특별자치시: '29',
  경기도: '31',
  강원도: '32',
  강원특별자치도: '32',
  충청북도: '33',
  충청남도: '34',
  전라북도: '35',
  전북특별자치도: '35',
  전라남도: '36',
  경상북도: '37',
  경상남도: '38',
  제주특별자치도: '39',
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function loadMapAndStations() {
  const listContainer = document.getElementById('list-container');
  showLoadingMessage(listContainer, '현재 위치를 찾는 중...');

  // 기존 지도가 있다면 완전히 제거
  if (map) {
    map = null;
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLat = position.coords.latitude;
      currentLon = position.coords.longitude;

      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(currentLon, currentLat, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const metroName = result[0].region_1depth_name;
          const metroCd = KEPCO_METRO_CD_FROM_KAKAO_NAME[metroName];
          const cityCd = result[0].code.substring(2, 4);
          if (!metroCd)
            return (listContainer.innerHTML = `지원하지 않는 지역: ${metroName}`);
          fetchStations(currentLat, currentLon, metroCd, cityCd);
        } else {
          listContainer.innerHTML = '행정구역 코드 변환 실패';
        }
      });
    },
    (error) => {
      listContainer.innerHTML = `위치 정보를 가져오지 못했습니다: ${error.message}`;
    }
  );
}

function fetchStations(lat, lon, metroCd, cityCd) {
  const listContainer = document.getElementById('list-container');
  showLoadingMessage(listContainer, '충전소 정보 로딩 중...');

  let url = `/stations/?metroCd=${metroCd}&cityCd=${cityCd}`;

  map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(lat, lon),
    level: 5,
  });
  map.addControl(
    new kakao.maps.ZoomControl(),
    kakao.maps.ControlPosition.RIGHT
  );

  new kakao.maps.Marker({ position: new kakao.maps.LatLng(lat, lon), map });

  const markerImg = new kakao.maps.MarkerImage(
    'https://cdn-icons-png.flaticon.com/512/3103/3103446.png',
    new kakao.maps.Size(24, 24)
  );

  const geocoder = new kakao.maps.services.Geocoder();

  // 여기서부터 충전소 정보를 가져오는 부분을 일부 수정 - 06/08
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const rawStations = data.data || [];
      return Promise.all(
        rawStations.map(
          (station) =>
            new Promise((resolve) => {
              const addr = station.stnAddr;
              const name = station.stnPlace || '이름없음';
              if (!addr)
                return resolve({
                  name,
                  lat: null,
                  lon: null,
                  distance: null,
                  originalData: station, // API에서 호출한 값 중 상세 정보 저장(originalData) - 변수 이름 마음에 안듬 stationinfo가 더 낫지 않겠나(소감)
                });

              geocoder.addressSearch(addr, (results, status) => {
                if (
                  status === kakao.maps.services.Status.OK &&
                  results.length > 0
                ) {
                  const lat2 = parseFloat(results[0].y);
                  const lon2 = parseFloat(results[0].x);
                  resolve({
                    name,
                    lat: lat2,
                    lon: lon2,
                    distance: getDistance(lat, lon, lat2, lon2),
                    address: addr, // 주소 정보도 함께 저장
                    originalData: station, // 상세 정보 저장
                  });
                } else {
                  resolve({
                    name,
                    lat: null,
                    lon: null,
                    distance: null,
                    address: addr,
                    originalData: station, // 상세 정보 저장
                  });
                }
              });
            })
        )
      );
    })
    .then((details) => {
      stationList = details.sort(
        (a, b) => (a.distance ?? 99999) - (b.distance ?? 99999)
      );

      let detailInfoWindow = new kakao.maps.InfoWindow({
        removable: true,
      });

      stationList.forEach((detail) => {
        if (detail.lat && detail.lon) {
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(detail.lat, detail.lon),
            map,
            image: markerImg,
          });
          // 마커 클릭 이벤트
          kakao.maps.event.addListener(marker, 'click', () => {
            // 따로 조치 없이 html 여기서 구현
            const content = `
              <div style="padding:10px; min-width:280px; font-size:14px; line-height:1.6;">
                <strong style="font-size:16px;">${detail.name}</strong><br>
                <span style="color:#666;">${
                  detail.address
                }</span><hr style="margin: 8px 0;">
                ⚡️ 급속충전기: <strong>${
                  detail.originalData.rapidCnt || 0
                }대</strong><br>
                🔌 완속충전기: <strong>${
                  detail.originalData.slowCnt || 0
                }대</strong><br>
                🚗 지원차종: <span style="font-size:12px;">${
                  detail.originalData.carType || '정보 없음'
                }</span><br>
                <a href="https://map.kakao.com/link/to/${detail.name},${
              detail.lat
            },${
              detail.lon
            }" target="_blank" style="color:#007bff; text-decoration:none; margin-top:8px; display:inline-block;">길찾기</a>
              </div>
            `;

            detailInfoWindow.setContent(content);
            detailInfoWindow.open(map, marker);
          });

          const simpleInfoContent = `${detail.name} - ${detail.distance.toFixed(
            2
          )} km`;
          const simpleInfowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:5px 10px; font-size:14px; white-space: nowrap;">${simpleInfoContent}</div>`,
          });

          kakao.maps.event.addListener(marker, 'mouseover', () =>
            simpleInfowindow.open(map, marker)
          );
          kakao.maps.event.addListener(marker, 'mouseout', () =>
            simpleInfowindow.close()
          );
        }
      });
      const nearest = stationList.find(
        (item) => item.lat && item.lon && item.distance !== null
      );
      if (nearest) {
        const highlightMarker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(nearest.lat, nearest.lon),
          map,
          image: new kakao.maps.MarkerImage(
            'https://cdn-icons-png.flaticon.com/512/3103/3103446.png',
            new kakao.maps.Size(40, 40)
          ),
        });

        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px; font-size:14px; font-weight:bold; white-space: nowrap;">🔋 가장 가까운 충전소 - ${
            nearest.name
          } (${nearest.distance.toFixed(2)} km)</div>`,
        });

        infoWindow.open(map, highlightMarker);
        // 강조된 마커 클릭 이벤트
        kakao.maps.event.addListener(highlightMarker, 'click', () => {
          const content = `
            <div style="padding:10px; min-width:280px; font-size:14px; line-height:1.6;">
              <strong style="font-size:16px;">${nearest.name}</strong><br>
              <span style="color:#666;">${
                nearest.address
              }</span><hr style="margin: 8px 0;">
              ⚡️ 급속충전기: <strong>${
                nearest.originalData.rapidCnt || 0
              }대</strong><br>
              🔌 완속충전기: <strong>${
                nearest.originalData.slowCnt || 0
              }대</strong><br>
              🚗 지원차종: <span style="font-size:12px;">${
                nearest.originalData.carType || '정보 없음'
              }</span><br>
              <a href="https://map.kakao.com/link/to/${nearest.name},${
            nearest.lat
          },${
            nearest.lon
          }" target="_blank" style="color:#007bff; text-decoration:none; margin-top:8px; display:inline-block;">길찾기</a>
            </div>
          `;

          detailInfoWindow.setContent(content);
          detailInfoWindow.open(map, highlightMarker);
        });
      }

      renderStationPage(1);
    })
    .catch((err) => {
      console.error('충전소 불러오기 오류:', err);
      listContainer.innerHTML = '충전소 정보를 불러오는 중 오류 발생';
    });
}

kakao.maps.load(() => {
  loadMapAndStations();

  document
    .getElementById('reload-btn')
    .addEventListener('click', loadMapAndStations);

  const toggleBtn = document.getElementById('toggle-favorites-btn');
  // let showingFavorites = false;

  toggleBtn.addEventListener('click', () => {
    if (!showingFavorites) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      stationList = favorites;
      renderStationPage(1);
      toggleBtn.textContent = '📍 전체 충전소 보기';
      showingFavorites = true;
    } else {
      loadMapAndStations();
      toggleBtn.textContent = '⭐ 즐겨찾기만 보기';
      showingFavorites = false;
    }
  });
});

document.getElementById('applyFilterBtn').addEventListener('click', () => {
  const chargerType = document.getElementById('chargerType').value;
  const minAvailable = parseInt(
    document.getElementById('minAvailable').value || '0'
  );

  if (!currentLat || !currentLon) {
    showToastMessage('위치 정보를 먼저 가져오는 중입니다.');
    return;
  }

  if (showingFavorites) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    // 필터링 조건 적용
    const filtered = favorites.filter((station) => {
      const rapid = parseInt(station.originalData?.rapidCnt || 0);
      const slow = parseInt(station.originalData?.slowCnt || 0);

      if (chargerType === 'rapid') return rapid >= minAvailable;
      if (chargerType === 'slow') return slow >= minAvailable;
      return rapid + slow >= minAvailable; // both 또는 전체
    });

    stationList = filtered;
    renderStationPage(1);
    return;
  }

  // 즐겨찾기 모드가 아니라면 원래 API 호출
  const geocoder = new kakao.maps.services.Geocoder();
  geocoder.coord2RegionCode(currentLon, currentLat, (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
      const metroName = result[0].region_1depth_name;
      const metroCd = KEPCO_METRO_CD_FROM_KAKAO_NAME[metroName];
      const cityCd = result[0].code.substring(2, 4);

      let url = `/stations/?metroCd=${metroCd}&cityCd=${cityCd}`;
      if (chargerType) url += `&chargerType=${chargerType}`;
      if (minAvailable) url += `&minAvailable=${minAvailable}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const rawStations = data.data || [];
          return Promise.all(
            rawStations.map((station) => {
              const addr = station.stnAddr;
              const name = station.stnPlace || '이름없음';
              return new Promise((resolve) => {
                if (!addr) {
                  resolve({
                    name,
                    lat: null,
                    lon: null,
                    distance: null,
                    address: '',
                    originalData: station,
                  });
                } else {
                  geocoder.addressSearch(addr, (results, status) => {
                    if (
                      status === kakao.maps.services.Status.OK &&
                      results.length > 0
                    ) {
                      const lat2 = parseFloat(results[0].y);
                      const lon2 = parseFloat(results[0].x);
                      resolve({
                        name,
                        lat: lat2,
                        lon: lon2,
                        distance: getDistance(
                          currentLat,
                          currentLon,
                          lat2,
                          lon2
                        ),
                        address: addr,
                        originalData: station,
                      });
                    } else {
                      resolve({
                        name,
                        lat: null,
                        lon: null,
                        distance: null,
                        address: addr,
                        originalData: station,
                      });
                    }
                  });
                }
              });
            })
          );
        })
        .then((details) => {
          stationList = details.sort(
            (a, b) => (a.distance ?? 99999) - (b.distance ?? 99999)
          );
          renderStationPage(1);
        })
        .catch((err) => {
          console.error('필터 적용 실패:', err);
          showToastMessage('필터 적용 중 오류 발생');
        });
    }
  });
});
