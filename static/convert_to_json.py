import pandas as pd
import json
import os

# ตั้งค่าตำแหน่งไฟล์
excel_path = "/Users/mm/Documents/Project_SolarDIY/static/List_of_equip.xlsx"
json_path = "/Users/mm/Documents/Project_SolarDIY/static/battery_list.json"

try:
    # โหลดไฟล์ Excel
    excel_data = pd.ExcelFile(excel_path)

    # ตรวจสอบว่ามี sheet 'Battery_offgrid' หรือไม่
    sheet_name = "Battery_offgrid"
    if sheet_name not in excel_data.sheet_names:
        raise ValueError(f"Sheet '{sheet_name}' not found in Excel file.")

    # อ่านข้อมูลจาก sheet
    df = excel_data.parse(sheet_name)

    # แปลงเป็น JSON
    data = df.to_dict(orient="records")

    # บันทึกเป็นไฟล์ JSON
    with open(json_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

    print(f"✅ แปลงข้อมูลสำเร็จ! JSON ถูกบันทึกที่: {json_path}")

except Exception as e:
    print(f"❌ เกิดข้อผิดพลาด: {e}")
