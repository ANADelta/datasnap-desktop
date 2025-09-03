from flask import Blueprint
from flask_socketio import SocketIO

# Create the shared instances here, BEFORE importing the routes.
# This makes them available to all route files in this package.
socketio = SocketIO(cors_allowed_origins="*")
api_blueprint = Blueprint('api', __name__)

# Now, import all the route files. They can now access the 'socketio' instance above.
from . import data_routes, cleaning_routes, analysis_routes, transform_routes, history_routes, session_routes, ai_routes