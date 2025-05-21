from django.shortcuts import render
from django.http import JsonResponse
import requests
import urllib.parse

def map_view(request):
    return render(request, 'mapapp/index.html')

def get_stations(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')

    if not lat or not lon:
        return JsonResponse({'error': '위도와 경도를 제공해야 합니다.'}, status=400)

    base_url = 'https://api.odcloud.kr/api/ev-charger/v1/ev-charger-list'

    service_key = '22Ye3pUCwpPsZOQpao1oo5gf6o9DyXPdMhblBR/oAc2c/xefNZg7C/zAcmUy/B8pDy/HqFjn7y5lNjXDmgI9tA=='

    params = {
        'serviceKey': service_key,
        'page': 1,
        'perPage': 10,
        'lat': lat,
        'lon': lon
    }

    query_string = urllib.parse.urlencode(params, safe='/=')

    full_url = f"{base_url}?{query_string}"

    try:
        response = requests.get(full_url)
        response.raise_for_status()
        return JsonResponse(response.json())
    except requests.RequestException as e:
        print(f"API 요청 오류: {e}")
        print(f"요청 URL: {full_url}")
        return JsonResponse({'error': '충전소 정보를 가져오는 데 실패했습니다.', 'detail': str(e)}, status=500)
