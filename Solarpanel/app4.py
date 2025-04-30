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
import matplotlib.gridspec as gridspec

program4_bp = Blueprint(
    'Solarpanel', __name__,
    template_folder='../templates',
    static_folder='../static'
)

def generate_plot(roof_width, roof_length, num_panels_requested, center_align, panel_width, panel_length):
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    import matplotlib.gridspec as gridspec
    from matplotlib.lines import Line2D
    from itertools import combinations_with_replacement
    import io
    import base64

    margin_width = 0.3
    margin_length = 0.5
    spacing = 0.02
    row_spacing = 0.3
    rail_sizes = [2.1, 2.4, 4.2, 4.8]
    rail_colors = {2.1: "#a9a9a9", 2.4: "#cd853f", 4.2: "#8b4513", 4.8: "#696969"}
    rail_margin_x = 0.2
    rail_margin_y = 0.2

    usable_width = roof_width - 2 * (margin_width + rail_margin_y)
    usable_length = roof_length - 2 * (margin_length + rail_margin_x)

    max_panels_along_width = int(usable_width // panel_width)
    max_panels_along_length = int(usable_length // panel_length)

    total_panels = min(max_panels_along_width * max_panels_along_length, num_panels_requested)
    print(f"🧮 max แผงที่วางได้: {max_panels_along_width * max_panels_along_length}, ผู้ใช้ขอ: {num_panels_requested}, วางจริง: {total_panels}")
    max_possible_panels = max_panels_along_width * max_panels_along_length
    warning_message = None
    if num_panels_requested > max_possible_panels:
        warning_message = f"คุณใส่ {num_panels_requested} แผง แต่หลังคาวางได้สูงสุด {max_possible_panels} แผง ระบบจะวางให้ {max_possible_panels} แผงแทน"

    total_panels = min(max_possible_panels, num_panels_requested)


    if total_panels == 0:
        return None, 0, 0, None, None, 0, 0, "ขนาดหลังคาไม่เพียงพอสำหรับการวางแผง"

    rows = min(max_panels_along_width, (total_panels + max_panels_along_length - 1) // max_panels_along_length)
    panels_per_row = [(total_panels // rows)] * rows
    for i in range(total_panels % rows):
        panels_per_row[i] += 1

    fig = plt.figure(figsize=(14, 8))
    gs = gridspec.GridSpec(1, 2, width_ratios=[1, 4])
    legend_ax = fig.add_subplot(gs[0])
    layout_ax = fig.add_subplot(gs[1])

    layout_ax.add_patch(patches.Rectangle((0, 0), roof_length, roof_width, edgecolor='blue', facecolor='lightblue', lw=2))

    font_size = max(10, min(18, max(roof_width, roof_length) * 0.02))
    offset = max(roof_width, roof_length) * 0.06
    layout_ax.text(roof_length / 2, -offset, f"Length: {roof_length}m", ha='center', fontsize=font_size, color='black')
    layout_ax.text(-offset, roof_width / 2, f"Width: {roof_width}m", va='center', rotation=90, fontsize=font_size, color='black')

    # เตรียมตัวแปร
    rails_used = []
    connector_positions = []
    end_clamp_positions = []
    middle_clamp_positions = []
    middle_clamp_count = 0
    rail_connectors = 0

    start_y = (roof_width - (rows * panel_width + (rows - 1) * row_spacing)) / 2 if center_align else margin_width + rail_margin_y
    rail_offset = panel_width * 0.15

    for i, panels_in_this_row in enumerate(panels_per_row):
        start_x = (roof_length - (panels_in_this_row * (panel_length + spacing) - spacing)) / 2 if center_align else margin_length + rail_margin_x

        panel_y_top = start_y + i * (panel_width + row_spacing) + panel_width - rail_offset
        panel_y_bottom = start_y + i * (panel_width + row_spacing) + rail_offset

        required_rail_length = panels_in_this_row * (panel_length + spacing) - spacing
        rail_combination = list(select_rail_combination(required_rail_length, rail_sizes))  # ⭐⭐⭐ ตรงนี้แปลงเป็น list ไปเลย
        rails_used.append(rail_combination)

        # จุดวางราง
        rail_start_x = start_x + (required_rail_length - sum(rail_combination)) / 2
        current_x = rail_start_x
        for rail_length in rail_combination:
            color = rail_colors.get(rail_length, "#000000")
            layout_ax.plot([current_x, current_x + rail_length], [panel_y_top, panel_y_top], color=color, lw=2)
            layout_ax.plot([current_x, current_x + rail_length], [panel_y_bottom, panel_y_bottom], color=color, lw=2)
            current_x += rail_length

        # จุด connector ถ้ามีต่อราง
        if len(rail_combination) > 1:
            connector_positions += [
                (rail_start_x + sum(rail_combination[:k]), panel_y_top)
                for k in range(1, len(rail_combination))
            ] + [
                (rail_start_x + sum(rail_combination[:k]), panel_y_bottom)
                for k in range(1, len(rail_combination))
            ]
            rail_connectors += 2 * (len(rail_combination) - 1)

        # จุดแผง และ clamp
        for j in range(panels_in_this_row):
            panel_x = start_x + j * (panel_length + spacing)
            panel_y = start_y + i * (panel_width + row_spacing)
            layout_ax.add_patch(patches.Rectangle((panel_x, panel_y), panel_length, panel_width,
                                                  edgecolor='green', facecolor='lightgreen', lw=1))
            if j < panels_in_this_row - 1:
                middle_x = panel_x + panel_length
                middle_clamp_positions.append((middle_x, panel_y_top))
                middle_clamp_positions.append((middle_x, panel_y_bottom))
                middle_clamp_count += 2

        # End clamp
        first_panel_x = start_x
        last_panel_x = start_x + (panels_in_this_row - 1) * (panel_length + spacing)
        end_clamp_positions.extend([
            (first_panel_x, panel_y_top),
            (last_panel_x + panel_length, panel_y_top),
            (first_panel_x, panel_y_bottom),
            (last_panel_x + panel_length, panel_y_bottom)
        ])

    # ตำแหน่ง Marker
    for x, y in middle_clamp_positions:
        layout_ax.scatter(x, y, color='black', s=50)
    for x, y in connector_positions:
        layout_ax.scatter(x, y, color='red', s=50)
    for x, y in end_clamp_positions:
        layout_ax.scatter(x, y, color='blue', s=50)

    # Legend
    legend_items = [
        Line2D([], [], marker='o', linestyle='None', color='black', markersize=8, label="Middle Clamp"),
        Line2D([], [], marker='o', linestyle='None', color='red', markersize=8, label="Rail Connector"),
        Line2D([], [], marker='o', linestyle='None', color='blue', markersize=8, label="End Clamp"),
    ]
    for rail in sorted(rail_colors.keys()):
        legend_items.append(Line2D([0, 1], [0, 0], color=rail_colors[rail], lw=4, label=f"Rail {rail}m"))

    legend_ax.axis('off')
    legend_ax.legend(handles=legend_items, loc='center', frameon=False)

    layout_ax.set_xlim(0, roof_length)
    layout_ax.set_ylim(0, roof_width)
    layout_ax.set_aspect('equal')
    layout_ax.set_title(f"Solar Panel Layout (Total Panels: {total_panels})", fontsize=14)

    fig.subplots_adjust(left=0.05, right=0.95, top=0.92, bottom=0.08)

    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    img_data = base64.b64encode(buf.getvalue()).decode('utf-8')
    plt.close(fig)

    rail_summary = summarize_rails(rails_used)

    return img_data, total_panels, rails_used, rail_summary, rail_connectors, len(end_clamp_positions), middle_clamp_count, warning_message

# ช่วย function ย่อย
def select_rail_combination(required_length, rail_sizes):
    rail_sizes = sorted(rail_sizes)
    for num_rails in range(1, len(rail_sizes) + 1):
        for combo in combinations_with_replacement(rail_sizes, num_rails):
            if sum(combo) >= required_length:
                return combo
    return [rail_sizes[0]] * (required_length // rail_sizes[0] + 1)

def summarize_rails(rails_used):
    summary = {}
    for comb in rails_used:
        for rail in comb:
            summary[rail] = summary.get(rail, 0) + 2  # x2 เพราะวางรางคู่
    return summary


def select_rail_combination(required_length, rail_sizes):
    rail_sizes = sorted(rail_sizes)
    for num_rails in range(1, len(rail_sizes) + 1):
        for combination in combinations_with_replacement(rail_sizes, num_rails):
            if sum(combination) >= required_length:
                return combination
    return [rail_sizes[0]] * ((required_length + rail_sizes[0] - 1) // rail_sizes[0])


def summarize_rails(rails_used):
    rail_count = {}
    for combination in rails_used:
        for rail in combination:
            rail_count[rail] = rail_count.get(rail, 0) + 2  # 2 เส้นต่อแถว
    return rail_count

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
        panel_width = float(data["panelLength"])
        panel_length = float(data["panelWidth"])



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

        plot_url, total_panels, rails_used, rail_summary, rail_connectors, end_clamps, middle_clamp_count, warning_message = result

        if rail_summary is None:
            rail_summary = {}

        return jsonify({
            "plot_url": plot_url,
            "total_panels": total_panels,
            "rail_summary": rail_summary,
            "rail_connector_count": rail_connectors,
            "end_clamp_count": end_clamps,
            "middle_clamp_count": middle_clamp_count,
            "warning": warning_message  # ✅ เพิ่มตรงนี้
        })


    except KeyError as ke:
        print("❌ ข้อมูลไม่ครบ:", str(ke))
        return jsonify({"error": f"ขาดข้อมูล: {str(ke)}"}), 400
    except Exception as e:
        print("❌ เกิดข้อผิดพลาดใน generate():", str(e))
        return jsonify({"error": "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"}), 500