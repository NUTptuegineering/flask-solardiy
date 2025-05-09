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

@program1_bp.route('/Project_Estimation', methods=['GET'])
def show_project_estimation():
    return render_template('index1.html')

@program1_bp.route('/get_provinces', methods=['GET'])
def get_provinces():
    file_path = os.path.join(program1_bp.static_folder, 'provinces.json')
    with open(file_path, 'r', encoding='utf-8') as file:
        provinces = json.load(file)
    return jsonify(provinces)

import numpy as np

@program1_bp.route('/get_solar_charger_list', methods=['GET'])
def get_solar_charger_list():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        df = pd.read_excel(file_path, sheet_name='SolarCharger')

        df = df[df['Price (THB)'].notna()]

        df = df.replace({pd.NA: None, pd.NaT: None, float('nan'): None})

        data = df.to_dict(orient='records')
        return jsonify({"status": "success", "data": data}), 200

    except Exception as e:
        print(f"❌ Error loading solar charger: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@program1_bp.route('/get_inverter_offgrid', methods=['GET'])
def get_inverter_offgrid():
    file_path = os.path.join(program1_bp.static_folder, 'List_of_equip.xlsx')
    try:
        df = pd.read_excel(file_path, sheet_name='Inverter_offgrid')

        df = df[df['Price(Baht)'].notna()]

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

        df = df[df['Price(Baht)'].notna()]

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

        df = df.replace({np.nan: None, pd.NA: None})

        backup_days = int(request.args.get("backup_days", 1))
        total_energy_needed = float(request.args.get("total_energy", 0)) * backup_days

        if "Capacity (Ah)" in df.columns and "Voltage (V)" in df.columns:
            df["Required Batteries"] = (
                total_energy_needed / (df["Capacity (Ah)"] * df["Voltage (V)"])
            ).apply(lambda x: max(1, round(x)))

        if "Price (THB)" in df.columns:
            df["Total Price (THB)"] = df["Required Batteries"] * df["Price (THB)"]

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

        rename_columns = {
            "Width(mm.)": "Width_m",
            "Length(mm.)": "Length_m"
        }
        df = df.rename(columns=rename_columns)

        if "Width_m" in df.columns:
            df["Width_m"] = (df["Width_m"] / 1000).round(3)  # mm → m
        if "Length_m" in df.columns:
            df["Length_m"] = (df["Length_m"] / 1000).round(3)  # mm → m

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
        sheet_name = "Battery_offgrid" 
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
