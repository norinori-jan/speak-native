import os
import json
import glob

target_dir = r"C:\Users\norin\speak-native\phrases"

if os.path.exists(target_dir):
    json_files = glob.glob(os.path.join(target_dir, "*.json"))
    updated_count = 0
    total_items = 0

    for file_path in json_files:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                continue
                
        if not isinstance(data, dict) or "items" not in data:
            continue
            
        file_prefix = os.path.splitext(os.path.basename(file_path))[0]
        changed = False
        
        for idx, item in enumerate(data["items"], start=1):
            total_items += 1
            if not item.get("audio"):
                item["audio"] = f"{file_prefix}-{idx:03d}.mp3"
                changed = True
                
        if changed:
            with open(file_path, "w", encoding="utf-8", newline="\n") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            updated_count += 1

    print(f"完了しました！ 更新ファイル数: {updated_count}, 処理アイテム総数: {total_items}")
else:
    print(f"ディレクトリが見つかりません: {target_dir}")
