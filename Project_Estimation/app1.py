import json
import os
import traceback
import pandas as pd
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import io
import base64
from itertools import combinations_with_replacement
from flask import Blueprint, render_template, request, jsonify, url_for, session, redirect

root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

program1_bp = Blueprint(
    'Project_Estimation', __name__,
    template_folder=os.path.join(root_path, 'templates'),
    static_folder=os.path.join(root_path, 'static')
)

# ✅ Route หลักของโปรแกรม
@program1_bp.route('/Project_Estimation', methods=['GET', 'POST'])
def index():
    enable_history = False
    month_count = 0
    if request.method == 'POST':
        user_type = request.form.get('user_type', "1.1.2")
        month_count = int(request.form.get('month_count', 0))
        current_month = int(request.form.get('current_month', 1))
        current_units = int(request.form.get('current_units', "0"))
        reduce_type = request.form.get('reduce_type', None)

        reduce_units = request.form.get('reduce_units', "0")
        reduce_money = request.form.get('reduce_money', "0")

        reduce_units = int(reduce_units) if reduce_units.isdigit() else 0
        try:
            reduce_money = float(reduce_money) if reduce_money.replace('.', '', 1).isdigit() else 0.0
        except ValueError:
            reduce_money = 0.0

        month_labels = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

        month_names = []
        previous_units = []
        individual_costs = []
        enable_history = "enable_history" in request.form  
        print(f"DEBUG: enable_history = {enable_history}")
        print(f"DEBUG: request.form = {request.form}")

        if enable_history:
            for i in range(1, month_count + 1):
                month_index = (current_month - i + 11) % 12  # ✅ แก้ index ให้ถูกต้อง
                month_names.append(month_labels[month_index])


                units = request.form.get(f'month{i}', "0")
                units = int(units) if units.isdigit() else 0
                previous_units.append(units)

        previous_units.reverse()
        month_names.reverse()

        month_names.append(month_labels[current_month - 1])
        previous_units.append(current_units)

        for units in previous_units:
            cost_with_vat = calculate_electricity_bill(units, user_type)
            individual_costs.append(round(cost_with_vat, 2))

        total_units = sum(previous_units)
        total_cost = sum(individual_costs)

        new_units = total_units
        new_cost = total_cost
        reduced_units = 0

        if reduce_type == "unit":
            if enable_history and month_count > 0:
                total_months = month_count + 1  # (เดือนย้อนหลัง + เดือนปัจจุบัน)
                avg_units_per_month = total_units / total_months
            else:
                avg_units_per_month = current_units  # ใช้เดือนปัจจุบันโดยตรงเมื่อไม่ได้เลือกย้อนหลัง

            new_units = max(0, avg_units_per_month - reduce_units)  # หน่วยที่เหลือหลังลด
            new_cost = calculate_electricity_bill(new_units, user_type)  # คำนวณค่าไฟใหม่

            # Debugging Logs
            print(f"DEBUG: total_units = {total_units}")
            print(f"DEBUG: avg_units_per_month = {avg_units_per_month}")
            print(f"DEBUG: new_units หลังลด = {new_units}")
            print(f"DEBUG: new_cost หลังลด = {new_cost}")

        elif reduce_type == "money":
            remaining_cost = max(0, total_cost - reduce_money)
            reduced_units = find_units_from_cost(remaining_cost, user_type)
            new_units = max(0, total_units - reduced_units)
            new_cost = calculate_electricity_bill(new_units, user_type)

        # ✅ เก็บข้อมูลไว้ใน session ก่อน Redirect
        session["data"] = {
            "month_names": month_names,
            "previous_units": previous_units,
            "individual_costs": individual_costs,
            "month_count": month_count,
            "current_month": current_month,
            "reduce_type": reduce_type,
            "reduce_units": reduce_units,
            "reduce_money": reduce_money,
            "reduced_units": reduced_units,
            "new_units": new_units,
            "new_cost": new_cost,
            "user_type": user_type,
            "enable_history": enable_history
        }

        # ✅ Redirect ไป GET `/` เพื่อป้องกันการส่งซ้ำ
        return redirect(url_for('index1'))

    # ✅ โหลดค่าจาก session ถ้ามี หรือใช้ค่าเริ่มต้น
    data = session.pop("data", {
        "month_names": [],
        "previous_units": [],
        "individual_costs": [],
        "month_count": 0,
        "current_month": 1,
        "reduce_type": None,
        "reduce_units": 0,
        "reduce_money": 0.0,
        "reduced_units": 0,
        "new_units": 0,
        "new_cost": 0.0,
        "user_type": "1.1.2",
        "enable_history": False
    })
    # ✅ คำนวณค่าเฉลี่ยหน่วยไฟฟ้า และ ค่าไฟ
    if data["previous_units"] and data["individual_costs"]:
        data["avg_units"] = sum(data["previous_units"]) / len(data["previous_units"])  # ✅ คำนวณค่าเฉลี่ยหน่วยไฟฟ้า
        data["avg_cost"] = sum(data["individual_costs"]) / len(data["individual_costs"])  # ✅ คำนวณค่าเฉลี่ยค่าไฟ
    else:
        data["avg_units"], data["avg_cost"] = 0, 0  # ถ้าไม่มีข้อมูล ให้ใช้ 0

    print(f"DEBUG: avg_units = {data['avg_units']}")  # ✅ Debug ค่าเฉลี่ยหน่วยไฟ
    print(f"DEBUG: avg_cost = {data['avg_cost']}")  # ✅ Debug ค่าเฉลี่ยค่าไฟ

    # ✅ ส่งค่าไป render_template()
    return render_template('index1.html', **data)

    data.setdefault("month_count", 0)
    print(f"DEBUG: month_count = {data['month_count']}")  # ✅ Debug เช็คค่าก่อนส่งไป HTML
    print(f"DEBUG: enable_history = {data['enable_history']}")
    #return render_template('index1.html', enable_history=enable_history)
    return render_template('index1.html', **data)
    #return render_template('index1.html')

