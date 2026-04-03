
import os
import requests
import json

def test():
    with open('.env.local', 'r', encoding='utf-8') as f:
        env = f.read()
    
    api_key = ""
    for line in env.split('\n'):
        if line.startswith('NEXT_PUBLIC_YOUTUBE_API_KEY='):
            api_key = line.split('=')[1].strip()
            break
            
    if not api_key:
        print("API KEY NOT FOUND")
        return

    # 2. API 호출
    all_titles = []
    next_page_token = ""
    playlist_id = 'PLVcVykBcFZTR4Q6cvmybjPgCklZlv-Ghj'
    while True:
        url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId={playlist_id}&key={api_key}"
        if next_page_token:
            url += f"&pageToken={next_page_token}"
        
        resp = requests.get(url)
        data = resp.json()
        
        if 'error' in data:
            print(f"Error: {data['error']['message']}")
            break
            
        for item in data.get('items', []):
            title = item['snippet']['title']
            all_titles.append(title)
            
        next_page_token = data.get('nextPageToken')
        if not next_page_token:
            break

    print(f"Total Videos Found: {len(all_titles)}")
    for i, title in enumerate(all_titles):
        if "93" in title or (i >= 90 and i <= 95):
            print(f"{i+1}: {title}")

if __name__ == "__main__":
    test()
