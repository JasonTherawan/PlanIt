from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, time
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database connection parameters
load_dotenv()
DB_HOST = "localhost"
DB_NAME = "planit"
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = "5432"

def get_db_connection():
    """Create and return a database connection"""
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        port=DB_PORT
    )
    return conn

def format_time_to_hhmm(time_obj):
    """Convert time object to HH:MM format string"""
    if time_obj is None:
        return None
    if isinstance(time_obj, str):
        # If it's already a string, parse it and reformat
        try:
            parsed_time = datetime.strptime(time_obj, '%H:%M:%S').time()
            return parsed_time.strftime('%H:%M')
        except ValueError:
            try:
                # Try HH:MM format
                parsed_time = datetime.strptime(time_obj, '%H:%M').time()
                return parsed_time.strftime('%H:%M')
            except ValueError:
                return time_obj  # Return as-is if can't parse
    return time_obj.strftime('%H:%M')

def parse_time_from_hhmm(time_str):
    """Parse HH:MM format string to time object"""
    if not time_str:
        return None
    try:
        # Handle both HH:MM and HH:MM:SS formats
        if len(time_str.split(':')) == 2:
            return datetime.strptime(time_str, '%H:%M').time()
        else:
            return datetime.strptime(time_str, '%H:%M:%S').time()
    except ValueError:
        return None

@app.route('/api/register', methods=['POST'])
def register():
    """Handle user registration"""
    # Get data from request
    data = request.get_json()
    
    # Extract user information
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    dob = data.get('dob')  # Optional
    google_id = data.get('googleId')  # For Google OAuth users
    
    # Validate required fields
    if not username or not email:
        return jsonify({'success': False, 'message': 'Username and email are required'}), 400
    
    # For non-Google users, password is required
    if not google_id and not password:
        return jsonify({'success': False, 'message': 'Password is required for non-Google users'}), 400
    
    # Validate email format (basic check)
    if '@' not in email or '.' not in email:
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400
    
    # Validate password length for non-Google users
    if not google_id and len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
    
    # Hash the password for security (only for non-Google users)
    hashed_password = generate_password_hash(password) if password else None
    
    # Parse date of birth if provided
    parsed_dob = None
    if dob:
        try:
            parsed_dob = datetime.strptime(dob, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid date format for date of birth'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if email already exists
        cur.execute("SELECT UserEmail FROM Users WHERE UserEmail = %s", (email,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'Email already registered'}), 409
        
        # Check if Google ID already exists (for Google users)
        if google_id:
            cur.execute("SELECT GoogleId FROM Users WHERE GoogleId = %s", (google_id,))
            if cur.fetchone():
                return jsonify({'success': False, 'message': 'Google account already registered'}), 409
        
        # Insert new user with Google ID support
        if google_id:
            # For Google users, password can be NULL
            cur.execute(
                """
                INSERT INTO Users (UserName, UserEmail, UserDOB, GoogleId)
                VALUES (%s, %s, %s, %s)
                RETURNING UserId
                """,
                (username, email, parsed_dob, google_id)
            )
        else:
            # For regular users, password is required
            cur.execute(
                """
                INSERT INTO Users (UserName, UserEmail, UserPassword, UserDOB)
                VALUES (%s, %s, %s, %s)
                RETURNING UserId
                """,
                (username, email, hashed_password, parsed_dob)
            )
        
        # Get the new user ID
        user_id = cur.fetchone()[0]
        
        # Commit the transaction
        conn.commit()
        
        # Close cursor
        cur.close()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'userId': str(user_id)  # Convert to string to handle large numbers
        }), 201
        
    except psycopg2.errors.UniqueViolation:
        # Handle duplicate email or Google ID
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': 'Email or Google account already registered'}), 409
    
    except Exception as e:
        # Handle other errors
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Registration failed', 'error': str(e)}), 500
    
    finally:
        # Close connection
        if conn:
            conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    # Get data from request
    data = request.get_json()
    
    # Extract login credentials
    email = data.get('email')
    password = data.get('password')
    google_id = data.get('googleId')  # For Google OAuth users
    
    # Validate required fields
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400

    # Either googleId OR password must be provided, but not both
    if google_id and password:
        return jsonify({'success': False, 'message': 'Cannot provide both Google ID and password'}), 400

    if not google_id and not password:
        return jsonify({'success': False, 'message': 'Either Google authentication or password is required'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if google_id:
            # Google OAuth login
            cur.execute("SELECT UserId, UserName, UserEmail FROM Users WHERE GoogleId = %s", (google_id,))
            user = cur.fetchone()
            
            if user:
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'id': str(user[0]),  # Convert to string to handle large numbers
                        'userId': str(user[0]),
                        'username': user[1],
                        'email': user[2],
                        'isGoogleUser': True
                    }
                }), 200
            else:
                return jsonify({'success': False, 'message': 'Google account not found. Please register first.'}), 401
        else:
            # Regular email/password login
            cur.execute("SELECT UserId, UserName, UserEmail, UserPassword FROM Users WHERE UserEmail = %s", (email,))
            user = cur.fetchone()
            
            # Check if user exists and password is correct
            if user and user[3] and check_password_hash(user[3], password):
                # Return user info (excluding password)
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'id': str(user[0]),  # Convert to string to handle large numbers
                        'userId': str(user[0]),
                        'username': user[1],
                        'email': user[2],
                        'isGoogleUser': False
                    }
                }), 200
            else:
                return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Login failed', 'error': str(e)}), 500
    
    finally:
        # Close connection
        if conn:
            conn.close()