@program1_bp.route('/get_provinces', methods=['GET'])
def get_provinces():
    file_path = os.path.join(program1_bp.static_folder, 'provinces.json')
    with open(file_path, 'r', encoding='utf-8') as file:
        provinces = json.load(file)
    return jsonify(provinces)

import numpy as np

# ✅ เพิ่ม route ใหม่ในไฟล์ app1.py หรือ project1.py
@program1_bp.route('/get_solar_charger_list', methods=['GET'])
def get_solar_charger_list():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        df = pd.read_excel(file_path, sheet_name='SolarCharger')

        # ✅ กรองเฉพาะรายการที่มีราคากรอกไว้ (ราคามีค่าไม่ใช่ NaN)
        df = df[df['Price (THB)'].notna()]

        # ✅ แปลง NaN ให้กลายเป็น None เพื่อให้ jsonify ได้
        df = df.replace({pd.NA: None, pd.NaT: None, float('nan'): None})

        data = df.to_dict(orient='records')
        return jsonify({"status": "success", "data": data}), 200

    except Exception as e:
        print(f"❌ Error loading solar charger: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@program1_bp.route('/get_inverter_offgrid', methods=['GET'])
def get_inverter_offgrid():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')  # ✅ ดึงจาก static
    try:
        df = pd.read_excel(file_path, sheet_name='Inverter_offgrid')

        # ✅ กรองเฉพาะที่มีราคากรอกไว้
        df = df[df['Price(Baht)'].notna()]

        # ✅ แทน NaN ด้วย None เพื่อให้ jsonify ผ่าน
        df = df.replace({np.nan: None})

        data = df.to_dict(orient="records")

        return json.dumps({"status": "success", "data": data}, ensure_ascii=False), 200, {'Content-Type': 'application/json'}

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



@program1_bp.route('/get_inverter_ongrid', methods=['GET'])
def get_inverter_ongrid():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        df = pd.read_excel(file_path, sheet_name='Inverter_ongrid')

        # ✅ กรองเฉพาะรายการที่มีราคา
        df = df[df['Price(Baht)'].notna()]

        # ✅ แปลง NaN ให้เป็น None (เพื่อ JSON-compatible)
        df = df.replace({np.nan: None})

        data = df.to_dict(orient="records")

        return json.dumps({"status": "success", "data": data}, ensure_ascii=False), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@program1_bp.route('/get_battery_list', methods=['GET'])
def get_battery_list():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_name = "Battery_offgrid"
        df = excel_data.parse(sheet_name)

        # ✅ แก้ NaN ก่อนส่ง
        df = df.replace({np.nan: None, pd.NA: None})

        backup_days = int(request.args.get("backup_days", 1))
        total_energy_needed = float(request.args.get("total_energy", 0)) * backup_days

        if "Capacity (Ah)" in df.columns and "Voltage (V)" in df.columns:
            df["Required Batteries"] = (
                total_energy_needed / (df["Capacity (Ah)"] * df["Voltage (V)"])
            ).apply(lambda x: max(1, round(x)))

        if "Price (THB)" in df.columns:
            df["Total Price (THB)"] = df["Required Batteries"] * df["Price (THB)"]

        # ✅ แปลงเป็น JSON-compatible
        data = df.to_dict(orient="records")
        return jsonify({"status": "success", "data": data, "backup_days": backup_days}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@program1_bp.route('/get_panel_list', methods=['GET'])
def get_panel_list():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_name = "Solarpanel"
        df = excel_data.parse(sheet_name)

        # เปลี่ยนชื่อคอลัมน์
        rename_columns = {
            "Width(mm.)": "Width_m",
            "Length(mm.)": "Length_m"
        }
        df = df.rename(columns=rename_columns)

        # แปลงค่าจาก mm เป็น m และปัดเศษทศนิยม 3 ตำแหน่ง
        if "Width_m" in df.columns:
            df["Width_m"] = (df["Width_m"] / 1000).round(3)  # mm → m
        if "Length_m" in df.columns:
            df["Length_m"] = (df["Length_m"] / 1000).round(3)  # mm → m

        # ตรวจสอบว่ามีคอลัมน์ที่ต้องการครบหรือไม่
        required_columns = ["Brand", "Watt", "Width_m", "Length_m", "Price", "Link URL"]
        for col in required_columns:
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Missing column: {col}"}), 500

        data = df.to_dict(orient="records")
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@program1_bp.route('/update_battery', methods=['POST'])
def update_battery():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        updated_data = request.json.get("data")
        if not updated_data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        df = pd.DataFrame(updated_data)

        required_columns = ['Voltage (V)', 'Brand', 'Capacity (Ah)', 'Price (THB)']
        for col in required_columns:
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Missing required column: {col}"}), 400

        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            df.to_excel(writer, sheet_name="Battery_offgrid", index=False)

        return jsonify({"status": "success", "message": "Battery list updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@program1_bp.route('/get_equip_list', methods=['GET'])
def get_equip_list():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_name = "Battery_offgrid"  # ชื่อ Sheet ที่ต้องการ
        df = excel_data.parse(sheet_name)

        data = df.to_dict(orient="records")
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@program1_bp.route('/update_equip', methods=['POST'])
def update_equip():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        updated_data = request.json.get("data")
        if not updated_data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        df = pd.DataFrame(updated_data)

        required_columns = ['Name', 'Power (W)', 'Quantity']
        for col in required_columns:
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Missing required column: {col}"}), 400

        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            df.to_excel(writer, sheet_name="Equipment_list", index=False)

        return jsonify({"status": "success", "message": "Equipment list updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
