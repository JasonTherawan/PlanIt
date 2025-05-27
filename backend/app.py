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
    
    # Validate required fields
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email, and password are required'}), 400
    
    # Validate email format (basic check)
    if '@' not in email or '.' not in email:
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400
    
    # Validate password length
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
    
    # Hash the password for security
    hashed_password = generate_password_hash(password)
    
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
        
        # Insert new user
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
            'userId': user_id
        }), 201
        
    except psycopg2.errors.UniqueViolation:
        # Handle duplicate email (though we already check above)
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': 'Email already registered'}), 409
    
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
    
    # Validate required fields
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get user by email
        cur.execute("SELECT UserId, UserName, UserEmail, UserPassword FROM Users WHERE UserEmail = %s", (email,))
        user = cur.fetchone()
        
        # Check if user exists and password is correct
        if user and check_password_hash(user[3], password):
            # Return user info (excluding password)
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2]
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
    
    # Connect to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new activity
        cur.execute(
            """
            INSERT INTO Activity (ActivityTitle, ActivityDescription, ActivityCategory, 
                                 ActivityUrgency, ActivityDate, ActivityStartTime, 
                                 ActivityEndTime, UserId)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING ActivityId
            """,
            (title, description, category, urgency, date, start_time, end_time, user_id)
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
                        user_id = user_result[0]
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
                    'createdbyuserid': row[5],
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

if __name__ == '__main__':
    app.run(debug=True)
