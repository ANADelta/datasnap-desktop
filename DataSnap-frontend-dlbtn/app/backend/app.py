import os
import uuid
from flask import Flask, send_from_directory
from flask_socketio import SocketIO
# Import BOTH the blueprint AND the shared socketio instance from the api package
from api import api_blueprint, socketio

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['MAIN_DF'] = None
app.config['FILENAME'] = None
app.config['HISTORY_TRACKER'] = None
app.config['UPLOAD_ID'] = None

# Initialize the imported socketio instance with our Flask app.
# The CORS settings are already handled from its creation in api/__init__.py
socketio.init_app(app)

# Register the single blueprint that contains all API routes
app.register_blueprint(api_blueprint, url_prefix='/api')

# Serve static files for the frontend
@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# The connect and disconnect handlers are fine here as they use the initialized socketio instance
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# The main 'chat_message' handler is now correctly located in ai_routes.py

if __name__ == '__main__':
    # Create necessary directories on startup
    os.makedirs('temp_uploads', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    # Run the Flask-SocketIO development server
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)