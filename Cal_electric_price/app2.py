from flask import Blueprint, render_template, request, redirect, url_for, session

program2_bp = Blueprint(
    'Cal_electric_price', __name__,
    template_folder='../templates',
    static_folder='../static'
)

def calculate_electricity_bill(units):
    rates = [
        (150, 3.2484),
        (250, 4.2218),
        (float('inf'), 4.4217)
    ]

    total_cost = 0
    for limit, rate in rates:
        used = min(units, limit)
        total_cost += used * rate
        units -= used
        if units <= 0:
            break

    total_with_vat = total_cost * 1.07
    return round(total_with_vat, 2)

@program2_bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':

        current_month = int(request.form.get('current_month', 1))
        current_units = int(request.form.get('current_units', 0))
        month_count = int(request.form.get('month_count', 0))
        reduce_type = request.form.get('reduce_type', None)

        reduce_units = request.form.get('reduce_units', "0")
        reduce_money = request.form.get('reduce_money', "0")

        reduce_units = int(reduce_units) if reduce_units.isdigit() else 0
        try:
            reduce_money = float(reduce_money) if reduce_money.replace('.', '', 1).isdigit() else 0.0
        except ValueError:
            reduce_money = 0.0

        enable_history = 'enable_history' in request.form

        month_labels = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

        month_units = []

        if enable_history:
            for i in range(1, month_count + 1):
                month_index = (current_month - i + 11) % 12
                month_name = month_labels[month_index]
                units = request.form.get(f'month{i}', "0")
                units = int(units) if units.isdigit() else 0
                month_units.append((month_name, units))

        month_units = [(month_labels[current_month - 1], current_units)] + month_units

        month_names = [item[0] for item in month_units]
        previous_units = [item[1] for item in month_units]

        individual_costs = [calculate_electricity_bill(units) for units in previous_units]

        total_units = sum(previous_units)
        total_cost = sum(individual_costs)

        new_units = total_units
        new_cost = total_cost
        reduced_units = 0

        if enable_history and month_count > 0:
            total_months = month_count + 1
            avg_units_per_month = total_units / total_months
            avg_cost_per_month = total_cost / total_months
        else:
            total_months = 1
            avg_units_per_month = current_units
            avg_cost_per_month = total_cost

        if reduce_type == "unit":
            new_units = max(0, avg_units_per_month - reduce_units)
            new_cost = calculate_electricity_bill(new_units)

        elif reduce_type == "money":
            target_avg_cost = avg_cost_per_month - reduce_money
            new_avg_units = find_units_from_cost(target_avg_cost)
            new_cost = calculate_electricity_bill(new_avg_units)

            reduced_units = avg_units_per_month - new_avg_units
            actual_money_saved = avg_cost_per_month - new_cost

            new_units = new_avg_units

        session['data'] = {
            'month_names': month_names,
            'previous_units': previous_units,
            'individual_costs': individual_costs,
            'month_count': month_count,
            'current_month': current_month,
            'reduce_type': reduce_type,
            'reduce_units': reduce_units,
            'reduce_money': reduce_money,
            'reduced_units': reduced_units,
            'new_units': new_units,
            'new_cost': new_cost,
            'enable_history': enable_history,
            'target_avg_cost': target_avg_cost if reduce_type == "money" else 0.0,
            'target_avg_units': new_avg_units if reduce_type == "money" else 0.0,
            'cost_at_target_units': new_cost if reduce_type == "money" else 0.0,
            'actual_money_saved': actual_money_saved if reduce_type == "money" else 0.0
        }

        session['form_data'] = {
            'current_month': current_month,
            'current_units': current_units,
            'month_count': month_count,
            'enable_history': enable_history,
            'reduce_type': reduce_type,
            'reduce_units': reduce_units,
            'reduce_money': reduce_money,
            'previous_units': previous_units[1:]
        }

        return redirect(url_for('Cal_electric_price.index'))

    if 'form_data' not in session:
        session.clear()

    data = session.get('data', {
        'month_names': [],
        'previous_units': [],
        'individual_costs': [],
        'month_count': 0,
        'current_month': 1,
        'reduce_type': None,
        'reduce_units': 0,
        'reduce_money': 0.0,
        'reduced_units': 0,
        'new_units': 0,
        'new_cost': 0.0,
        'enable_history': False,
        'target_avg_cost': 0.0,
        'target_avg_units': 0.0,
        'cost_at_target_units': 0.0,
        'actual_money_saved': 0.0
    })
    form_data = session.get('form_data', None)

    if data["previous_units"] and data["individual_costs"]:
        data["avg_units"] = sum(data["previous_units"]) / len(data["previous_units"])
        data["avg_cost"] = sum(data["individual_costs"]) / len(data["individual_costs"])
    else:
        data["avg_units"], data["avg_cost"] = 0, 0

    return render_template('index2.html', **data, form_data=form_data)

def find_units_from_cost(target_cost):
    test_units = 0
    while calculate_electricity_bill(test_units) < target_cost and test_units < 1000:
        test_units += 1
    return max(0, test_units - 1)

@program2_bp.route('/reset', methods=['GET'])
def reset():
    session.clear()
    return redirect(url_for('Cal_electric_price.index'))
