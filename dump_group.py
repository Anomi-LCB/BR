import os

file_path = "src/components/GroupDashboardView.tsx"

with open(file_path, "rb") as f:
    raw = f.read(500)

print(raw)
