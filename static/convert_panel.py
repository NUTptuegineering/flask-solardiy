import pandas as pd
import json
import os

# กำหนด Path ของไฟล์ Excel และ JSON
base_path = "/Users/mm/Documents/Project_SolarDIY/static"
excel_path = os.path.join(base_path, "List_of_equip.xlsx")
json_path = os.path.join(base_path, "panel_list.json")

try:
    # อ่านข้อมูลจาก Sheet "Solarpanel"
    sheet_name = "Solarpanel"
    df = pd.read_excel(excel_path, sheet_name=sheet_name)

    # เปลี่ยนชื่อคอลัมน์
    rename_columns = {
        "Width(mm.)": "Width_m",
        "Length(mm.)": "Length_m"
    }
    df = df.rename(columns=rename_columns)

    # แปลงค่า mm → m และปัดเศษทศนิยม 3 ตำแหน่ง
    if "Width_m" in df.columns:
        df["Width_m"] = (df["Width_m"] / 1000).round(3)
    if "Length_m" in df.columns:
        df["Length_m"] = (df["Length_m"] / 1000).round(3)

    # ตรวจสอบว่ามีคอลัมน์ที่ต้องการครบหรือไม่
    required_columns = ["Brand", "Watt", "Width_m", "Length_m", "Price", "URL"]
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"❌ Missing column: {col}")

    # แปลง DataFrame เป็น JSON
    data = {"status": "success", "data": df.to_dict(orient="records")}

    # บันทึกไฟล์ JSON
    with open(json_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

    print(f"✅ แปลงข้อมูลจาก {excel_path} เป็น JSON เรียบร้อย!")
    print(f"📂 ไฟล์ถูกบันทึกที่: {json_path}")

except Exception as e:
    print(f"❌ เกิดข้อผิดพลาด: {e}")
