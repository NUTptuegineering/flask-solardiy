from flask import Flask, render_template, request

app = Flask(__name__)

def calculate_electricity_bill(units):
    rates = [
        (15, 2.3488),
        (10, 2.9882),
        (10, 3.2405),
        (65, 3.6237),
        (50, 3.7171),
        (250, 4.2218),
        (150, 4.4217)
    ]
    
    remaining_units = units
    total_cost = 0
    
    for limit, rate in rates:
        if remaining_units > 0:
            used_units = min(remaining_units, limit)
            total_cost += used_units * rate
            remaining_units -= used_units
        else:
            break
    
    if remaining_units > 0:
        total_cost += remaining_units * 4.4217
    
    return round(total_cost, 2)

@app.route('/', methods=['GET', 'POST'])
def index():
    total_cost = 0
    individual_costs = []
    month_names = []
    
    if request.method == 'POST':
        month_count = int(request.form.get('month_count', 1))
        current_month = int(request.form.get('current_month', 1))
        month_labels = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
        
        for i in range(month_count):
            month_index = (current_month - 1 - i + 12) % 12
            month_names.append(month_labels[month_index])
            units = int(request.form.get(f'month{i + 1}', 0))
            cost = calculate_electricity_bill(units)
            cost_with_vat = cost * 1.07  # คำนวณค่าไฟของแต่ละเดือนพร้อม VAT
            individual_costs.append(round(cost_with_vat, 2))
            total_cost += cost_with_vat
    
    return render_template('index.html', total_cost=round(total_cost, 2), individual_costs=individual_costs, month_names=month_names)

if __name__ == '__main__':
    app.run(debug=True, port=8080)
