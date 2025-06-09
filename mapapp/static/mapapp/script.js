// // paging
// // let stationList = [];
// let map;
// let stationList = [];
// let currentLat, currentLon;
// let itemsPerPage = 7;
// let currentPage = 1;

// function renderStationPage(pageNumber) {
//   currentPage = pageNumber;
//   const listContainer = document.getElementById("list-container");
//   listContainer.innerHTML = "";

//   const startIdx = (pageNumber - 1) * itemsPerPage;
//   const endIdx = startIdx + itemsPerPage;
//   const currentItems = stationList.slice(startIdx, endIdx);

//   currentItems.forEach((detail, index) => {
//     const div = document.createElement("div");
//     div.className = "station-item";
//     div.textContent =
//       `${startIdx + index + 1}. ${detail.name}` +
//       (detail.distance !== null
//         ? ` - ${detail.distance.toFixed(2)} km`
//         : ` (${detail.address || "주소 정보 없음"})`);

//     // ✅ 지도 이동 이벤트 추가
//     div.addEventListener("click", () => {
//       if (detail.lat && detail.lon) {
//         const moveLatLon = new kakao.maps.LatLng(detail.lat, detail.lon);
//         map.panTo(moveLatLon);
//       } else {
//         const queryName = detail.name.split("(")[0].trim();
//         const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(
//           queryName
//         )}`;
//         window.open(url, "_blank");
//       }
//     });

//     listContainer.appendChild(div);
//   });

//   renderPaginationButtons();
// }

// function renderPaginationButtons() {
//   const container = document.getElementById("list-container");
//   const totalPages = Math.ceil(stationList.length / itemsPerPage);

//   const paginationDiv = document.createElement("div");
//   paginationDiv.className = "pagination";

//   const createPageButton = (page, label = null, disabled = false) => {
//     const btn = document.createElement("button");
//     btn.textContent = label || page;
//     if (page === currentPage) btn.classList.add("active");
//     if (disabled) btn.disabled = true;
//     btn.addEventListener("click", () => renderStationPage(page));
//     paginationDiv.appendChild(btn);
//   };

//   // ← 이전 버튼
//   createPageButton(currentPage - 1, "←", currentPage === 1);

//   if (totalPages <= 7) {
//     for (let i = 1; i <= totalPages; i++) {
//       createPageButton(i);
//     }
//   } else {
//     createPageButton(1); // 항상 첫 페이지

//     if (currentPage > 4) {
//       const ellipsis = document.createElement("span");
//       ellipsis.textContent = "...";
//       ellipsis.className = "ellipsis";
//       paginationDiv.appendChild(ellipsis);
//     }

//     const start = Math.max(2, currentPage - 2);
//     const end = Math.min(totalPages - 1, currentPage + 2);
//     for (let i = start; i <= end; i++) {
//       createPageButton(i);
//     }

//     if (currentPage < totalPages - 3) {
//       const ellipsis = document.createElement("span");
//       ellipsis.textContent = "...";
//       ellipsis.className = "ellipsis";
//       paginationDiv.appendChild(ellipsis);
//     }

//     createPageButton(totalPages); // 항상 마지막 페이지
//   }

//   // → 다음 버튼
//   createPageButton(currentPage + 1, "→", currentPage === totalPages);

//   container.appendChild(paginationDiv);
// }

// // 시도코드 변환용 객체 - 카카오맵 API에서 반환하는 시/도 이름(중요, 이름으로 가져옴)을 KEPCO의 metroCd로 변환
// const KEPCO_METRO_CD_FROM_KAKAO_NAME = {
//   서울특별시: "11",
//   부산광역시: "21", // 카카오 region_1depth_name "부산광역시" -> KEPCO metroCd "21"
//   대구광역시: "22",
//   인천광역시: "23",
//   광주광역시: "24",
//   대전광역시: "25",
//   울산광역시: "26",
//   세종특별자치시: "29",
//   경기도: "31",
//   강원도: "32", // 카카오가 "강원특별자치도"로 반환하면 키를 맞춰야 함
//   강원특별자치도: "32",
//   충청북도: "33",
//   충청남도: "34",
//   전라북도: "35", // 카카오가 "전북특별자치도"로 반환하면 키를 맞춰야 함
//   전북특별자치도: "35",
//   전라남도: "36",
//   경상북도: "37",
//   경상남도: "38",
//   제주특별자치도: "39",
// };

