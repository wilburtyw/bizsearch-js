from flask import Flask, request, send_from_directory, render_template
import requests
import json

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__)

# Initialize Static HTML
@app.route("/")
def index():
    return render_template("index.html")
# Initialize Static CSS and JS
@app.route('/static/<path:path>')
def send_report(path):
    return send_from_directory('static', path)

# Fetch Yelp API
@app.route('/bizsubmit', methods=['GET'])
def fetchYelp():
	if request.method == "GET":
		headers = {"Authorization": "Bearer PMLBKGC8K4npV14Ncjme5xaxPrEoAi4D3QPm9qcHPt-nWjTrT-BtaMugRt-HoqYRqgtSav0nn08Czdru-_xEig3v3tU4M4X02K2_sbjOyKoONx54w9_WeN10_eMjY3Yx"}
		response = requests.get('https://api.yelp.com/v3/businesses/search?', headers=headers, params=request.values)
		response_json = response.json()
	return response_json
		# params = "term=" + request.args['term'] + "&latitude=" + request.args['lat'] + "&longitude=" + request.args['lng']
		# if request.args["radius"] != "":
		# 	r = str(int(request.args['radius']) * 1609)
		# 	params = params + "&radius=" + r
		# if request.args['category'] != "Default":
		# 	params = params + "&categories=" + request.args['category']
		# headers = {"Authorization": "Bearer PMLBKGC8K4npV14Ncjme5xaxPrEoAi4D3QPm9qcHPt-nWjTrT-BtaMugRt-HoqYRqgtSav0nn08Czdru-_xEig3v3tU4M4X02K2_sbjOyKoONx54w9_WeN10_eMjY3Yx"}
		# response = requests.get('https://api.yelp.com/v3/businesses/search?' + params, headers=headers)
		# return request

@app.route('/getdetail', methods=['GET'])
def fetchYelpD():
	if request.method == "GET":
		headers = {"Authorization": "Bearer PMLBKGC8K4npV14Ncjme5xaxPrEoAi4D3QPm9qcHPt-nWjTrT-BtaMugRt-HoqYRqgtSav0nn08Czdru-_xEig3v3tU4M4X02K2_sbjOyKoONx54w9_WeN10_eMjY3Yx"}
		response = requests.get('https://api.yelp.com/v3/businesses/' + request.args["id"], headers=headers)
		responseD_json = response.json()
	return responseD_json

if __name__ == '__main__':
    # This is used when running locally only.
    app.run(host='127.0.0.1', port=8080, debug=True)
