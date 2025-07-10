from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from dotenv import load_dotenv
import psycopg2
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
CORS(app)

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

def _get_internal_user_id(cur, user_id_param):
    """
    Resolves a user ID parameter to an internal integer ID.
    If the parameter can be cast to an integer, it is returned.
    If not, it's assumed to be a Google ID and the internal ID is looked up using the provided cursor.
    """
    try:
        return int(user_id_param)
    except (ValueError, TypeError):
        cur.execute("SELECT UserId FROM Users WHERE GoogleId = %s", (str(user_id_param),))
        result = cur.fetchone()
        return result[0] if result else None

def format_time_to_hhmm(time_obj):
    """Convert time object to HH:MM format string"""
    if time_obj is None:
        return None
    if isinstance(time_obj, str):
        try:
            parsed_time = datetime.strptime(time_obj, '%H:%M:%S').time()
            return parsed_time.strftime('%H:%M')
        except ValueError:
            try:
                parsed_time = datetime.strptime(time_obj, '%H:%M').time()
                return parsed_time.strftime('%H:%M')
            except ValueError:
                return time_obj
    return time_obj.strftime('%H:%M')

def parse_time_from_hhmm(time_str):
    """Parse HH:MM format string to time object"""
    if not time_str:
        return None
    try:
        if len(time_str.split(':')) == 2:
            return datetime.strptime(time_str, '%H:%M').time()
        else:
            return datetime.strptime(time_str, '%H:%M:%S').time()
    except ValueError:
        return None

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    dob = data.get('dob')
    google_id = data.get('googleId')
    image_url = data.get('imageUrl')

    if not username or not email:
        return jsonify({'success': False, 'message': 'Username and email are required'}), 400
    if not google_id and not password:
        return jsonify({'success': False, 'message': 'Password is required for non-Google users'}), 400
    
    hashed_password = generate_password_hash(password) if password else None
    parsed_dob = None
    if dob:
        try:
            parsed_dob = datetime.strptime(dob, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid date format for date of birth'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT UserId FROM Users WHERE UserEmail = %s", (email,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'Email already registered'}), 409
        
        if google_id:
            cur.execute("SELECT UserId FROM Users WHERE GoogleId = %s", (google_id,))
            if cur.fetchone():
                return jsonify({'success': False, 'message': 'Google account already registered'}), 409
        
        if google_id:
            cur.execute(
                """
                INSERT INTO Users (UserName, UserEmail, UserDOB, GoogleId, UserProfilePicture)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING UserId
                """,
                (username, email, parsed_dob, google_id, image_url)
            )
        else:
            cur.execute(
                """
                INSERT INTO Users (UserName, UserEmail, UserPassword, UserDOB)
                VALUES (%s, %s, %s, %s)
                RETURNING UserId
                """,
                (username, email, hashed_password, parsed_dob)
            )
        
        user_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({'success': True, 'message': 'User registered successfully', 'userId': user_id}), 201
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error during registration: {str(e)}")
        return jsonify({'success': False, 'message': 'Registration failed', 'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    google_id = data.get('googleId')
    image_url = data.get('imageUrl')
    remember_me = data.get('rememberMe', False)
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    if google_id and password:
        return jsonify({'success': False, 'message': 'Cannot provide both Google ID and password'}), 400
    if not google_id and not password:
        return jsonify({'success': False, 'message': 'Either Google authentication or password is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        user_record = None
        if google_id:
            cur.execute("SELECT UserId, UserName, UserEmail, UserProfilePicture FROM Users WHERE GoogleId = %s", (google_id,))
            user_record = cur.fetchone()
            if user_record and image_url and image_url != user_record[3]:
                cur.execute("UPDATE Users SET UserProfilePicture = %s WHERE UserId = %s AND UserProfilePicture IS NULL", (image_url, user_record[0]))
                conn.commit()
        else:
            cur.execute("SELECT UserId, UserName, UserEmail, UserPassword, UserProfilePicture FROM Users WHERE UserEmail = %s", (email,))
            user_record = cur.fetchone()

        is_authenticated = False
        if user_record:
            if google_id:
                is_authenticated = True
            elif len(user_record) > 3 and user_record[3] and check_password_hash(user_record[3], password):
                is_authenticated = True

        if is_authenticated:
            if remember_me:
                session.permanent = True
                app.permanent_session_lifetime = timedelta(days=30)
            else:
                session.permanent = True
                app.permanent_session_lifetime = timedelta(days=1)
            
            user_id = user_record[0]
            session['user_id'] = user_id
            
            cur.execute("SELECT UserProfilePicture FROM Users WHERE UserId = %s", (user_id,))
            final_picture_url = cur.fetchone()[0]

            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user_id,
                    'userId': user_id,
                    'username': user_record[1],
                    'email': user_record[2],
                    'imageUrl': final_picture_url,
                    'isGoogleUser': google_id is not None
                }
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Login failed', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()

@app.route('/api/activities', methods=['POST'])
def create_activity():
    data = request.get_json()
    user_id_param = data.get('userId')
    title = data.get('activityTitle')
    description = data.get('activityDescription')
    category = data.get('activityCategory')
    urgency = data.get('activityUrgency')
    date = data.get('activityDate')
    start_time = data.get('activityStartTime')
    end_time = data.get('activityEndTime')
    
    if not user_id_param or not title or not date:
        return jsonify({'success': False, 'message': 'User ID, title, and date are required'}), 400

    parsed_start_time = parse_time_from_hhmm(start_time) if start_time else None
    parsed_end_time = parse_time_from_hhmm(end_time) if end_time else None

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        internal_user_id = _get_internal_user_id(cur, user_id_param)
        if internal_user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        cur.execute(
            """
            INSERT INTO Activity (ActivityTitle, ActivityDescription, ActivityCategory, 
                                 ActivityUrgency, ActivityDate, ActivityStartTime, 
                                 ActivityEndTime, UserId)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING ActivityId
            """,
            (title, description, category, urgency, date, parsed_start_time, parsed_end_time, internal_user_id)
        )
        
        activity_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Activity created successfully',
            'activityId': activity_id
        }), 201
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create activity', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()


@app.route('/api/activities', methods=['GET'])
def get_activities():
    user_id_param = request.args.get('userId')
    if not user_id_param:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        internal_user_id = _get_internal_user_id(cur, user_id_param)
        if internal_user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        cur.execute(
            """
            SELECT ActivityId, ActivityTitle, ActivityDescription, ActivityCategory,
                   ActivityUrgency, ActivityDate, ActivityStartTime, ActivityEndTime
            FROM Activity 
            WHERE UserId = %s
            ORDER BY ActivityDate, ActivityStartTime
            """,
            (internal_user_id,)
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
        if conn: conn.close()

@app.route('/api/activities/<int:activity_id>', methods=['PUT'])
def update_activity(activity_id):
    """Update an existing activity"""
    data = request.get_json()
    
    title = data.get('activityTitle')
    description = data.get('activityDescription')
    category = data.get('activityCategory')
    urgency = data.get('activityUrgency')
    date = data.get('activityDate')
    start_time = data.get('activityStartTime')
    end_time = data.get('activityEndTime')
    
    if not title or not date:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400
    
    parsed_start_time = parse_time_from_hhmm(start_time) if start_time else None
    parsed_end_time = parse_time_from_hhmm(end_time) if end_time else None

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
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
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404
        
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
        
        cur.execute("DELETE FROM Activity WHERE ActivityId = %s", (activity_id,))
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404
        
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
    data = request.get_json()
    
    user_id = data.get('userId')
    title = data.get('goalTitle')
    description = data.get('goalDescription')
    category = data.get('goalCategory')
    progress = data.get('goalProgress')
    timelines = data.get('timelines', [])
    
    if not user_id or not title:
        return jsonify({'success': False, 'message': 'User ID and title are required'}), 400
    
    if not timelines:
        return jsonify({'success': False, 'message': 'At least one timeline is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            INSERT INTO Goal (GoalTitle, GoalDescription, GoalCategory, GoalProgress, UserId)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING GoalId
            """,
            (title, description, category, progress, user_id)
        )
        
        goal_id = cur.fetchone()[0]
        
        timeline_ids = []
        for timeline in timelines:
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
    user_id_param = request.args.get('userId')
    if not user_id_param:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        internal_user_id = _get_internal_user_id(cur, user_id_param)
        if internal_user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

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
            (internal_user_id,)
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
            
            if row[5]:
                goals_dict[goal_id]['timelines'].append({
                    'timelineid': row[5],
                    'timelinetitle': row[6],
                    'timelinestartdate': row[7].isoformat() if row[7] else None,
                    'timelineenddate': row[8].isoformat() if row[8] else None,
                    'timelinestarttime': format_time_to_hhmm(row[9]),
                    'timelineendtime': format_time_to_hhmm(row[10])
                })
        
        return jsonify({'success': True, 'goals': list(goals_dict.values())}), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch goals', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    """Update an existing goal with timelines"""
    data = request.get_json()
    
    title = data.get('goalTitle')
    description = data.get('goalDescription')
    category = data.get('goalCategory')
    progress = data.get('goalProgress')
    timelines = data.get('timelines', [])
    
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400
    
    if not timelines:
        return jsonify({'success': False, 'message': 'At least one timeline is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            UPDATE Goal 
            SET GoalTitle = %s, GoalDescription = %s, GoalCategory = %s, GoalProgress = %s
            WHERE GoalId = %s
            """,
            (title, description, category, progress, goal_id)
        )
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Goal not found'}), 404
        
        cur.execute("DELETE FROM Timeline WHERE GoalId = %s", (goal_id,))
        
        timeline_ids = []
        for timeline in timelines:
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
        
        cur.execute("DELETE FROM Timeline WHERE GoalId = %s", (goal_id,))
        
        cur.execute("DELETE FROM Goal WHERE GoalId = %s", (goal_id,))
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Goal not found'}), 404
        
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
        
        cur.execute("DELETE FROM Timeline WHERE TimelineId = %s", (timeline_id,))
        
        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'Timeline not found'}), 404
        
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
    data = request.get_json()
    
    created_by_user_id = data.get('createdByUserId')
    team_name = data.get('teamName')
    team_description = data.get('teamDescription')
    team_start_working_hour = data.get('teamStartWorkingHour')
    team_end_working_hour = data.get('teamEndWorkingHour')
    meetings = data.get('meetings', [])
    
    if not created_by_user_id or not team_name:
        return jsonify({'success': False, 'message': 'Creator user ID and team name are required'}), 400
    
    if not meetings:
        return jsonify({'success': False, 'message': 'At least one meeting is required'}), 400
    
    parsed_start_hour = parse_time_from_hhmm(team_start_working_hour) if team_start_working_hour else None
    parsed_end_hour = parse_time_from_hhmm(team_end_working_hour) if team_end_working_hour else None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            INSERT INTO Team (TeamName, TeamDescription, TeamStartWorkingHour, 
                             TeamEndWorkingHour, CreatedByUserId)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING TeamId
            """,
            (team_name, team_description, parsed_start_hour, parsed_end_hour, created_by_user_id)
        )
        
        team_id = cur.fetchone()[0]
        
        cur.execute(
            """
            INSERT INTO TeamMembers (TeamId, UserId)
            VALUES (%s, %s)
            """,
            (team_id, created_by_user_id)
        )
        
        meeting_ids = []
        for meeting in meetings:
            meeting_start_time = parse_time_from_hhmm(meeting.get('meetingStartTime')) if meeting.get('meetingStartTime') else None
            meeting_end_time = parse_time_from_hhmm(meeting.get('meetingEndTime')) if meeting.get('meetingEndTime') else None
            
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
            
            invited_emails = meeting.get('invitedEmails', [])
            for email in invited_emails:
                if email.strip():
                    cur.execute("SELECT UserId FROM Users WHERE UserEmail = %s", (email.strip(),))
                    user_result = cur.fetchone()
                    
                    if user_result:
                        user_id = user_result[0]
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
                        
                        cur.execute(
                            """
                            INSERT INTO MeetingInvitations (MeetingId, UserId, InvitationType, Status)
                            VALUES (%s, %s, %s, %s)
                            """,
                            (meeting_id, user_id, invitation_type, 'accepted' if invitation_type == 'mandatory' else 'pending')
                        )
                        
                        if invitation_type == 'request':
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
    user_id_param = request.args.get('userId')
    if not user_id_param:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        internal_user_id = _get_internal_user_id(cur, user_id_param)
        if internal_user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        cur.execute(
            """
            SELECT t.TeamId, t.TeamName, t.TeamDescription,
                   t.TeamStartWorkingHour, t.TeamEndWorkingHour, t.CreatedByUserId
            FROM Team t
            INNER JOIN TeamMembers tmem ON t.TeamId = tmem.TeamId
            WHERE tmem.UserId = %s
            """,
            (internal_user_id,)
        )
        teams_dict = {}
        for row in cur.fetchall():
            team_id = row[0]
            teams_dict[team_id] = {
                'teamid': row[0],
                'teamname': row[1],
                'teamdescription': row[2],
                'teamstartworkinghour': format_time_to_hhmm(row[3]),
                'teamendworkinghour': format_time_to_hhmm(row[4]),
                'createdbyuserid': row[5],
                'meetings': []
            }

        for team_id, team_data in teams_dict.items():
            if team_data['createdbyuserid'] == internal_user_id:
                cur.execute(
                    """
                    SELECT tm.MeetingTitle, tm.MeetingDescription, tm.MeetingDate,
                           tm.MeetingStartTime, tm.MeetingEndTime, tm.TeamMeetingId, tm.InvitationType
                    FROM TeamMeeting tm
                    WHERE tm.TeamId = %s
                    ORDER BY tm.MeetingDate, tm.MeetingStartTime
                    """,
                    (team_id,)
                )
            else:
                cur.execute(
                    """
                    SELECT tm.MeetingTitle, tm.MeetingDescription, tm.MeetingDate,
                           tm.MeetingStartTime, tm.MeetingEndTime, tm.TeamMeetingId, tm.InvitationType
                    FROM TeamMeeting tm
                    INNER JOIN MeetingInvitations mi ON tm.TeamMeetingId = mi.MeetingId
                    WHERE tm.TeamId = %s AND mi.UserId = %s AND mi.Status = 'accepted'
                    ORDER BY tm.MeetingDate, tm.MeetingStartTime
                    """,
                    (team_id, internal_user_id)
                )

            for meeting_row in cur.fetchall():
                meeting_id = meeting_row[5]
                meeting_data = {
                    'teammeetingid': meeting_id,
                    'meetingtitle': meeting_row[0],
                    'meetingdescription': meeting_row[1],
                    'meetingdate': meeting_row[2].isoformat() if meeting_row[2] else None,
                    'meetingstarttime': format_time_to_hhmm(meeting_row[3]),
                    'meetingendtime': format_time_to_hhmm(meeting_row[4]),
                    'invitationtype': meeting_row[6],
                    'members': []
                }
                
                cur.execute(
                    """
                    SELECT u.UserId, u.UserName, u.UserEmail, 
                           u.UserProfilePicture,
                           mi.Status, mi.InvitationType
                    FROM MeetingInvitations mi
                    JOIN Users u ON mi.UserId = u.UserId
                    WHERE mi.MeetingId = %s
                    ORDER BY u.UserName
                    """,
                    (meeting_id,)
                )

                for member_row in cur.fetchall():
                    meeting_data['members'].append({
                        'userid': member_row[0],
                        'username': member_row[1],
                        'useremail': member_row[2],
                        'userprofilepicture': member_row[3],
                        'status': member_row[4],
                        'invitationtype': member_row[5]
                    })
                
                team_data['meetings'].append(meeting_data)

        return jsonify({'success': True, 'teams': list(teams_dict.values())}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch teams', 'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/teams/<int:team_id>', methods=['GET'])
def get_team_details(team_id):
    """Get detailed team information including meetings and members, filtered for the requesting user."""
    user_id = request.args.get('userId')
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

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
            'createdbyuserid': team_row[5]
        }

        is_creator = team_data['createdbyuserid'] == int(user_id) if user_id else False

        if is_creator:
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
        elif user_id:
            cur.execute(
                """
                SELECT DISTINCT tm.TeamMeetingId, tm.MeetingTitle, tm.MeetingDescription, tm.MeetingDate,
                                tm.MeetingStartTime, tm.MeetingEndTime, tm.InvitationType
                FROM TeamMeeting tm
                JOIN MeetingInvitations mi ON tm.TeamMeetingId = mi.MeetingId
                WHERE tm.TeamId = %s AND mi.UserId = %s
                ORDER BY tm.MeetingDate, tm.MeetingStartTime
                """,
                (team_id, user_id)
            )
        else:
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
                    'userid': member_row[0],
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
    
    parsed_start_hour = parse_time_from_hhmm(team_start_working_hour) if team_start_working_hour else None
    parsed_end_hour = parse_time_from_hhmm(team_end_working_hour) if team_end_working_hour else None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
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
    
    parsed_start_time = parse_time_from_hhmm(meeting_start_time) if meeting_start_time else None
    parsed_end_time = parse_time_from_hhmm(meeting_end_time) if meeting_end_time else None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT TeamName FROM Team WHERE TeamId = %s", (team_id,))
        team_result = cur.fetchone()
        if not team_result:
            return jsonify({'success': False, 'message': 'Team not found'}), 404
        
        team_name = team_result[0]
        
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
        
        for email in invited_emails:
            if email.strip():
                cur.execute("SELECT UserId FROM Users WHERE UserEmail = %s", (email.strip(),))
                user_result = cur.fetchone()
                
                if user_result:
                    user_id = user_result[0]
                    
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
                    
                    cur.execute(
                        """
                        INSERT INTO MeetingInvitations (MeetingId, UserId, InvitationType, Status)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (meeting_id, user_id, invitation_type, 'accepted' if invitation_type == 'mandatory' else 'pending')
                    )
                    
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

@app.route('/api/meetings/<int:meeting_id>', methods=['PUT'])
def update_meeting(meeting_id):
    """Update an existing team meeting, including adding and removing members."""
    data = request.get_json()
    
    title = data.get('meetingTitle')
    description = data.get('meetingDescription')
    date = data.get('meetingDate')
    start_time = data.get('meetingStartTime')
    end_time = data.get('meetingEndTime')
    invitation_type = data.get('invitationType', 'mandatory')
    new_member_emails = data.get('newMemberEmails', [])
    removed_member_ids = data.get('removedMemberIds', [])
    
    if not title or not date:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400
    
    parsed_start_time = parse_time_from_hhmm(start_time) if start_time else None
    parsed_end_time = parse_time_from_hhmm(end_time) if end_time else None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            SELECT t.TeamId, t.TeamName 
            FROM TeamMeeting tm JOIN Team t ON tm.TeamId = t.TeamId 
            WHERE tm.TeamMeetingId = %s
            """, 
            (meeting_id,)
        )
        team_result = cur.fetchone()
        if not team_result:
            return jsonify({'success': False, 'message': 'Meeting not found'}), 404
        team_id, team_name = team_result

        cur.execute(
            """
            UPDATE TeamMeeting 
            SET MeetingTitle = %s, MeetingDescription = %s, MeetingDate = %s,
                MeetingStartTime = %s, MeetingEndTime = %s, InvitationType = %s
            WHERE TeamMeetingId = %s
            """,
            (title, description, date, parsed_start_time, parsed_end_time, invitation_type, meeting_id)
        )

        if removed_member_ids:
            for user_id in removed_member_ids:
                notification_message = f'You have been removed from the meeting "{title}" in team "{team_name}".'
                cur.execute("INSERT INTO Notifications (UserId, Type, Title, Message) VALUES (%s, 'meeting_removed', %s, %s)",
                            (user_id, f'Removed from Meeting: {title}', notification_message))
                
                cur.execute("DELETE FROM MeetingInvitations WHERE MeetingId = %s AND UserId = %s", (meeting_id, user_id))
                cur.execute("DELETE FROM Notifications WHERE RelatedId = %s AND UserId = %s AND Type = 'meeting_invitation'", (meeting_id, user_id))
        
        if new_member_emails:
            for email in new_member_emails:
                cur.execute("SELECT UserId FROM Users WHERE UserEmail = %s", (email,))
                user_result = cur.fetchone()
                if user_result:
                    user_id = user_result[0]
                    
                    cur.execute("SELECT 1 FROM TeamMembers WHERE TeamId = %s AND UserId = %s", (team_id, user_id))
                    is_member = cur.fetchone()
                    
                    if not is_member:
                        cur.execute("INSERT INTO TeamMembers (TeamId, UserId) VALUES (%s, %s)", (team_id, user_id))

                    cur.execute("INSERT INTO MeetingInvitations (MeetingId, UserId, InvitationType, Status) VALUES (%s, %s, %s, %s)",
                                (meeting_id, user_id, invitation_type, 'accepted' if invitation_type == 'mandatory' else 'pending'))
                    
                    if invitation_type == 'mandatory':
                        notification_message = f'You have been invited to join the mandatory meeting "{title}" in team "{team_name}".'
                    else: # 'request'
                        notification_message = f'You have been invited to join the meeting "{title}" in team "{team_name}". Please respond.'
                    cur.execute("INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId) VALUES (%s, 'meeting_invitation', %s, %s, %s)",
                                (user_id, f'New Meeting Invitation: {title}', notification_message, meeting_id))

        conn.commit()
        return jsonify({'success': True, 'message': 'Meeting updated successfully'}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error updating meeting: {e}")
        return jsonify({'success': False, 'message': 'Failed to update meeting', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    """Delete a team and notify all members."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT TeamName, CreatedByUserId FROM Team WHERE TeamId = %s", (team_id,))
        team_result = cur.fetchone()
        if not team_result:
            return jsonify({'success': False, 'message': 'Team not found'}), 404
        team_name, creator_id = team_result

        cur.execute("SELECT UserId FROM TeamMembers WHERE TeamId = %s", (team_id,))
        member_ids = [row[0] for row in cur.fetchall()]

        notification_message = f'The team "{team_name}" has been deleted by the creator.'
        for user_id in member_ids:
            if user_id != creator_id:
                cur.execute("INSERT INTO Notifications (UserId, Type, Title, Message) VALUES (%s, 'team_deleted', %s, %s)",
                            (user_id, f'Team Deleted: {team_name}', notification_message))

        cur.execute("DELETE FROM MeetingInvitations WHERE MeetingId IN (SELECT TeamMeetingId FROM TeamMeeting WHERE TeamId = %s)", (team_id,))
        cur.execute("DELETE FROM TeamMeeting WHERE TeamId = %s", (team_id,))
        cur.execute("DELETE FROM TeamMembers WHERE TeamId = %s", (team_id,))
        cur.execute("DELETE FROM Team WHERE TeamId = %s", (team_id,))

        conn.commit()
        return jsonify({'success': True, 'message': 'Team deleted successfully'}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error deleting team: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete team', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()

@app.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    """Delete a team meeting and notify members."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT tm.MeetingTitle, t.TeamName, mi.UserId
            FROM TeamMeeting tm
            JOIN Team t ON tm.TeamId = t.TeamId
            JOIN MeetingInvitations mi ON tm.TeamMeetingId = mi.MeetingId
            WHERE tm.TeamMeetingId = %s
            """, (meeting_id,)
        )
        results = cur.fetchall()
        if not results:
            cur.execute("DELETE FROM TeamMeeting WHERE TeamMeetingId = %s", (meeting_id,))
            if cur.rowcount == 0:
                return jsonify({'success': False, 'message': 'Meeting not found'}), 404
            conn.commit()
            return jsonify({'success': True, 'message': 'Meeting deleted successfully'}), 200

        meeting_title = results[0][0]
        team_name = results[0][1]
        member_ids = [row[2] for row in results]

        notification_message = f'The meeting "{meeting_title}" in team "{team_name}" has been canceled.'
        for user_id in member_ids:
            cur.execute("INSERT INTO Notifications (UserId, Type, Title, Message) VALUES (%s, 'meeting_canceled', %s, %s)",
                        (user_id, f'Meeting Canceled: {meeting_title}', notification_message))

        cur.execute("DELETE FROM MeetingInvitations WHERE MeetingId = %s", (meeting_id,))
        cur.execute("DELETE FROM Notifications WHERE RelatedId = %s AND Type = 'meeting_invitation'", (meeting_id,))
        cur.execute("DELETE FROM TeamMeeting WHERE TeamMeetingId = %s", (meeting_id,))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Meeting deleted successfully'}), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error deleting meeting: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete meeting', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_id_param = request.args.get('userId')
    if not user_id_param:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        internal_user_id = _get_internal_user_id(cur, user_id_param)
        if internal_user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        cur.execute(
            """
            SELECT n.NotificationId, n.Type, n.Title, n.Message, n.RelatedId, n.IsRead, n.CreatedAt,
                   mi.Status as InvitationStatus,
                   tm.InvitationType
            FROM Notifications n
            LEFT JOIN MeetingInvitations mi ON n.RelatedId = mi.MeetingId AND n.Type = 'meeting_invitation' AND mi.UserId = %s
            LEFT JOIN TeamMeeting tm ON mi.MeetingId = tm.TeamMeetingId
            WHERE n.UserId = %s
            ORDER BY n.CreatedAt DESC
            """,
            (internal_user_id, internal_user_id)
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
                'invitationstatus': row[7],
                'invitationtype': row[8]
            }
            notifications.append(notification)
            if not row[5]:
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
        if conn: conn.close()

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
    response = data.get('response')
    user_id = data.get('userId')
    
    if response not in ['accepted', 'declined']:
        return jsonify({'success': False, 'message': 'Invalid response. Must be "accepted" or "declined"'}), 400
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
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
        
        cur.execute(
            """
            UPDATE Notifications 
            SET IsRead = TRUE
            WHERE RelatedId = %s AND Type = 'meeting_invitation' AND UserId = %s
            """,
            (meeting_id, user_id)
        )
        
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
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        internal_user_id = _get_internal_user_id(cur, user_id)
        if internal_user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        cur.execute(
            """
            SELECT UserId, UserName, UserEmail, UserDOB, UserBio, 
                   UserProfilePicture, GoogleId
            FROM Users
            WHERE UserId = %s
            """,
            (internal_user_id,)
        )
        
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        user_data = {
            'userid': user[0],
            'username': user[1],
            'useremail': user[2],
            'userdob': user[3].isoformat() if user[3] else None,
            'userbio': user[4],
            'userprofilepicture': user[5],
            'isgoogleuser': user[6] is not None
        }
        
        return jsonify({'success': True, 'user': user_data}), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch user', 'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    
    username = data.get('username')
    bio = data.get('bio')
    dob = data.get('dob')
    profile_picture = data.get('profilePicture')

    if profile_picture is None:
        update_picture = True
        picture_value = None
    elif profile_picture:
        update_picture = True
        picture_value = profile_picture
    else:
        update_picture = False
        picture_value = None

    if not username:
        return jsonify({'success': False, 'message': 'Username is required'}), 400
    
    parsed_dob = None
    if dob:
        try:
            parsed_dob = datetime.strptime(dob, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            parsed_dob = None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if update_picture:
            cur.execute(
                """
                UPDATE Users 
                SET UserName = %s, UserBio = %s, UserDOB = %s, UserProfilePicture = %s
                WHERE UserId = %s
                """,
                (username, bio, parsed_dob, picture_value, user_id)
            )
        else:
             cur.execute(
                """
                UPDATE Users 
                SET UserName = %s, UserBio = %s, UserDOB = %s
                WHERE UserId = %s
                """,
                (username, bio, parsed_dob, user_id)
            )

        if cur.rowcount == 0:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        cur.execute(
            """
            SELECT UserId, UserName, UserEmail, UserDOB, UserBio, 
                   UserProfilePicture, GoogleId
            FROM Users
            WHERE UserId = %s
            """,
            (user_id,)
        )
        
        user = cur.fetchone()
        
        user_data = None
        if user:
            user_data = {
                'userid': user[0],
                'username': user[1],
                'useremail': user[2],
                'userdob': user[3].isoformat() if user[3] else None,
                'userbio': user[4],
                'userprofilepicture': user[5],
                'isgoogleuser': user[6] is not None
            }
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user_data
        }), 200
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update profile', 'error': str(e)}), 500
    
    finally:
        if conn: conn.close()