// // 두 지점 간의 거리를 계산하는 함수 (기존과 동일)
// function getDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // 지구 반지름 (km)
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// /*
// UI: Showing prograss-bar
// */
// function showLoadingMessage(container, message) {
//   container.innerHTML = `
//       <div class="loading-wrapper">
//         <p>${message}</p>
//         <div class="loading-bar-bg">
//           <div class="loading-bar-fill"></div>
//         </div>
//       </div>
//     `;
// }

// /*
//   지도와 충전소 정보를 로드하는 주 함수 부분(loadMapAndStations, fetchStations)

//   구조 요약:
//   해당 지역의 주소 각출, 이후 카카오맵 API를 통해 행정구역 코드로 변환
//   카카오맵 API를 상부의 KEPCO_METRO_CD_FROM_KAKAO_NAME 객체를 통해 KEPCO metroCd로 변환 > views.py로 전달
//   각 충전소의 주소를 받게 됨

//   받은 충전소 주소를 다시 카카오맵 API를 호출하여 각 충전소별 lat, lon 초기화
//   이를 기반으로 getDistance 함수를 사용하여 충전소와의 거리를 계산함
//   */

// function loadMapAndStations() {
//   const listContainer = document.getElementById("list-container");
//   showLoadingMessage(listContainer, "현재 위치를 찾는 중...");

//   navigator.geolocation.getCurrentPosition(
//     function (position) {
//       const userLat = position.coords.latitude;
//       const userLon = position.coords.longitude;

//       showLoadingMessage(
//         listContainer,
//         "행정구역 코드 찾는 중 (카카오맵 API 호출)..."
//       );

//       const geocoder = new kakao.maps.services.Geocoder();

//       geocoder.coord2RegionCode(userLon, userLat, function (result, status) {
//         if (status === kakao.maps.services.Status.OK) {
//           console.log("카카오 coord2RegionCode 전체 결과:", result[0]);

//           if (result.length > 0 && result[0].code) {
//             const kakaoFullRegionCode = result[0].code; // 예: "2711012400"
//             const kakaoMetroName = result[0].region_1depth_name; // 예: "대구광역시"
//             // const kakaoSigunguName = result[0].region_2depth_name; // 예: "중구" (시군구 매핑이 가능해지면 사용)

//             console.log("카카오가 알려준 시/도 이름:", kakaoMetroName);
//             console.log("카카오가 알려준 전체 행정 코드:", kakaoFullRegionCode);

//             // 1. KEPCO용 metroCd 변환 (카카오 시/도 이름을 KEPCO 코드로)
//             const kepcoMetroCd = KEPCO_METRO_CD_FROM_KAKAO_NAME[kakaoMetroName];

//             if (!kepcoMetroCd) {
//               listContainer.innerHTML = `지원하지 않는 시/도 지역입니다: ${kakaoMetroName}`;
//               console.error(
//                 "KEPCO용 metroCd를 맵핑할 수 없습니다:",
//                 kakaoMetroName
//               );
//               return;
//             }

//             // 2. KEPCO용 cityCd 추출 (카카오 전체 코드의 3,4번째 자리)
//             // 일단은 냅두겠으나...사용할지는 의문.
//             let kepcoCityCd = "";
//             if (kakaoFullRegionCode.length >= 4) {
//               kepcoCityCd = kakaoFullRegionCode.substring(2, 4);
//             } else {
//               console.warn(
//                 "카카오 전체 행정 코드가 짧아서 cityCd를 추출할 수 없습니다:",
//                 kakaoFullRegionCode
//               );
//               // cityCd 없이 보내거나, KEPCO API가 cityCd 필수를 요구하지 않으면 괜찮음
//               // (KEPCO EVcharge.do API는 cityCd가 선택사항임)
//             }

