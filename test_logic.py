
def get_video_for_day(videos, day_number):
    if not videos or len(videos) == 0:
        return None

    target_day = 365 if day_number > 365 else day_number

    # 1. Look for matching day_number
    video = next((v for v in videos if v['dayNumber'] == target_day), None)

    # 2. Logic for missing videos
    if not video:
        if target_day == 246:
            return None
        
        # 3. Fallback logic
        if target_day <= 245:
            video = videos[target_day - 1] if target_day - 1 < len(videos) else None
        elif 247 <= target_day <= 354:
            index = target_day - 2
            video = videos[index] if index < len(videos) else None
        elif target_day == 355:
            video = videos[363] if 363 < len(videos) else (videos[-1] if videos else None)
        else:
            index = target_day - 3
            video = videos[index] if index < len(videos) else None
            
    return video

# Test cases
mock_videos = [
    {'dayNumber': i, 'videoId': f'vid{i}'} for i in range(1, 93)
]
# Add 93 with wrong index
mock_videos.append({'dayNumber': 95, 'videoId': 'vid95'}) # index 92
mock_videos.append({'dayNumber': 93, 'videoId': 'vid93'}) # index 93

res = get_video_for_day(mock_videos, 93)
print(f"Day 93: {res['videoId'] if res else 'None'}")

res = get_video_for_day(mock_videos, 1)
print(f"Day 1: {res['videoId'] if res else 'None'}")
