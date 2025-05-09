from flask import Blueprint, render_template, request, redirect, url_for, session

program3_bp = Blueprint('ROI_Cal', __name__, template_folder='../templates', static_folder='../static')

program3_bp.secret_key = 'your-secret-key'

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

@program3_bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST' and 'cost' in request.form:
        cost = safe_float(request.form.get('cost'))
        size = safe_float(request.form.get('size'))
        gen = safe_float(request.form.get('gen'))
        rate = safe_float(request.form.get('rate'))
        lifetime = int(safe_float(request.form.get('lifetime')))

        gen_per_year = size * gen
        total_save = gen_per_year * rate * lifetime
        payback = round(cost / (gen_per_year * rate), 2) if gen_per_year * rate != 0 else 0
        profit = round(total_save - cost, 2)
        roi = round((profit / cost) * 100, 2) if cost != 0 else 0

        session['result'] = {
            'cost': f"{cost:,.2f}",
            'size': f"{size:,.2f}",
            'gen_per_year': f"{gen_per_year:,.2f}",
            'total_save': f"{total_save:,.2f}",
            'payback': payback,
            'profit': f"{profit:,.2f}",
            'roi': roi
        }
        session['gen'] = gen
        session['rate'] = rate
        session['lifetime'] = lifetime
        session['cost'] = cost
        session['size'] = size

        return redirect(url_for('ROI_Cal.index'))

    result = session.pop('result', None)
    cost = session.pop('cost', None)
    size = session.pop('size', None)
    gen = session.pop('gen', None)
    rate = session.pop('rate', None)
    lifetime = session.pop('lifetime', None)

    return render_template(
        'index3.html',
        result=result,
        cost=cost,
        size=size,
        rate=rate,
        lifetime=lifetime,
        gen=gen
    )