//             console.log("KEPCO로 보낼 최종 metroCd:", kepcoMetroCd); // 예: 대구 -> '22'
//             console.log("KEPCO로 보낼 최종 cityCd:", kepcoCityCd); // 예: '27110...' -> '11'

//             // 추출된 코드로 충전소 정보 요청
//             fetchStations(userLat, userLon, kepcoMetroCd, kepcoCityCd);
//           } else {
//             listContainer.innerHTML =
//               "행정구역 코드를 찾을 수 없습니다. (카카오 API 응답 오류)";
//             console.error(
//               "coord2RegionCode 결과에서 유효한 코드를 찾지 못했습니다."
//             );
//           }
//         } else {
//           listContainer.innerHTML =
//             "행정구역 코드 변환에 실패했습니다. (카카오 API 호출 실패)";
//           console.error("coord2RegionCode API 호출 실패:", status);
//         }
//       });
//     },
//     function (error) {
//       console.error("navigator.geolocation 오류:", error.message);
//       listContainer.innerHTML = `현재 위치를 가져올 수 없습니다. (${error.message})`;
//     }
//   );
// }

// function fetchStations(currentLat, currentLon, metroCd, cityCd) {
//   const listContainer = document.getElementById("list-container");
//   showLoadingMessage(listContainer, "충전소 정보 로딩 중...");

//   let fetchUrl = `/stations/?metroCd=${metroCd}`;
//   if (cityCd && cityCd.trim()) {
//     fetchUrl += `&cityCd=${cityCd}`;
//   }

//   const mapContainer = document.getElementById("map");
//   const mapOption = {
//     center: new kakao.maps.LatLng(currentLat, currentLon),
//     level: 5,
//   };
//   const map = new kakao.maps.Map(mapContainer, mapOption);
//   map.addControl(
//     new kakao.maps.ZoomControl(),
//     kakao.maps.ControlPosition.RIGHT
//   );

//   new kakao.maps.Marker({
//     position: new kakao.maps.LatLng(currentLat, currentLon),
//     map: map,
//   });

//   const stationMarkerImage = new kakao.maps.MarkerImage(
//     "https://cdn-icons-png.flaticon.com/512/3103/3103446.png",
//     new kakao.maps.Size(24, 24)
//   );

//   const geocoderForStations = new kakao.maps.services.Geocoder();

//   fetch(fetchUrl)
//     .then((response) => {
//       if (!response.ok)
//         throw new Error(`HTTP error! status: ${response.status}`);
//       return response.json();
//     })
//     .then((data) => {
//       const stationsFromKepco = data.data;
//       if (stationsFromKepco && stationsFromKepco.length > 0) {
//         const geocodingPromises = stationsFromKepco.map((station) => {
//           return new Promise((resolve) => {
//             const stationAddress = station.stnAddr;
//             const stationName = station.stnPlace || "이름없음";
//             const originalStationData = { ...station };

//             if (stationAddress) {
//               geocoderForStations.addressSearch(
//                 stationAddress,
//                 function (results, status) {
//                   if (
//                     status === kakao.maps.services.Status.OK &&
//                     results.length > 0
//                   ) {
//                     const lat = parseFloat(results[0].y);
//                     const lon = parseFloat(results[0].x);
//                     const distance = getDistance(
//                       currentLat,
//                       currentLon,
//                       lat,
//                       lon
//                     );
//                     resolve({
//                       name: stationName,
//                       address: stationAddress,
//                       lat,
//                       lon,
//                       distance,
//                       originalData: originalStationData,
//                     });
//                   } else {
//                     resolve({
//                       name: `${stationName} (${stationAddress})`,
//                       distance: null,
//                       lat: null,
//                       lon: null,
//                       originalData: originalStationData,
//                     });
//                   }
//                 }
//               );
//             } else {
//               resolve({
//                 name: stationName,
//                 distance: null,
//                 lat: null,
//                 lon: null,
//                 originalData: originalStationData,
//               });
//             }
//           });
//         });

//         Promise.all(geocodingPromises)
//           .then((placeDetails) => {
//             listContainer.innerHTML = "";

