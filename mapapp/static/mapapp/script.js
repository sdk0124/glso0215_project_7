let map;
let stationList = [];
let currentLat, currentLon;
let itemsPerPage = 7;
let currentPage = 1;

function showToastMessage(message) {
  const toast = document.getElementById("toast-message");
  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

function renderStationPage(pageNumber) {
  currentPage = pageNumber;
  const listContainer = document.getElementById("list-container");
  listContainer.innerHTML = "";

  const startIdx = (pageNumber - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentItems = stationList.slice(startIdx, endIdx);

  currentItems.forEach((detail, index) => {
    const div = document.createElement("div");
    div.className = "station-item";

    // 즐겨찾기 여부 확인
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const isFavorite = favorites.some((fav) => fav.name === detail.name && fav.address === detail.address);

    // 충전소 이름 + 거리 표시
    const infoSpan = document.createElement("span");
    infoSpan.textContent =
      `${startIdx + index + 1}. ${detail.name}` +
      (detail.distance !== null
        ? ` - ${detail.distance.toFixed(2)} km`
        : ` (${detail.address || "주소 정보 없음"})`);
    infoSpan.style.marginRight = "10px";

    // 즐겨찾기 버튼
    const favBtn = document.createElement("button");
    favBtn.textContent = isFavorite ? "⭐" : "☆";
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // 클릭 시 지도 이동 방지

      let updatedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");

      if (isFavorite) {
        // 즐겨찾기 해제
        updatedFavorites = updatedFavorites.filter(
          (fav) => !(fav.name === detail.name && fav.address === detail.address)
        );
	showToastMessage("⭐ 즐겨찾기에서 삭제되었습니다.");
      } else {
        // 즐겨찾기 추가
        updatedFavorites.push({
          name: detail.name,
          address: detail.address,
          lat: detail.lat,
          lon: detail.lon,
          distance: detail.distance,
        });
	showToastMessage("⭐ 즐겨찾기에 추가되었습니다!");
      }

      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      renderStationPage(currentPage); // 다시 렌더링 (토글 반영)
    });

    div.textContent =
      `${startIdx + index + 1}. ${detail.name}` +
      (detail.distance !== null
        ? ` - ${detail.distance.toFixed(2)} km`
        : ` (${detail.address || "주소 정보 없음"})`);

    div.addEventListener("click", () => {
      if (detail.lat && detail.lon) {
        const moveLatLon = new kakao.maps.LatLng(detail.lat, detail.lon);
        map.panTo(moveLatLon);
      } else {
        const queryName = detail.name.split("(")[0].trim();
        const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(
          queryName
        )}`;
        window.open(url, "_blank");
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
  const container = document.getElementById("list-container");
  const totalPages = Math.ceil(stationList.length / itemsPerPage);

  const paginationDiv = document.createElement("div");
  paginationDiv.className = "pagination";

  const createPageButton = (page, label = null, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = label || page;
    if (page === currentPage) btn.classList.add("active");
    if (disabled) btn.disabled = true;
    btn.addEventListener("click", () => renderStationPage(page));
    paginationDiv.appendChild(btn);
  };

  createPageButton(currentPage - 1, "←", currentPage === 1);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      createPageButton(i);
    }
  } else {
    createPageButton(1);

    if (currentPage > 4) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.className = "ellipsis";
      paginationDiv.appendChild(ellipsis);
    }

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) {
      createPageButton(i);
    }

    if (currentPage < totalPages - 3) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.className = "ellipsis";
      paginationDiv.appendChild(ellipsis);
    }

    createPageButton(totalPages);
  }

  createPageButton(currentPage + 1, "→", currentPage === totalPages);
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
  서울특별시: "11",
  부산광역시: "21",
  대구광역시: "22",
  인천광역시: "23",
  광주광역시: "24",
  대전광역시: "25",
  울산광역시: "26",
  세종특별자치시: "29",
  경기도: "31",
  강원도: "32",
  강원특별자치도: "32",
  충청북도: "33",
  충청남도: "34",
  전라북도: "35",
  전북특별자치도: "35",
  전라남도: "36",
  경상북도: "37",
  경상남도: "38",
  제주특별자치도: "39",
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
  const listContainer = document.getElementById("list-container");
  showLoadingMessage(listContainer, "현재 위치를 찾는 중...");

    // 기존 지도가 있다면 완전히 제거
  if (map) {
    map = null;
    const mapContainer = document.getElementById("map");
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
          listContainer.innerHTML = "행정구역 코드 변환 실패";
        }
      });
    },
    (error) => {
      listContainer.innerHTML = `위치 정보를 가져오지 못했습니다: ${error.message}`;
    }
  );
}

function fetchStations(lat, lon, metroCd, cityCd) {
  const listContainer = document.getElementById("list-container");
  showLoadingMessage(listContainer, "충전소 정보 로딩 중...");

  let url = `/stations/?metroCd=${metroCd}&cityCd=${cityCd}`;

  map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(lat, lon),
    level: 5,
  });
  map.addControl(
    new kakao.maps.ZoomControl(),
    kakao.maps.ControlPosition.RIGHT
  );

  new kakao.maps.Marker({ position: new kakao.maps.LatLng(lat, lon), map });

  const markerImg = new kakao.maps.MarkerImage(
    "https://cdn-icons-png.flaticon.com/512/3103/3103446.png",
    new kakao.maps.Size(24, 24)
  );

  const geocoder = new kakao.maps.services.Geocoder();

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const rawStations = data.data || [];
      return Promise.all(
        rawStations.map(
          (station) =>
            new Promise((resolve) => {
              const addr = station.stnAddr,
                name = station.stnPlace || "이름없음";
              if (!addr)
                return resolve({ name, lat: null, lon: null, distance: null });
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
                  });
                } else {
                  resolve({ name, lat: null, lon: null, distance: null });
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

      stationList.forEach((detail) => {
        if (detail.lat && detail.lon) {
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(detail.lat, detail.lon),
            map,
            image: markerImg,
          });

          const infoContent = `${detail.name} - ${detail.distance.toFixed(
            2
          )} km`;
          const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:5px 10px; font-size:14px; white-space: nowrap;">${infoContent}</div>`,
          });

          kakao.maps.event.addListener(marker, "mouseover", () =>
            infowindow.open(map, marker)
          );
          kakao.maps.event.addListener(marker, "mouseout", () =>
            infowindow.close()
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
            "https://cdn-icons-png.flaticon.com/512/3103/3103446.png",
            new kakao.maps.Size(40, 40)
          ),
        });

        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px; font-size:14px; font-weight:bold; white-space: nowrap;">
      🔋 가장 가까운 충전소 - ${nearest.name} (${nearest.distance.toFixed(
            2
          )} km)
    </div>`,
        });

        infoWindow.open(map, highlightMarker);

        kakao.maps.event.addListener(highlightMarker, "click", () => {
          const link = `https://map.kakao.com/link/to/${nearest.name},${nearest.lat},${nearest.lon}`;
          window.open(link, "_blank");
        });
      }

      renderStationPage(1);
    })
    .catch((err) => {
      console.error("충전소 불러오기 오류:", err);
      listContainer.innerHTML = "충전소 정보를 불러오는 중 오류 발생";
    });
}

kakao.maps.load(() => {
  loadMapAndStations();
  document
    .getElementById("reload-btn")
    .addEventListener("click", loadMapAndStations);
});