@app.route('/api/activities', methods=['POST'])
def create_activity():
    """Create a new activity"""
    # Get data from request
    data = request.get_json()
    
    # Extract activity information
    user_id = data.get('userId')
    title = data.get('activityTitle')
    description = data.get('activityDescription')
    category = data.get('activityCategory')
    urgency = data.get('activityUrgency')
    date = data.get('activityDate')
    start_time = data.get('activityStartTime')
    end_time = data.get('activityEndTime')
    
    # Validate required fields
    if not user_id or not title or not date:
        return jsonify({'success': False, 'message': 'User ID, title, and date are required'}), 400

    # Parse time fields
    parsed_start_time = parse_time_from_hhmm(start_time) if start_time else None
    parsed_end_time = parse_time_from_hhmm(end_time) if end_time else None

    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new activity - use string user_id directly
        cur.execute(
            """
            INSERT INTO Activity (ActivityTitle, ActivityDescription, ActivityCategory, 
                                 ActivityUrgency, ActivityDate, ActivityStartTime, 
                                 ActivityEndTime, UserId)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING ActivityId
            """,
            (title, description, category, urgency, date, parsed_start_time, parsed_end_time, user_id)
        )
        
        # Get the new activity ID
        activity_id = cur.fetchone()[0]
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Activity created successfully',
            'activityId': activity_id
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create activity', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/activities', methods=['GET'])
def get_activities():
    """Get activities for a user"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get activities for the user - use string comparison for user_id
        cur.execute(
            """
            SELECT ActivityId, ActivityTitle, ActivityDescription, ActivityCategory,
                   ActivityUrgency, ActivityDate, ActivityStartTime, ActivityEndTime
            FROM Activity 
            WHERE UserId = %s
            ORDER BY ActivityDate, ActivityStartTime
            """,
            (user_id,)
        )
        
        activities = []
        for row in cur.fetchall():
            activities.append({
                'activityid': row[0],
                'activitytitle': row[1],
                'activitydescription': row[2],
                'activitycategory': row[3],
                'activityurgency': row[4],
                'activitydate': row[5].isoformat() if row[5] else None,
                'activitystarttime': format_time_to_hhmm(row[6]),
                'activityendtime': format_time_to_hhmm(row[7])
            })
        
        return jsonify({
            'success': True,
            'activities': activities
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch activities', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/activities/<int:activity_id>', methods=['PUT'])
def update_activity(activity_id):
    """Update an existing activity"""
    # Get data from request
    data = request.get_json()
    
    # Extract activity information
    title = data.get('activityTitle')
    description = data.get('activityDescription')
    category = data.get('activityCategory')
    urgency = data.get('activityUrgency')
    date = data.get('activityDate')
    start_time = data.get('activityStartTime')
    end_time = data.get('activityEndTime')
    
    # Validate required fields
    if not title or not date:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400
    
    # Parse time fields
    parsed_start_time = parse_time_from_hhmm(start_time) if start_time else None
    parsed_end_time = parse_time_from_hhmm(end_time) if end_time else None

    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update activity
        cur.execute(
            """
            UPDATE Activity 
            SET ActivityTitle = %s, ActivityDescription = %s, ActivityCategory = %s,
                ActivityUrgency = %s, ActivityDate = %s, ActivityStartTime = %s,
                ActivityEndTime = %s
            WHERE ActivityId = %s
            """,
            (title, description, category, urgency, date, parsed_start_time, parsed_end_time, activity_id)
        )
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Activity updated successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update activity', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/activities/<int:activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    """Delete an activity"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete activity
        cur.execute("DELETE FROM Activity WHERE ActivityId = %s", (activity_id,))
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Activity deleted successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete activity', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/goals', methods=['POST'])
def create_goal():
    """Create a new goal with timelines"""
    # Get data from request
    data = request.get_json()
    
    # Extract goal information
    user_id = data.get('userId')
    title = data.get('goalTitle')
    description = data.get('goalDescription')
    category = data.get('goalCategory')
    progress = data.get('goalProgress')
    timelines = data.get('timelines', [])
    
    # Validate required fields
    if not user_id or not title:
        return jsonify({'success': False, 'message': 'User ID and title are required'}), 400
    
    if not timelines:
        return jsonify({'success': False, 'message': 'At least one timeline is required'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new goal - use string user_id directly
        cur.execute(
            """
            INSERT INTO Goal (GoalTitle, GoalDescription, GoalCategory, GoalProgress, UserId)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING GoalId
            """,
            (title, description, category, progress, user_id)
        )
        
        # Get the new goal ID
        goal_id = cur.fetchone()[0]
        
        # Insert timelines
        timeline_ids = []
        for timeline in timelines:
            # Parse time fields
            start_time = parse_time_from_hhmm(timeline.get('timelineStartTime')) if timeline.get('timelineStartTime') else None
            end_time = parse_time_from_hhmm(timeline.get('timelineEndTime')) if timeline.get('timelineEndTime') else None
            
            cur.execute(
                """
                INSERT INTO Timeline (TimelineTitle, TimelineStartDate, TimelineEndDate, 
                                     TimelineStartTime, TimelineEndTime, GoalId)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING TimelineId
                """,
                (
                    timeline.get('timelineTitle'),
                    timeline.get('timelineStartDate'),
                    timeline.get('timelineEndDate'),
                    start_time,
                    end_time,
                    goal_id
                )
            )
            timeline_ids.append(cur.fetchone()[0])
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Goal created successfully',
            'goalId': goal_id,
            'timelineIds': timeline_ids
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create goal', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/goals', methods=['GET'])
def get_goals():
    """Get goals with timelines for a user"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get goals for the user - use string comparison for user_id
        cur.execute(
            """
            SELECT g.GoalId, g.GoalTitle, g.GoalDescription, g.GoalCategory, g.GoalProgress,
                   t.TimelineId, t.TimelineTitle, t.TimelineStartDate, t.TimelineEndDate,
                   t.TimelineStartTime, t.TimelineEndTime
            FROM Goal g
            LEFT JOIN Timeline t ON g.GoalId = t.GoalId
            WHERE g.UserId = %s
            ORDER BY g.GoalId, t.TimelineStartDate
            """,
            (user_id,)
        )
        
        goals_dict = {}
        for row in cur.fetchall():
            goal_id = row[0]
            if goal_id not in goals_dict:
                goals_dict[goal_id] = {
                    'goalid': row[0],
                    'goaltitle': row[1],
                    'goaldescription': row[2],
                    'goalcategory': row[3],
                    'goalprogress': row[4],
                    'timelines': []
                }
            
            if row[5]:  # If timeline exists
                goals_dict[goal_id]['timelines'].append({
                    'timelineid': row[5],
                    'timelinetitle': row[6],
                    'timelinestartdate': row[7].isoformat() if row[7] else None,
                    'timelineenddate': row[8].isoformat() if row[8] else None,
                    'timelinestarttime': format_time_to_hhmm(row[9]),
                    'timelineendtime': format_time_to_hhmm(row[10])
                })
        
        goals = list(goals_dict.values())
        
        return jsonify({
            'success': True,
            'goals': goals
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch goals', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    """Update an existing goal with timelines"""
    # Get data from request
    data = request.get_json()
    
    # Extract goal information
    title = data.get('goalTitle')
    description = data.get('goalDescription')
    category = data.get('goalCategory')
    progress = data.get('goalProgress')
    timelines = data.get('timelines', [])
    
    # Validate required fields
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400
    
    if not timelines:
        return jsonify({'success': False, 'message': 'At least one timeline is required'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update goal
        cur.execute(
            """
            UPDATE Goal 
            SET GoalTitle = %s, GoalDescription = %s, GoalCategory = %s, GoalProgress = %s
            WHERE GoalId = %s
            """,
            (title, description, category, progress, goal_id)
        )
        
        # Check if goal exists
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Goal not found'}), 404
        
        # Delete existing timelines
        cur.execute("DELETE FROM Timeline WHERE GoalId = %s", (goal_id,))
        
        # Insert new timelines
        timeline_ids = []
        for timeline in timelines:
            # Parse time fields
            start_time = parse_time_from_hhmm(timeline.get('timelineStartTime')) if timeline.get('timelineStartTime') else None
            end_time = parse_time_from_hhmm(timeline.get('timelineEndTime')) if timeline.get('timelineEndTime') else None
            
            cur.execute(
                """
                INSERT INTO Timeline (TimelineTitle, TimelineStartDate, TimelineEndDate, 
                                     TimelineStartTime, TimelineEndTime, GoalId)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING TimelineId
                """,
                (
                    timeline.get('timelineTitle'),
                    timeline.get('timelineStartDate'),
                    timeline.get('timelineEndDate'),
                    start_time,
                    end_time,
                    goal_id
                )
            )
            timeline_ids.append(cur.fetchone()[0])
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Goal updated successfully',
            'timelineIds': timeline_ids
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update goal', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    """Delete a goal and all its timelines"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete timelines first (due to foreign key constraint)
        cur.execute("DELETE FROM Timeline WHERE GoalId = %s", (goal_id,))
        
        # Delete goal
        cur.execute("DELETE FROM Goal WHERE GoalId = %s", (goal_id,))
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Goal not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Goal and all timelines deleted successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete goal', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/timelines/<int:timeline_id>', methods=['DELETE'])
def delete_timeline(timeline_id):
    """Delete a specific timeline"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if this is the last timeline for the goal
        cur.execute(
            """
            SELECT GoalId, COUNT(*) as timeline_count
            FROM Timeline 
            WHERE GoalId = (SELECT GoalId FROM Timeline WHERE TimelineId = %s)
            GROUP BY GoalId
            """,
            (timeline_id,)
        )
        
        result = cur.fetchone()
        if result and result[1] <= 1:
            return jsonify({'success': False, 'message': 'Cannot delete the last timeline. A goal must have at least one timeline.'}), 400
        
        # Delete timeline
        cur.execute("DELETE FROM Timeline WHERE TimelineId = %s", (timeline_id,))
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Timeline not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Timeline deleted successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete timeline', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/teams', methods=['POST'])
def create_team():
    """Create a new team with meetings and invitations"""
    # Get data from request
    data = request.get_json()
    
    # Extract team information
    created_by_user_id = data.get('createdByUserId')
    team_name = data.get('teamName')
    team_description = data.get('teamDescription')
    team_start_working_hour = data.get('teamStartWorkingHour')
    team_end_working_hour = data.get('teamEndWorkingHour')
    meetings = data.get('meetings', [])
    
    # Validate required fields
    if not created_by_user_id or not team_name:
        return jsonify({'success': False, 'message': 'Creator user ID and team name are required'}), 400
    
    if not meetings:
        return jsonify({'success': False, 'message': 'At least one meeting is required'}), 400
    
    # Parse working hours
    parsed_start_hour = parse_time_from_hhmm(team_start_working_hour) if team_start_working_hour else None
    parsed_end_hour = parse_time_from_hhmm(team_end_working_hour) if team_end_working_hour else None
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new team - use string user_id directly
        cur.execute(
            """
            INSERT INTO Team (TeamName, TeamDescription, TeamStartWorkingHour, 
                             TeamEndWorkingHour, CreatedByUserId)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING TeamId
            """,
            (team_name, team_description, parsed_start_hour, parsed_end_hour, created_by_user_id)
        )
        
        # Get the new team ID
        team_id = cur.fetchone()[0]
        
        # Add creator as team member
        cur.execute(
            """
            INSERT INTO TeamMembers (TeamId, UserId)
            VALUES (%s, %s)
            """,
            (team_id, created_by_user_id)
        )
        
        # Insert meetings and handle invitations
        meeting_ids = []
        for meeting in meetings:
            # Parse meeting times
            meeting_start_time = parse_time_from_hhmm(meeting.get('meetingStartTime')) if meeting.get('meetingStartTime') else None
            meeting_end_time = parse_time_from_hhmm(meeting.get('meetingEndTime')) if meeting.get('meetingEndTime') else None
            
            # Insert meeting with invitation type
            invitation_type = meeting.get('invitationType', 'mandatory')
            cur.execute(
                """
                INSERT INTO TeamMeeting (MeetingTitle, MeetingDescription, MeetingDate,
                                        MeetingStartTime, MeetingEndTime, TeamId, InvitationType)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING TeamMeetingId
                """,
                (
                    meeting.get('meetingTitle'),
                    meeting.get('meetingDescription'),
                    meeting.get('meetingDate'),
                    meeting_start_time,
                    meeting_end_time,
                    team_id,
                    invitation_type
                )
            )
            meeting_id = cur.fetchone()[0]
            meeting_ids.append(meeting_id)
            
            # Handle invited emails - find users and add them to team if they exist
            invited_emails = meeting.get('invitedEmails', [])
            for email in invited_emails:
                if email.strip():
                    # Check if user exists
                    cur.execute("SELECT UserId FROM Users WHERE UserEmail = %s", (email.strip(),))
                    user_result = cur.fetchone()
                    
                    if user_result:
                        user_id = str(user_result[0])  # Convert to string
                        # Add user to team if not already a member
                        cur.execute(
                            """
                            INSERT INTO TeamMembers (TeamId, UserId)
                            SELECT %s, %s
                            WHERE NOT EXISTS (
                                SELECT 1 FROM TeamMembers WHERE TeamId = %s AND UserId = %s
                            )
                            """,
                            (team_id, user_id, team_id, user_id)
                        )
                        
                        # Create meeting invitation
                        cur.execute(
                            """
                            INSERT INTO MeetingInvitations (MeetingId, UserId, InvitationType, Status)
                            VALUES (%s, %s, %s, %s)
                            """,
                            (meeting_id, user_id, invitation_type, 'accepted' if invitation_type == 'mandatory' else 'pending')
                        )
                        
                        # Create notification for request invitations
                        if invitation_type == 'request':
                            # Get meeting details for notification
                            meeting_time_info = ""
                            if meeting.get('meetingStartTime') and meeting.get('meetingEndTime'):
                                meeting_time_info = f" on {meeting.get('meetingDate')} from {meeting.get('meetingStartTime')} to {meeting.get('meetingEndTime')}"
                            elif meeting.get('meetingDate'):
                                meeting_time_info = f" on {meeting.get('meetingDate')}"
                            
                            notification_message = f'You have been invited to join the meeting "{meeting.get("meetingTitle")}"{meeting_time_info} in team "{team_name}"'
                            if meeting.get('meetingDescription'):
                                notification_message += f'. Description: {meeting.get("meetingDescription")}'
                            
                            cur.execute(
                                """
                                INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId)
                                VALUES (%s, %s, %s, %s, %s)
                                """,
                                (
                                    user_id,
                                    'meeting_invitation',
                                    f'Meeting Invitation: {meeting.get("meetingTitle")}',
                                    notification_message,
                                    meeting_id
                                )
                            )
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Team created successfully',
            'teamId': team_id,
            'meetingIds': meeting_ids
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create team', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/teams', methods=['GET'])
def get_teams():
    """Get teams and meetings for a user (only accepted meetings)"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get teams where user is a member with accepted meetings only
        cur.execute(
            """
            SELECT DISTINCT t.TeamId, t.TeamName, t.TeamDescription, 
                   t.TeamStartWorkingHour, t.TeamEndWorkingHour, t.CreatedByUserId,
                   tm.MeetingTitle, tm.MeetingDescription, tm.MeetingDate,
                   tm.MeetingStartTime, tm.MeetingEndTime, tm.TeamMeetingId, tm.InvitationType
            FROM Team t
            INNER JOIN TeamMembers tmem ON t.TeamId = tmem.TeamId
            LEFT JOIN TeamMeeting tm ON t.TeamId = tm.TeamId
            LEFT JOIN MeetingInvitations mi ON tm.TeamMeetingId = mi.MeetingId AND mi.UserId = %s
            WHERE tmem.UserId = %s 
            AND (tm.TeamMeetingId IS NULL OR mi.Status = 'accepted' OR t.CreatedByUserId = %s)
            ORDER BY t.TeamId, tm.MeetingDate, tm.MeetingStartTime
            """,
            (user_id, user_id, user_id)
        )
        
        teams_dict = {}
        for row in cur.fetchall():
            team_id = row[0]
            if team_id not in teams_dict:
                teams_dict[team_id] = {
                    'teamid': row[0],
                    'teamname': row[1],
                    'teamdescription': row[2],
                    'teamstartworkinghour': format_time_to_hhmm(row[3]),
                    'teamendworkinghour': format_time_to_hhmm(row[4]),
                    'createdbyuserid': str(row[5]),  # Convert to string
                    'meetings': []
                }
            
            if row[6]:  # If meeting exists
                teams_dict[team_id]['meetings'].append({
                    'teammeetingid': row[11],
                    'meetingtitle': row[6],
                    'meetingdescription': row[7],
                    'meetingdate': row[8].isoformat() if row[8] else None,
                    'meetingstarttime': format_time_to_hhmm(row[9]),
                    'meetingendtime': format_time_to_hhmm(row[10]),
                    'invitationtype': row[12]
                })
        
        teams = list(teams_dict.values())
        
        return jsonify({
            'success': True,
            'teams': teams
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch teams', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/teams/<int:team_id>', methods=['GET'])
def get_team_details(team_id):
    """Get detailed team information including all meetings and members"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get team details
        cur.execute(
            """
            SELECT TeamId, TeamName, TeamDescription, TeamStartWorkingHour, 
                   TeamEndWorkingHour, CreatedByUserId
            FROM Team
            WHERE TeamId = %s
            """,
            (team_id,)
        )
        
        team_row = cur.fetchone()
        if not team_row:
            return jsonify({'success': False, 'message': 'Team not found'}), 404
        
        team_data = {
            'teamid': team_row[0],
            'teamname': team_row[1],
            'teamdescription': team_row[2],
            'teamstartworkinghour': format_time_to_hhmm(team_row[3]),
            'teamendworkinghour': format_time_to_hhmm(team_row[4]),
            'createdbyuserid': str(team_row[5])
        }
        
        # Get all meetings for this team
        cur.execute(
            """
            SELECT TeamMeetingId, MeetingTitle, MeetingDescription, MeetingDate,
                   MeetingStartTime, MeetingEndTime, InvitationType
            FROM TeamMeeting
            WHERE TeamId = %s
            ORDER BY MeetingDate, MeetingStartTime
            """,
            (team_id,)
        )
        
        meetings = []
        for meeting_row in cur.fetchall():
            meeting_data = {
                'teammeetingid': meeting_row[0],
                'meetingtitle': meeting_row[1],
                'meetingdescription': meeting_row[2],
                'meetingdate': meeting_row[3].isoformat() if meeting_row[3] else None,
                'meetingstarttime': format_time_to_hhmm(meeting_row[4]),
                'meetingendtime': format_time_to_hhmm(meeting_row[5]),
                'invitationtype': meeting_row[6],
                'members': []
            }
            
            # Get members for this specific meeting
            cur.execute(
                """
                SELECT u.UserId, u.UserName, u.UserEmail, u.UserProfilePicture,
                       mi.Status, mi.InvitationType
                FROM MeetingInvitations mi
                JOIN Users u ON mi.UserId = u.UserId
                WHERE mi.MeetingId = %s
                ORDER BY u.UserName
                """,
                (meeting_row[0],)
            )
            
            for member_row in cur.fetchall():
                meeting_data['members'].append({
                    'userid': str(member_row[0]),
                    'username': member_row[1],
                    'useremail': member_row[2],
                    'userprofilepicture': member_row[3],
                    'status': member_row[4],
                    'invitationtype': member_row[5]
                })
            
            meetings.append(meeting_data)
        
        team_data['meetings'] = meetings
        
        return jsonify({
            'success': True,
            'team': team_data
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch team details', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/teams/<int:team_id>', methods=['PUT'])
def update_team(team_id):
    """Update team information"""
    data = request.get_json()
    
    team_name = data.get('teamName')
    team_description = data.get('teamDescription')
    team_start_working_hour = data.get('teamStartWorkingHour')
    team_end_working_hour = data.get('teamEndWorkingHour')
    
    if not team_name:
        return jsonify({'success': False, 'message': 'Team name is required'}), 400
    
    # Parse working hours
    parsed_start_hour = parse_time_from_hhmm(team_start_working_hour) if team_start_working_hour else None
    parsed_end_hour = parse_time_from_hhmm(team_end_working_hour) if team_end_working_hour else None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update team
        cur.execute(
            """
            UPDATE Team 
            SET TeamName = %s, TeamDescription = %s, TeamStartWorkingHour = %s, TeamEndWorkingHour = %s
            WHERE TeamId = %s
            """,
            (team_name, team_description, parsed_start_hour, parsed_end_hour, team_id)
        )
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Team not found'}), 404
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Team updated successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update team', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/teams/<int:team_id>/meetings', methods=['POST'])
def add_team_meeting(team_id):
    """Add a new meeting to an existing team"""
    data = request.get_json()
    
    meeting_title = data.get('meetingTitle')
    meeting_description = data.get('meetingDescription')
    meeting_date = data.get('meetingDate')
    meeting_start_time = data.get('meetingStartTime')
    meeting_end_time = data.get('meetingEndTime')
    invitation_type = data.get('invitationType', 'mandatory')
    invited_emails = data.get('invitedEmails', [])
    
    if not meeting_title or not meeting_date:
        return jsonify({'success': False, 'message': 'Meeting title and date are required'}), 400
    
    # Parse meeting times
    parsed_start_time = parse_time_from_hhmm(meeting_start_time) if meeting_start_time else None
    parsed_end_time = parse_time_from_hhmm(meeting_end_time) if meeting_end_time else None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get team name for notifications
        cur.execute("SELECT TeamName FROM Team WHERE TeamId = %s", (team_id,))
        team_result = cur.fetchone()
        if not team_result:
            return jsonify({'success': False, 'message': 'Team not found'}), 404
        
        team_name = team_result[0]
        
        # Insert new meeting
        cur.execute(
            """
            INSERT INTO TeamMeeting (MeetingTitle, MeetingDescription, MeetingDate,
                                    MeetingStartTime, MeetingEndTime, TeamId, InvitationType)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING TeamMeetingId
            """,
            (meeting_title, meeting_description, meeting_date, parsed_start_time, parsed_end_time, team_id, invitation_type)
        )
        
        meeting_id = cur.fetchone()[0]
        
        # Handle invited emails
        for email in invited_emails:
            if email.strip():
                # Check if user exists
                cur.execute("SELECT UserId FROM Users WHERE UserEmail = %s", (email.strip(),))
                user_result = cur.fetchone()
                
                if user_result:
                    user_id = str(user_result[0])
                    
                    # Add user to team if not already a member
                    cur.execute(
                        """
                        INSERT INTO TeamMembers (TeamId, UserId)
                        SELECT %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM TeamMembers WHERE TeamId = %s AND UserId = %s
                        )
                        """,
                        (team_id, user_id, team_id, user_id)
                    )
                    
                    # Create meeting invitation
                    cur.execute(
                        """
                        INSERT INTO MeetingInvitations (MeetingId, UserId, InvitationType, Status)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (meeting_id, user_id, invitation_type, 'accepted' if invitation_type == 'mandatory' else 'pending')
                    )
                    
                    # Create notification for request invitations
                    if invitation_type == 'request':
                        meeting_time_info = ""
                        if meeting_start_time and meeting_end_time:
                            meeting_time_info = f" on {meeting_date} from {meeting_start_time} to {meeting_end_time}"
                        elif meeting_date:
                            meeting_time_info = f" on {meeting_date}"
                        
                        notification_message = f'You have been invited to join the meeting "{meeting_title}"{meeting_time_info} in team "{team_name}"'
                        if meeting_description:
                            notification_message += f'. Description: {meeting_description}'
                        
                        cur.execute(
                            """
                            INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId)
                            VALUES (%s, %s, %s, %s, %s)
                            """,
                            (
                                user_id,
                                'meeting_invitation',
                                f'Meeting Invitation: {meeting_title}',
                                notification_message,
                                meeting_id
                            )
                        )
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Meeting added successfully',
            'meetingId': meeting_id
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to add meeting', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    """Delete a team and all its meetings and members"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete meeting invitations first
        cur.execute(
            """
            DELETE FROM MeetingInvitations 
            WHERE MeetingId IN (SELECT TeamMeetingId FROM TeamMeeting WHERE TeamId = %s)
            """,
            (team_id,)
        )
        
        # Delete notifications related to team meetings
        cur.execute(
            """
            DELETE FROM Notifications 
            WHERE RelatedId IN (SELECT TeamMeetingId FROM TeamMeeting WHERE TeamId = %s)
            AND Type = 'meeting_invitation'
            """,
            (team_id,)
        )
        
        # Delete team meetings
        cur.execute("DELETE FROM TeamMeeting WHERE TeamId = %s", (team_id,))
        
        # Delete team members
        cur.execute("DELETE FROM TeamMembers WHERE TeamId = %s", (team_id,))
        
        # Delete team
        cur.execute("DELETE FROM Team WHERE TeamId = %s", (team_id,))
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Team not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Team and all meetings deleted successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete team', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/meetings/<int:meeting_id>', methods=['PUT'])
def update_meeting(meeting_id):
    """Update an existing team meeting with member management and notifications"""
    # Get data from request
    data = request.get_json()
    
    # Extract meeting information
    title = data.get('meetingTitle')
    description = data.get('meetingDescription')
    date = data.get('meetingDate')
    start_time = data.get('meetingStartTime')
    end_time = data.get('meetingEndTime')
    new_member_emails = data.get('newMemberEmails', [])
    removed_member_ids = data.get('removedMemberIds', [])
    original_meeting = data.get('originalMeeting', {})
    
    # Validate required fields
    if not title or not date:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400
    
    # Parse meeting times
    parsed_start_time = parse_time_from_hhmm(start_time) if start_time else None
    parsed_end_time = parse_time_from_hhmm(end_time) if end_time else None
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get team info and current meeting details for the meeting
        cur.execute(
            """
            SELECT t.TeamId, t.TeamName, tm.MeetingTitle, tm.MeetingDescription, 
                   tm.MeetingDate, tm.MeetingStartTime, tm.MeetingEndTime
            FROM TeamMeeting tm
            JOIN Team t ON tm.TeamId = t.TeamId
            WHERE tm.TeamMeetingId = %s
            """,
            (meeting_id,)
        )
        
        meeting_result = cur.fetchone()
        if not meeting_result:
            return jsonify({'success': False, 'message': 'Meeting not found'}), 404
        
        team_id, team_name, old_title, old_description, old_date, old_start_time, old_end_time = meeting_result
        
        # Update meeting
        cur.execute(
            """
            UPDATE TeamMeeting 
            SET MeetingTitle = %s, MeetingDescription = %s, MeetingDate = %s,
                MeetingStartTime = %s, MeetingEndTime = %s
            WHERE TeamMeetingId = %s
            """,
            (title, description, date, parsed_start_time, parsed_end_time, meeting_id)
        )
        
        # Handle removed members
        for member_id in removed_member_ids:
            # Get member info for notification
            cur.execute("SELECT UserName FROM Users WHERE UserId = %s", (member_id,))
            member_result = cur.fetchone()
            
            if member_result:
                member_name = member_result[0]
                
                # Remove from meeting invitations
                cur.execute("DELETE FROM MeetingInvitations WHERE MeetingId = %s AND UserId = %s", (meeting_id, member_id))
                
                # Create notification for removed member
                cur.execute(
                    """
                    INSERT INTO Notifications (UserId, Type, Title, Message)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        member_id,
                        'meeting_update',
                        f'Removed from Meeting: {title}',
                        f'You have been removed from the meeting "{title}" in team "{team_name}".'
                    )
                )
        
        # Handle new members
        new_member_names = []
        for email in new_member_emails:
            if email.strip():
                # Check if user exists
                cur.execute("SELECT UserId, UserName FROM Users WHERE UserEmail = %s", (email.strip(),))
                user_result = cur.fetchone()
                
                if user_result:
                    new_user_id, new_user_name = user_result
                    new_member_names.append(new_user_name)
                    
                    # Add user to team if not already a member
                    cur.execute(
                        """
                        INSERT INTO TeamMembers (TeamId, UserId)
                        SELECT %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM TeamMembers WHERE TeamId = %s AND UserId = %s
                        )
                        """,
                        (team_id, new_user_id, team_id, new_user_id)
                    )
                    
                    # Create meeting invitation
                    cur.execute(
                        """
                        INSERT INTO MeetingInvitations (MeetingId, UserId, InvitationType, Status)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (meeting_id, new_user_id, 'request', 'pending')
                    )
                    
                    # Create notification for new member
                    meeting_time_info = ""
                    if start_time and end_time:
                        meeting_time_info = f" on {date} from {start_time} to {end_time}"
                    elif date:
                        meeting_time_info = f" on {date}"
                    
                    notification_message = f'You have been invited to join the meeting "{title}"{meeting_time_info} in team "{team_name}"'
                    if description:
                        notification_message += f'. Description: {description}'
                    
                    cur.execute(
                        """
                        INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            new_user_id,
                            'meeting_invitation',
                            f'Meeting Invitation: {title}',
                            notification_message,
                            meeting_id
                        )
                    )
        
        # Create update notifications for existing members (excluding removed ones)
        cur.execute(
            """
            SELECT DISTINCT mi.UserId, u.UserName
            FROM MeetingInvitations mi
            JOIN Users u ON mi.UserId = u.UserId
            WHERE mi.MeetingId = %s AND mi.Status = 'accepted'
            """,
            (meeting_id,)
        )
        
        existing_members = cur.fetchall()
        
        # Prepare change notifications
        changes = []
        
        # Check for title change
        if old_title != title:
            changes.append(f'Meeting title updated from "{old_title}" to "{title}"')
        
        # Check for description change
        old_desc = old_description or ""
        new_desc = description or ""
        if old_desc != new_desc:
            if old_desc and new_desc:
                changes.append(f'Description updated from "{old_desc}" to "{new_desc}"')
            elif new_desc:
                changes.append(f'Description added: "{new_desc}"')
            elif old_desc:
                changes.append('Description removed')
        
        # Check for date change
        if str(old_date) != date:
            changes.append(f'Meeting date updated from {old_date} to {date}')
        
        # Check for time changes
        old_start_formatted = format_time_to_hhmm(old_start_time) if old_start_time else ""
        old_end_formatted = format_time_to_hhmm(old_end_time) if old_end_time else ""
        new_start_formatted = start_time or ""
        new_end_formatted = end_time or ""
        
        if old_start_formatted != new_start_formatted or old_end_formatted != new_end_formatted:
            old_time_range = f"{old_start_formatted} - {old_end_formatted}" if old_start_formatted and old_end_formatted else "Not set"
            new_time_range = f"{new_start_formatted} - {new_end_formatted}" if new_start_formatted and new_end_formatted else "Not set"
            changes.append(f'Meeting time updated from {old_time_range} to {new_time_range}')
        
        # Add new member notifications
        if new_member_names:
            changes.append(f'New members invited: {", ".join(new_member_names)}')
        
        # Send notifications to existing members if there are changes
        if changes and existing_members:
            change_message = '. '.join(changes)
            
            for member_id, member_name in existing_members:
                # Don't notify removed members
                if str(member_id) not in [str(mid) for mid in removed_member_ids]:
                    cur.execute(
                        """
                        INSERT INTO Notifications (UserId, Type, Title, Message)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            member_id,
                            'meeting_update',
                            f'Meeting Updated: {title}',
                            f'The meeting "{title}" in team "{team_name}" has been updated. Changes: {change_message}'
                        )
                    )
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Meeting updated successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update meeting', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    """Delete a team meeting"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete meeting invitations first
        cur.execute("DELETE FROM MeetingInvitations WHERE MeetingId = %s", (meeting_id,))
        
        # Delete related notifications
        cur.execute(
            "DELETE FROM Notifications WHERE RelatedId = %s AND Type = 'meeting_invitation'",
            (meeting_id,)
        )
        
        # Delete meeting
        cur.execute("DELETE FROM TeamMeeting WHERE TeamMeetingId = %s", (meeting_id,))
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Meeting not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Meeting deleted successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete meeting', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get notifications for a user with invitation status"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get notifications for the user with invitation status
        cur.execute(
            """
            SELECT n.NotificationId, n.Type, n.Title, n.Message, n.RelatedId, n.IsRead, n.CreatedAt,
                   mi.Status as InvitationStatus
            FROM Notifications n
            LEFT JOIN MeetingInvitations mi ON n.RelatedId = mi.MeetingId 
                AND n.Type = 'meeting_invitation' AND mi.UserId = %s
            WHERE n.UserId = %s
            ORDER BY n.CreatedAt DESC
            """,
            (user_id, user_id)
        )
        
        notifications = []
        unread_count = 0
        for row in cur.fetchall():
            notification = {
                'notificationid': row[0],
                'type': row[1],
                'title': row[2],
                'message': row[3],
                'relatedid': row[4],
                'isread': row[5],
                'createdat': row[6].isoformat() if row[6] else None,
                'invitationstatus': row[7]  # This will be the current invitation status
            }
            notifications.append(notification)
            if not row[5]:  # If not read
                unread_count += 1
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'unreadCount': unread_count
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch notifications', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/notifications/mark-all-read', methods=['PUT'])
def mark_all_notifications_read():
    """Mark all notifications as read for a user"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'success': False, 'message': 'User ID is required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            UPDATE Notifications 
            SET IsRead = TRUE 
            WHERE UserId = %s AND IsRead = FALSE
            """, 
            (user_id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        }), 200
        
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return jsonify({'success': False, 'message': 'Failed to mark notifications as read'}), 500

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            UPDATE Notifications 
            SET IsRead = TRUE 
            WHERE NotificationId = %s
            """, 
            (notification_id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return jsonify({'success': False, 'message': 'Failed to mark notification as read'}), 500

@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            DELETE FROM Notifications 
            WHERE NotificationId = %s
            """, 
            (notification_id,)
        )
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Notification not found'}), 404
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete notification'}), 500

