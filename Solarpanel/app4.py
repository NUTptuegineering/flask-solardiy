print("✅ Loaded app4.py!")
import matplotlib
matplotlib.use('Agg')

from flask import Blueprint, render_template, request, jsonify
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import io
import base64
from itertools import combinations_with_replacement
from matplotlib.lines import Line2D

program4_bp = Blueprint(
    'Solarpanel', __name__,
    template_folder='../templates',
    static_folder='../static'
)

def generate_plot(roof_width, roof_length, num_panels_requested, center_align, panel_width, panel_length):
    print("\n📌 เรียกใช้ generate_plot()")
    print(f"📏 ขนาดหลังคา: {roof_width}m x {roof_length}m")
    print(f"🧱 ขนาดแผงที่ใช้: {panel_width}m x {panel_length}m")
    print(f"🔢 จำนวนแผงที่ผู้ใช้ต้องการวาง: {num_panels_requested}")
    print(f"🔄 จัดกึ่งกลางหรือไม่: {center_align}")
    margin_width = 0.3
    margin_length = 0.5
    spacing = 0.02
    row_spacing = 0.3
    rail_sizes = [2.1, 2.4, 4.2, 4.8]
    rail_colors = {
        2.1: "#a9a9a9",
        2.4: "#cd853f",
        4.2: "#8b4513",
        4.8: "#696969"
    }
    rail_margin_x = 0.2  # เผื่อขอบแนวนอน 20 cm
    rail_margin_y = 0.2  # เผื่อขอบแนวตั้ง 20 cm

    usable_width = roof_width - 2 * (margin_width + rail_margin_y)
    usable_length = roof_length - 2 * (margin_length + rail_margin_x)

    max_panels_along_width = int(usable_width // panel_width)
    max_panels_along_length = int(usable_length // panel_length)
    print(f"📐 usable area = {usable_width:.2f} x {usable_length:.2f}")
    print(f"📦 max_panels_along_width = {max_panels_along_width}")
    print(f"📦 max_panels_along_length = {max_panels_along_length}")    

    total_panels = min(max_panels_along_width * max_panels_along_length, num_panels_requested)

    if total_panels == 0:
        return None, 0, 0, None, None, 0, 0, "ขนาดหลังคาไม่เพียงพอสำหรับการวางแผงนะจ๊ะ"
    elif total_panels < num_panels_requested:
        return None, total_panels, 0, None, None, 0, 0, f"ไม่สามารถวางแผง {num_panels_requested} แผงได้ สามารถวางได้สูงสุด {total_panels} แผง"

    rows = min(max_panels_along_width, (total_panels + max_panels_along_length - 1) // max_panels_along_length)
    panels_per_row = [(total_panels // rows)] * rows
    for i in range(total_panels % rows):
        panels_per_row[i] += 1

    print(f"📊 จำนวนแถว: {rows}, จำนวนแผงต่อแถว: {panels_per_row}")

    total_height_used = rows * panel_width + (rows - 1) * row_spacing
    start_y = (roof_width - total_height_used) / 2 if center_align else margin_width + rail_margin_y

    fig_ratio = roof_length / roof_width
    fig, ax = plt.subplots(figsize=(10 * fig_ratio, 10))
    ax.add_patch(patches.Rectangle((0, 0), roof_length, roof_width, edgecolor='blue', facecolor='lightblue', lw=2))

    font_size = max(10, min(18, max(roof_width, roof_length) * 0.02))
    offset = max(roof_width, roof_length) * 0.06
    ax.text(roof_length / 2, -offset, f"Length: {roof_length}m", ha='center', fontsize=font_size, color='black')
    ax.text(-offset, roof_width / 2, f"Width: {roof_width}m", va='center', rotation=90, fontsize=font_size, color='black')

    panel_count = 0
    rails_used = []
    rail_connectors = 0
    connector_positions = []
    end_clamp_positions = []
    middle_clamp_positions = []
    middle_clamp_count = 0

    rail_offset = panel_width * 0.15

    for i, panels_in_this_row in enumerate(panels_per_row):
        start_x = (roof_length - (panels_in_this_row * (panel_length + spacing) - spacing)) / 2 if center_align else margin_length + rail_margin_x

        panel_y_top = start_y + i * (panel_width + row_spacing) + panel_width - rail_offset
        panel_y_bottom = start_y + i * (panel_width + row_spacing) + rail_offset

        for j in range(panels_in_this_row - 1):
            panel_x = start_x + j * (panel_length + spacing) + panel_length
            middle_clamp_positions.append((panel_x, panel_y_top))
            middle_clamp_positions.append((panel_x, panel_y_bottom))
            middle_clamp_count += 2


    ax.scatter([], [], color='red', s=50, label="Rail Connector")
    ax.scatter([], [], color='blue', s=50, label="End Clamp")

    for i, panels_in_this_row in enumerate(panels_per_row):
        required_rail_length = panels_in_this_row * (panel_length + spacing) - spacing
        rail_combination = select_rail_combination(required_rail_length, rail_sizes)
        rail_length_total = sum(rail_combination)

        start_x = (roof_length - required_rail_length) / 2 if center_align else margin_length + rail_margin_x
        rail_start_x = start_x + (required_rail_length - rail_length_total) / 2

        rails_used.append(rail_combination)

        if len(rail_combination) > 1:
            rail_connectors += (len(rail_combination) - 1) * 2
            current_x = rail_start_x  # จุดเริ่มต้นของ rail เส้นแรก
            for length in rail_combination[:-1]:
                current_x += length
                connector_x = current_x  # จุดที่รางเส้นก่อนหน้าจบ และรางเส้นใหม่เริ่ม
                connector_positions.append((connector_x, panel_y_top))
                connector_positions.append((connector_x, panel_y_bottom))


        first_panel_x = start_x
        last_panel_x = start_x + (panels_in_this_row - 1) * (panel_length + spacing)

        panel_y_top = start_y + i * (panel_width + row_spacing) + panel_width - rail_offset
        panel_y_bottom = start_y + i * (panel_width + row_spacing) + rail_offset

        end_clamp_positions.extend([
            (first_panel_x, panel_y_top),
            (last_panel_x + panel_length, panel_y_top),
            (first_panel_x, panel_y_bottom),
            (last_panel_x + panel_length, panel_y_bottom)
        ])

        for j in range(panels_in_this_row):
            panel_x = start_x + j * (panel_length + spacing)
            panel_y = start_y + i * (panel_width + row_spacing)
            ax.add_patch(patches.Rectangle((panel_x, panel_y), panel_length, panel_width,
                                           edgecolor='green', facecolor='lightgreen', lw=1))
            panel_count += 1

        rail_start_x = start_x + (required_rail_length - rail_length_total) / 2
        current_x = rail_start_x
        for rail_length in rail_combination:
            color = rail_colors.get(rail_length, "#000000")
            ax.plot([current_x, current_x + rail_length], [panel_y_top, panel_y_top], color=color, lw=2)
            ax.plot([current_x, current_x + rail_length], [panel_y_bottom, panel_y_bottom], color=color, lw=2)
            current_x += rail_length

    for x, y in connector_positions:
        ax.scatter(x, y, color='red', s=50)
    for x, y in middle_clamp_positions:
        ax.scatter(x, y, color='black', s=50)
    for x, y in end_clamp_positions:
        ax.scatter(x, y, color='blue', s=50)

    used_rails = set()
    used_connectors = bool(connector_positions)
    used_end_clamps = bool(end_clamp_positions)

    for rail_combination in rails_used:
        for rail_length in rail_combination:
            used_rails.add(rail_length)

    legend_items = []
    if middle_clamp_count > 0:
        legend_items.append(Line2D([], [], marker='o', linestyle='None', color='black', markersize=8, label="Middle Clamp"))
    if used_connectors:
        legend_items.append(Line2D([], [], marker='o', linestyle='None', color='red', markersize=8, label="Rail Connector"))
    if used_end_clamps:
        legend_items.append(Line2D([], [], marker='o', linestyle='None', color='blue', markersize=8, label="End Clamp"))
    for rail_length in sorted(used_rails):
        legend_items.append(Line2D([0, 1], [0, 0], color=rail_colors[rail_length], lw=4, label=f"Rail {rail_length}m"))

    if legend_items:
        ax.legend(handles=legend_items, loc="upper left", bbox_to_anchor=(-0.5, 1.05), borderaxespad=0, frameon=False)

    fig.subplots_adjust(left=0.15, top=0.55, bottom=0.15)
    
    rail_summary = summarize_rails(rails_used)
    end_clamps = len(end_clamp_positions)

    ax.set_xlim(0, roof_length)
    ax.set_ylim(0, roof_width)
    ax.set_aspect('equal', adjustable='box')
    ax.set_title(f"Solar Panel Layout (Total Panels: {total_panels})", fontsize=14, pad=20)

    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    img_data = base64.b64encode(buf.getvalue()).decode("utf-8")
    buf.close()
    plt.close(fig)
    return img_data, total_panels, rails_used, rail_summary, rail_connectors, end_clamps, middle_clamp_count, None

def select_rail_combination(required_length, rail_sizes):
    rail_sizes = sorted(rail_sizes)
    for num_rails in range(1, len(rail_sizes) + 1):
        for combination in combinations_with_replacement(rail_sizes, num_rails):
            if sum(combination) >= required_length:
                return combination
    return [rail_sizes[0]] * ((required_length + rail_sizes[0] - 1) // rail_sizes[0])

def summarize_rails(rails_used):
    rail_count = {}
    for rail_combination in rails_used:
        for rail in rail_combination:
            rail_count[rail] = rail_count.get(rail, 0) + 1
    for rail in rail_count:
        rail_count[rail] *= 2
    return rail_count

@program4_bp.route("/")
def home():
    return render_template("index4.html")

@program4_bp.route("/generate", methods=["POST"])
def generate():
    #assert False, "⚠️ This generate() was actually called!"
    print("🚀 Flask รับ request แล้วจ้า!", flush=True)
    #raise Exception("💥 Boom! Just to prove this is the right route!")
    try:
        data = request.get_json()
        print("📥 JSON ที่ Flask ได้รับ:", data)
        roof_width = float(data["width"])
        roof_length = float(data["length"])
        num_panels_requested = float(data["numPanels"])
        center_align = data.get("centerAlign", False)
        panel_width = float(data["panelLength"])  # รับ length มาใส่ width
        panel_length = float(data["panelWidth"])  # รับ width มาใส่ length



        if not float(num_panels_requested).is_integer():
            return jsonify({"error": "กรุณาใส่จำนวนแผงเป็นจำนวนเต็มเท่านั้นจ้ะ"}), 400
        if panel_width <= 0 or panel_length <= 0:
            return jsonify({"error": "ขนาดของแผงต้องมากกว่า 0"}), 400

        num_panels_requested = int(num_panels_requested)

        result = generate_plot(
            roof_width,
            roof_length,
            num_panels_requested,
            center_align,
            panel_width,
            panel_length
        )

        plot_url, total_panels, rails_used, rail_summary, rail_connectors, end_clamps, middle_clamp_count, error_message = result

        if error_message:
            return jsonify({"error": error_message, "max_panels": total_panels}), 400

        if rail_summary is None:
            rail_summary = {}

        return jsonify({
            "plot_url": plot_url,
            "total_panels": total_panels,
            "rail_summary": rail_summary,
            "rail_connector_count": rail_connectors,
            "end_clamp_count": end_clamps,
            "middle_clamp_count": middle_clamp_count
        })

    except KeyError as ke:
        print("❌ ข้อมูลไม่ครบ:", str(ke))
        return jsonify({"error": f"ขาดข้อมูล: {str(ke)}"}), 400
    except Exception as e:
        print("❌ เกิดข้อผิดพลาดใน generate():", str(e))
        return jsonify({"error": "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"}), 500