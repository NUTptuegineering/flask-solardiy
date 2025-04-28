from flask import Flask, render_template, request
from Project_Estimation import program1_bp
from Cal_electric_price import program2_bp
from ROI_Cal import program3_bp
from Solarpanel import program4_bp
import os

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = 'secret'

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/Cal_electric_price", methods=["GET", "POST"], strict_slashes=False)
def index2():
    if request.method == "POST":
        month_count = int(request.form.get("month_count", 12))
    else:
        month_count = 12

    # ส่งค่า month_names ด้วย
    month_names = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                   "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
    
    return render_template("index2.html", month_count=month_count, month_names=month_names)



@app.route('/ROI_Cal')
def index3():
    return render_template('index3.html')

app.register_blueprint(program1_bp)
app.register_blueprint(program2_bp, url_prefix='/Cal_electric_price')
app.register_blueprint(program3_bp, url_prefix='/ROI_Cal')
app.register_blueprint(program4_bp, url_prefix='/Solarpanel')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('FLASK_RUN_PORT', 5000)))
    app.run(host='0.0.0.0', port=port, debug=True)
