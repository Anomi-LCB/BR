import re

input_file = "../youtube link.txt"
output_file = "src/lib/youtubeLinks.ts"

lines = open(input_file, "r", encoding="utf-8").readlines()

data = {}

for line in lines:
    match = re.search(r'\*\s*(\d+)일차\s*=', line)
    if match:
        day = int(match.group(1))
        
        if "누락" in line:
            data[day] = None
        else:
            # find index
            idx_match = re.search(r'index=(\d+)', line)
            if idx_match:
                index = int(idx_match.group(1))
                data[day] = index

with open(output_file, "w", encoding="utf-8") as f:
    f.write("// 자동 생성된 365일 유튜브 인덱스 매핑 테이블\n")
    f.write("export const YOUTUBE_DAY_TO_INDEX: Record<number, number | null> = {\n")
    for i in range(1, 366):
        if i in data:
            val = data[i]
            if val is None:
                f.write(f"    {i}: null,\n")
            else:
                f.write(f"    {i}: {val},\n")
    f.write("};\n")

print("Generated youtubeLinks.ts")