//             placeDetails.sort((a, b) => {
//               if (a.distance === null) return 1;
//               if (b.distance === null) return -1;
//               return a.distance - b.distance;
//             });

//             placeDetails.forEach((detail) => {
//               if (detail.lat && detail.lon) {
//                 const marker = new kakao.maps.Marker({
//                   position: new kakao.maps.LatLng(detail.lat, detail.lon),
//                   map: map,
//                   image: stationMarkerImage,
//                 });

//                 const infoContent = `${detail.name} - ${detail.distance.toFixed(
//                   2
//                 )} km`;
//                 const infowindow = new kakao.maps.InfoWindow({
//                   content: `<div style="padding:5px 10px; font-size:14px; white-space: nowrap;">${infoContent}</div>`,
//                 });

//                 kakao.maps.event.addListener(marker, "mouseover", () =>
//                   infowindow.open(map, marker)
//                 );
//                 kakao.maps.event.addListener(marker, "mouseout", () =>
//                   infowindow.close()
//                 );
//                 kakao.maps.event.addListener(marker, "click", () => {
//                   const link = `https://map.kakao.com/link/to/${detail.name},${detail.lat},${detail.lon}`;
//                   window.open(link, "_blank");
//                 });
//               }
//             });

//             // 가장 가까운 충전소 마커 강조
//             const nearest = placeDetails.find(
//               (item) => item.lat && item.lon && item.distance !== null
//             );
//             if (nearest) {
//               const greenMarker = new kakao.maps.Marker({
//                 position: new kakao.maps.LatLng(nearest.lat, nearest.lon),
//                 map: map,
//                 image: new kakao.maps.MarkerImage(
//                   "https://cdn-icons-png.flaticon.com/512/3103/3103446.png", // 강조된 마커 이미지 (크기 다르게 해도 됨)
//                   new kakao.maps.Size(40, 40)
//                 ),
//               });

//               const info = new kakao.maps.InfoWindow({
//                 content: `<div style="padding:5px 10px; font-size:14px; font-weight:bold; white-space: nowrap;">
//     🔋 가장 가까운 충전소 - ${nearest.name} (${nearest.distance.toFixed(
//                   2
//                 )} km)</div>`,
//               });

//               info.open(map, greenMarker);

//               kakao.maps.event.addListener(greenMarker, "click", () => {
//                 const link = `https://map.kakao.com/link/to/${nearest.name},${nearest.lat},${nearest.lon}`;
//                 window.open(link, "_blank");
//               });
//             }

//             stationList = placeDetails;
//             renderStationPage(1);
//           })
//           .catch((error) => {
//             console.error("주소 변환 중 오류:", error);
//             listContainer.innerHTML = "충전소 위치를 변환하는 데 실패했습니다.";
//           });
//       } else {
//         listContainer.innerHTML =
//           "주변에 충전소 정보가 없거나 불러오는 데 실패했습니다.";
//       }
//     })
//     .catch((error) => {
//       console.error("Fetch 에러:", error);
//       listContainer.innerHTML = `충전소 정보를 불러오는 중 오류 발생: ${error.message}`;
//     });
// }

// // 로드
// kakao.maps.load(function () {
//   console.log("카카오맵 로드 완료");
//   loadMapAndStations();
//   document.getElementById("reload-btn").addEventListener("click", function () {
//     const listContainer = document.getElementById("list-container");
//     if (listContainer) listContainer.innerHTML = "위치를 다시 불러오는 중...";
//     loadMapAndStations();
//   });
// });
// 전역 변수 정의
let map;
let stationList = [];
let currentLat, currentLon;
let itemsPerPage = 7;
let currentPage = 1;

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

      // 🔋 가장 가까운 충전소 마커 강조 표시
      const nearest = stationList.find(
        (item) => item.lat && item.lon && item.distance !== null
      );
      if (nearest) {
        const highlightMarker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(nearest.lat, nearest.lon),
          map,
          image: new kakao.maps.MarkerImage(
            "https://cdn-icons-png.flaticon.com/512/3103/3103446.png", // 같은 아이콘이지만 크기만 다름
            new kakao.maps.Size(40, 40) // 👈 더 큰 아이콘
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