@app.route('/api/meeting-invitations/<int:meeting_id>/respond', methods=['PUT'])
def respond_to_invitation(meeting_id):
    """Respond to a meeting invitation"""
    data = request.get_json()
    response = data.get('response')  # 'accepted' or 'declined'
    user_id = data.get('userId')  # Add user_id to identify which user is responding
    
    if response not in ['accepted', 'declined']:
        return jsonify({'success': False, 'message': 'Invalid response. Must be "accepted" or "declined"'}), 400
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update invitation status for the specific user and meeting
        cur.execute(
            """
            UPDATE MeetingInvitations 
            SET Status = %s, RespondedAt = CURRENT_TIMESTAMP
            WHERE MeetingId = %s AND UserId = %s
            """,
            (response, meeting_id, user_id)
        )
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Invitation not found'}), 404
        
        # Mark related notification as read for this user
        cur.execute(
            """
            UPDATE Notifications 
            SET IsRead = TRUE
            WHERE RelatedId = %s AND Type = 'meeting_invitation' AND UserId = %s
            """,
            (meeting_id, user_id)
        )
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Invitation {response} successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to respond to invitation', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user details"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get user details
        cur.execute(
            """
            SELECT UserId, UserName, UserEmail, UserDOB, UserBio, UserProfilePicture, GoogleId
            FROM Users
            WHERE UserId = %s
            """,
            (user_id,)
        )
        
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Format user data
        user_data = {
            'userid': str(user[0]),
            'username': user[1],
            'useremail': user[2],
            'userdob': user[3].isoformat() if user[3] else None,
            'userbio': user[4],
            'userprofilepicture': user[5],
            'isgoogleuser': user[6] is not None
        }
        
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch user', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user profile"""
    # Get data from request
    data = request.get_json()
    
    # Extract user information
    username = data.get('username')
    bio = data.get('bio')
    dob = data.get('dob')
    profile_picture = data.get('profilePicture')
    
    # Validate required fields
    if not username:
        return jsonify({'success': False, 'message': 'Username is required'}), 400
    
    # Parse date of birth if provided
    parsed_dob = None
    if dob:
        try:
            parsed_dob = datetime.strptime(dob, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid date format for date of birth'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update user profile
        cur.execute(
            """
            UPDATE Users 
            SET UserName = %s, UserBio = %s, UserDOB = %s, UserProfilePicture = %s
            WHERE UserId = %s
            """,
            (username, bio, parsed_dob, profile_picture, user_id)
        )
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Fetch updated user data
        cur.execute(
            """
            SELECT UserId, UserName, UserEmail, UserDOB, UserBio, UserProfilePicture, GoogleId
            FROM Users
            WHERE UserId = %s
            """,
            (user_id,)
        )
        
        user = cur.fetchone()
        
        if user:
            user_data = {
                'userid': str(user[0]),
                'username': user[1],
                'useremail': user[2],
                'userdob': user[3].isoformat() if user[3] else None,
                'userbio': user[4],
                'userprofilepicture': user[5],
                'isgoogleuser': user[6] is not None
            }
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user_data
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update profile', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<user_id>/password', methods=['PUT'])
def change_password(user_id):
    """Change user password"""
    # Get data from request
    data = request.get_json()
    
    # Extract password information
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    # Validate required fields
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'Current password and new password are required'}), 400
    
    # Validate password length
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get current user data
        cur.execute("SELECT UserPassword, GoogleId FROM Users WHERE UserId = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Check if this is a Google user
        if user[1]:  # GoogleId exists
            return jsonify({'success': False, 'message': 'Cannot change password for Google users'}), 400
        
        # Verify current password
        if not user[0] or not check_password_hash(user[0], current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
        
        # Hash new password
        hashed_new_password = generate_password_hash(new_password)
        
        # Update password
        cur.execute(
            "UPDATE Users SET UserPassword = %s WHERE UserId = %s",
            (hashed_new_password, user_id)
        )
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to change password', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user account"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete user's data in order (due to foreign key constraints)
        # Delete meeting invitations
        cur.execute(
            """
            DELETE FROM MeetingInvitations 
            WHERE UserId = %s
            """,
            (user_id,)
        )
        
        # Delete notifications
        cur.execute("DELETE FROM Notifications WHERE UserId = %s", (user_id,))
        
        # Delete timelines first
        cur.execute(
            """
            DELETE FROM Timeline 
            WHERE GoalId IN (SELECT GoalId FROM Goal WHERE UserId = %s)
            """,
            (user_id,)
        )
        
        # Delete team meetings for teams created by user
        cur.execute(
            """
            DELETE FROM TeamMeeting 
            WHERE TeamId IN (SELECT TeamId FROM Team WHERE CreatedByUserId = %s)
            """,
            (user_id,)
        )
        
        # Delete team members
        cur.execute("DELETE FROM TeamMembers WHERE UserId = %s", (user_id,))
        
        # Delete teams created by user
        cur.execute("DELETE FROM Team WHERE CreatedByUserId = %s", (user_id,))
        
        # Delete goals
        cur.execute("DELETE FROM Goal WHERE UserId = %s", (user_id,))
        
        # Delete activities
        cur.execute("DELETE FROM Activity WHERE UserId = %s", (user_id,))
        
        # Finally delete user
        cur.execute("DELETE FROM Users WHERE UserId = %s", (user_id,))
        
        # Check if user was deleted
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Commit the transaction
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account deleted successfully'
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete account', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/users/by-email/<email>', methods=['GET'])
def get_user_by_email(email):
    """Get user details by email address"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get user details by email
        cur.execute(
            """
            SELECT UserId, UserName, UserEmail, UserDOB, UserBio, UserProfilePicture, GoogleId
            FROM Users
            WHERE UserEmail = %s
            """,
            (email,)
        )
        
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Format user data
        user_data = {
            'userid': str(user[0]),
            'username': user[1],
            'useremail': user[2],
            'userdob': user[3].isoformat() if user[3] else None,
            'userbio': user[4],
            'userprofilepicture': user[5],
            'isgoogleuser': user[6] is not None
        }
        
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch user', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)
