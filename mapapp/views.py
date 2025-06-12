# from django.shortcuts import render
# from django.http import JsonResponse
# import requests
# import urllib.parse

# def map_view(request):
#     return render(request, 'mapapp/index.html')

# def get_stations(request):
    
#     # lat = request.GET.get('lat')
#     # lon = request.GET.get('lon')
#     metro_cd = request.GET.get('metroCd')
#     city_cd = request.GET.get('cityCd')
    
#     print(f"--- Django View get_stations ---")
#     print(f"JS로부터 받은 metroCd: {metro_cd}")
#     print(f"JS로부터 받은 cityCd: {city_cd}")
    
#     if not metro_cd:
#         return JsonResponse({'error': '필수 파라미터인 시도코드(metroCd)가 누락되었습니다.'}, status=400)
    
#     base_url = 'https://bigdata.kepco.co.kr/openapi/v1/EVcharge.do'
#     apiKey = 'k4aopw1O2eelxb7ZC13F72euh1Y5SK60sZFKVbTA'

#     params = {
#         'apiKey': apiKey,
#         'metroCd': metro_cd,
#         'returnType': 'json'
#     }

#     # 그러니까 카카오맵은 행정부 시도코드를 쓰고, KEPCO는 통계청 시도코드를 쓴다고? XML도 안주고 그걸 매핑하라고?
#     # 고로 이 부분은 주석처리함. cityCd는 사용하지 않음. 해결책이 나올때까지...
#     # if city_cd and city_cd.strip():
#     #    params['cityCd'] = city_cd
        
#     ''' 
#     params = {
#         'apiKey': apiKey,
#         'metroCd': 26,
#         'returnType': 'json'
#     }
#     '''
#     query_string = urllib.parse.urlencode(params, safe='/=')
#     full_url = f"{base_url}?{query_string}"

#     try:
#         response = requests.get(full_url)
#         print(f"KEPCO API 요청: {full_url}")
#         response.raise_for_status()
#         print(f"KEPCO API 응답 상태 코드: {response.status_code}") 
#         return JsonResponse(response.json())
#     except requests.exceptions.HTTPError as http_err:   # 자꾸 에러가 다채로워져서 증결함.
#         print(f"KEPCO API HTTP 오류 발생: {http_err}")
#         print(f"요청 URL: {response.url if hasattr(response, 'url') else full_url}")
#         print(f"API 응답 내용: {response.text if hasattr(response, 'text') else '응답 내용 없음'}")
#         return JsonResponse({'error': 'KEPCO 충전소 정보 API 호출 중 HTTP 오류가 발생했습니다.', 'detail': str(http_err)}, status=500)
#     except requests.exceptions.RequestException as e:
#         print(f"KEPCO API 요청 오류: {e}")
#         print(f"요청 URL: {full_url}")
#         return JsonResponse({'error': 'KEPCO 충전소 정보를 가져오는 데 실패했습니다.', 'detail': str(e)}, status=500)
#     except ValueError as json_err: 
#         print(f"KEPCO API 응답 JSON 파싱 오류: {json_err}")
#         if 'response' in locals() and hasattr(response, 'text'):
#              print(f"수신된 내용: {response.text}")
#         return JsonResponse({'error': 'KEPCO 충전소 정보의 형식이 올바르지 않습니다.', 'detail': str(json_err)}, status=500)

from django.shortcuts import render
from django.http import JsonResponse
import requests
import urllib.parse

def map_view(request):
    return render(request, 'mapapp/index.html')

def get_stations(request):
    metro_cd = request.GET.get('metroCd')
    city_cd = request.GET.get('cityCd')
    charger_type = request.GET.get('chargerType')  # 'rapid', 'slow', 'both'
    min_available = request.GET.get('minAvailable')  # 숫자형 문자열

    print(f"--- Django View get_stations ---")
    print(f"받은 metroCd: {metro_cd}")
    print(f"받은 chargerType: {charger_type}")
    print(f"받은 minAvailable: {min_available}")

    if not metro_cd:
        return JsonResponse({'error': 'metroCd 누락'}, status=400)

    base_url = 'https://bigdata.kepco.co.kr/openapi/v1/EVcharge.do'
    apiKey = 'k4aopw1O2eelxb7ZC13F72euh1Y5SK60sZFKVbTA'  # 실제 키 사용

    params = {
        'apiKey': apiKey,
        'metroCd': metro_cd,
        'returnType': 'json'
    }

    full_url = f"{base_url}?{urllib.parse.urlencode(params, safe='/=')}"
    print(f"[요청] KEPCO URL: {full_url}")

    try:
        response = requests.get(full_url)
        response.raise_for_status()

        data = response.json()
        stations = data.get('data', [])

        # ✅ 급속/완속 수량 기준으로 필터링
        if min_available:
            try:
                min_available = int(min_available)

                def passes_filter(station):
                    rapid = int(station.get('rapidCnt', 0))
                    slow = int(station.get('slowCnt', 0))

                    if charger_type == 'rapid':
                        return rapid >= min_available
                    elif charger_type == 'slow':
                        return slow >= min_available
                    elif charger_type == 'both':
                        return (rapid + slow) >= min_available
                    else:
                        return True  # 필터 미지정 시 모두 통과

                stations = [s for s in stations if passes_filter(s)]

            except ValueError:
                print("❗ minAvailable 파싱 실패. 필터 생략됨.")

        return JsonResponse({'data': stations})

    except requests.exceptions.RequestException as e:
        print(f"❌ 요청 오류: {e}")
        return JsonResponse({'error': 'KEPCO API 요청 실패', 'detail': str(e)}, status=500)
    except ValueError as json_err:
        print(f"❌ JSON 파싱 오류: {json_err}")
        return JsonResponse({'error': '응답 JSON 파싱 실패', 'detail': str(json_err)}, status=500)
