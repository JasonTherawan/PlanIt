from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import sql
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
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
    google_id = data.get('googleId')
    
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
        
        # Get max existing UserId (cast to int), default to 0
        cur.execute("SELECT COALESCE(MAX(CAST(UserId AS INTEGER)), 0) + 1 FROM Users")
        next_user_id = str(cur.fetchone()[0])  # Ensure it's a string

        # Insert with generated UserId
        if google_id:
            cur.execute(
                """
                INSERT INTO Users (UserId, UserName, UserEmail, UserDOB, GoogleId)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING UserId
                """,
                (next_user_id, username, email, parsed_dob, google_id)
            )
        else:
            cur.execute(
                """
                INSERT INTO Users (UserId, UserName, UserEmail, UserPassword, UserDOB)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING UserId
                """,
                (next_user_id, username, email, hashed_password, parsed_dob)
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
            'userId': str(user_id),  # Convert to string to handle large numbers
            'user': {
                'id': str(user_id),  # Use actual database UserId
                'userId': str(user_id),
                'username': username,
                'email': email,
                'googleId': google_id if google_id else None,
                'isGoogleUser': bool(google_id)
            }
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
    google_id = data.get('googleId')
    
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
                        'id': str(user[0]),  # Use actual UserId from database
                        'userId': str(user[0]),
                        'username': user[1],
                        'email': user[2],
                        'googleId': google_id,  # Keep googleId for reference
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
    google_id = data.get('googleId')
    
    # Validate required fields
    if not user_id or not title or not date:
        return jsonify({'success': False, 'message': 'User ID, title, and date are required'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if google_id:
            cur.execute("SELECT UserId FROM Users WHERE GoogleId = %s", (user_id,))
        else:
            cur.execute("SELECT UserId FROM Users WHERE UserId = %s", (user_id,))
        
        user_row = cur.fetchone()
        if not user_row:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        internal_user_id = user_row[0]
        
        # Insert new activity
        cur.execute(
            """
            INSERT INTO Activity (ActivityTitle, ActivityDescription, ActivityCategory, 
                                  ActivityUrgency, ActivityDate, ActivityStartTime, 
                                  ActivityEndTime, UserId)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING ActivityId
            """,
            (title, description, category, urgency, date, start_time, end_time, internal_user_id)
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
        
        # Get activities for the user
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
                'activitystarttime': str(row[6]) if row[6] else None,
                'activityendtime': str(row[7]) if row[7] else None
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
            (title, description, category, urgency, date, start_time, end_time, activity_id)
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
        
        # Insert new goal
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
                    timeline.get('timelineStartTime'),
                    timeline.get('timelineEndTime'),
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
        
        # Get goals for the user
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
                    'timelinestarttime': str(row[9]) if row[9] else None,
                    'timelineendtime': str(row[10]) if row[10] else None
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
                    timeline.get('timelineStartTime'),
                    timeline.get('timelineEndTime'),
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

@app.route('/api/teams', methods=['POST'])
def create_team():
    """Create a new team with meetings"""
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
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new team
        cur.execute(
            """
            INSERT INTO Team (TeamName, TeamDescription, TeamStartWorkingHour, 
                             TeamEndWorkingHour, CreatedByUserId)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING TeamId
            """,
            (team_name, team_description, team_start_working_hour, team_end_working_hour, created_by_user_id)
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
            # Insert meeting
            cur.execute(
                """
                INSERT INTO TeamMeeting (MeetingTitle, MeetingDescription, MeetingDate,
                                        MeetingStartTime, MeetingEndTime, TeamId)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING TeamMeetingId
                """,
                (
                    meeting.get('meetingTitle'),
                    meeting.get('meetingDescription'),
                    meeting.get('meetingDate'),
                    meeting.get('meetingStartTime'),
                    meeting.get('meetingEndTime'),
                    team_id
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
    """Get teams and meetings for a user"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get teams where user is a member
        cur.execute(
            """
            SELECT DISTINCT t.TeamId, t.TeamName, t.TeamDescription, 
                   t.TeamStartWorkingHour, t.TeamEndWorkingHour, t.CreatedByUserId,
                   tm.MeetingTitle, tm.MeetingDescription, tm.MeetingDate,
                   tm.MeetingStartTime, tm.MeetingEndTime, tm.TeamMeetingId
            FROM Team t
            INNER JOIN TeamMembers tmem ON t.TeamId = tmem.TeamId
            LEFT JOIN TeamMeeting tm ON t.TeamId = tm.TeamId
            WHERE tmem.UserId = %s
            ORDER BY t.TeamId, tm.MeetingDate, tm.MeetingStartTime
            """,
            (user_id,)
        )
        
        teams_dict = {}
        for row in cur.fetchall():
            team_id = row[0]
            if team_id not in teams_dict:
                teams_dict[team_id] = {
                    'teamid': row[0],
                    'teamname': row[1],
                    'teamdescription': row[2],
                    'teamstartworkinghour': str(row[3]) if row[3] else None,
                    'teamendworkinghour': str(row[4]) if row[4] else None,
                    'createdbyuserid': str(row[5]),
                    'meetings': []
                }
            
            if row[6]:  # If meeting exists
                teams_dict[team_id]['meetings'].append({
                    'teammeetingid': row[11],
                    'meetingtitle': row[6],
                    'meetingdescription': row[7],
                    'meetingdate': row[8].isoformat() if row[8] else None,
                    'meetingstarttime': str(row[9]) if row[9] else None,
                    'meetingendtime': str(row[10]) if row[10] else None
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

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    """Delete a team and all its meetings and members"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete team meetings first (due to foreign key constraint)
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
    """Update an existing team meeting"""
    # Get data from request
    data = request.get_json()
    
    # Extract meeting information
    title = data.get('meetingTitle')
    description = data.get('meetingDescription')
    date = data.get('meetingDate')
    start_time = data.get('meetingStartTime')
    end_time = data.get('meetingEndTime')
    
    # Validate required fields
    if not title or not date:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update meeting
        cur.execute(
            """
            UPDATE TeamMeeting 
            SET MeetingTitle = %s, MeetingDescription = %s, MeetingDate = %s,
                MeetingStartTime = %s, MeetingEndTime = %s
            WHERE TeamMeetingId = %s
            """,
            (title, description, date, start_time, end_time, meeting_id)
        )
        
        # Check if any rows were affected
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Meeting not found'}), 404
        
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

if __name__ == '__main__':
    app.run(debug=True)
