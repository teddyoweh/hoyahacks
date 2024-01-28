from flask import render_template, Blueprint, request,jsonify,send_file,abort
import audioread
from flask_cors import CORS,cross_origin
from audio_model import audio_model
import os
import tempfile
import base64
import wave
import pyaudio
import binascii
import requests
import soundfile as sf  # Make sure to install the 'soundfile' library
import io
import wavio
import random
import string
from datetime import datetime

def generate_random_string(length):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    characters = string.ascii_letters + string.digits + string.punctuation
    random_string = ''.join(random.choice(characters) for _ in range(length - len(timestamp)))
    random_string = timestamp + random_string
    return random_string

blueprint = Blueprint('pages', __name__)

def enable_cors(route_function):
    return CORS(route_function)

CORS(blueprint)



@blueprint.route('/')
@cross_origin(origin='*',headers=['Authorization'])
def home():
    return jsonify({'message': 'Hello World!'})


 
@blueprint.route('/audio_record', methods=['POST'])
@cross_origin(origin='*',headers=['Authorization', 'Content-Type', 'Accept','Access-Control-Allow-Origin'])
def upload_audio():
    data = request.get_json()
    print(data)
    text = data.get('text')

    model = audio_model()
    rxs = generate_random_string(20)
    cx = model.generate_speech(text,rxs)
    return jsonify({"message": "Audio file uploaded successfully","filename":f"audio/{rxs}.mp3","title":cx['title'],"answer":cx["answer"]}), 200

@blueprint.route('/audio/<filename>')
def get_mp3(filename):
  
    mp3_file_path = os.path.join("audio", filename)
    print(mp3_file_path)
    
    # if os.path.isfile(mp3_file_path):
    return send_file(mp3_file_path, as_attachment=True)
    # else:
    #     abort(404)  
 