@app.route('/api/users/<int:user_id>/password', methods=['PUT'])
def change_password(user_id):
    """Change user password"""
    data = request.get_json()
    
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'Current password and new password are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT UserPassword, GoogleId FROM Users WHERE UserId = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        if user[1]:  # GoogleId exists
            return jsonify({'success': False, 'message': 'Cannot change password for Google users'}), 400
        
        if not user[0] or not check_password_hash(user[0], current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
        
        hashed_new_password = generate_password_hash(new_password)
        
        cur.execute(
            "UPDATE Users SET UserPassword = %s WHERE UserId = %s",
            (hashed_new_password, user_id)
        )
        
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

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user account and notify team creators."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT UserName FROM Users WHERE UserId = %s", (user_id,))
        user_to_delete = cur.fetchone()
        
        if not user_to_delete:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        deleted_user_name = user_to_delete[0]

        cur.execute(
            """
            SELECT DISTINCT t.CreatedByUserId
            FROM Team t
            JOIN TeamMembers tm ON t.TeamId = tm.TeamId
            WHERE tm.UserId = %s
            """, (user_id,)
        )
        creator_ids = [row[0] for row in cur.fetchall()]

        notification_title = "Team Member Left"
        notification_message = f"User '{deleted_user_name}' has deleted their account and has been removed from your team(s)."
        
        for creator_id in creator_ids:
            if creator_id != user_id:
                cur.execute(
                    "INSERT INTO Notifications (UserId, Type, Title, Message) VALUES (%s, 'member_left_team', %s, %s)",
                    (creator_id, notification_title, notification_message)
                )
        
        cur.execute(
            """
            DELETE FROM MeetingInvitations 
            WHERE UserId = %s
            """,
            (user_id,)
        )
        
        cur.execute("DELETE FROM Notifications WHERE UserId = %s", (user_id,))
        
        cur.execute(
            """
            DELETE FROM Timeline 
            WHERE GoalId IN (SELECT GoalId FROM Goal WHERE UserId = %s)
            """,
            (user_id,)
        )
        
        cur.execute(
            """
            DELETE FROM TeamMeeting 
            WHERE TeamId IN (SELECT TeamId FROM Team WHERE CreatedByUserId = %s)
            """,
            (user_id,)
        )
        
        cur.execute("DELETE FROM TeamMembers WHERE UserId = %s", (user_id,))
        
        cur.execute("DELETE FROM Team WHERE CreatedByUserId = %s", (user_id,))
        
        cur.execute("DELETE FROM Goal WHERE UserId = %s", (user_id,))
        
        cur.execute("DELETE FROM Activity WHERE UserId = %s", (user_id,))
        
        cur.execute("DELETE FROM Users WHERE UserId = %s", (user_id,))
        
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
        
        user_data = {
            'userid': user[0],
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
    app.run(debug=False)
