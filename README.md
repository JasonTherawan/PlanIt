<div align="center">

# PlanIt

<img src="public/planitLogo.png" alt="PlanIt Logo" width="200">

**An Intelligent Planning & Productivity Platform**

</div>

PlanIt is a full-stack productivity and scheduling web application designed for both individuals and teams. It unifies calendar management, to-do lists, long-term goal tracking, and team collaboration into a single, intelligent platform. Key features include an integrated Gmail client and an AI-powered meeting scheduler that analyzes team members' schedules to find optimal times.

**Live Deployment**: This application is deployed and accessible on Vercel via **[planitplanner.vercel.app](https://planitplanner.vercel.app/)**.

-----

## 🔧 Tech Stack

### 🖥️ Frontend

  - **Framework**: React.js (with Vite)
  - **Routing**: React Router
  - **Styling**: Tailwind CSS
  - **Icons**: Lucide React

### 🧠 Backend

  - **Framework**: Python (Flask)
  - **WSGI Server**: Gunicorn
  - **Database ORM**: Psycopg2

### 🗃️ Database

  - **PostgreSQL**

### ✨ AI & Integrations

  - **Google Gemini**: For parsing emails and smart scheduling.
  - **Google Identity Services & Gmail API**: For authentication and email integration.

-----

## ✨ Features

### 📌 Core Planner & Calendar

  - **Unified Calendar**: A full monthly calendar view combined with a detailed hourly time-block grid for each day.
  - **Dynamic Sidebar**: Displays a mini-calendar and a filterable list of "Upcoming" and "Past" events.
  - **Activities Management**: Create, edit, and delete personal activities with titles, descriptions, categories, and urgency levels (Low, Medium, High, Urgent).
  - **Goal Tracking**: Set long-term goals with multiple, distinct timelines. Track progress with statuses like "Not Started", "In Progress", and "Completed".
  - **Smart Search**: Instantly search across all activities, goals, and meetings from the main header.
  - **Overlap Detection**: The app warns the user when creating or editing an activity or goal that conflicts with existing events on their calendar.

### 📧 Gmail Integration

  - **Built-in Gmail Client**: Users authenticated with Google can open a full-featured Gmail inbox directly within the app.
  - **Email Actions**: Read, reply to, forward, and delete emails from within the PlanIt interface.
  - **AI Email-to-Task**: A "To Planner" button uses the Gemini API to intelligently parse event details (title, date, time) from an email's content and create a new activity for the user.

### 👥 Team Collaboration

  - **Team Management**: Create teams, invite members via email, and set team-wide working hours.
  - **AI-Powered Meeting Scheduler**: When creating a meeting, the app can use the Gemini API to analyze the schedules (activities, goals, and other meetings) of all invited members to suggest optimal, conflict-free meeting times.
  - **Meeting Invitations**: Send "Mandatory" or "Request" based invitations. Non-mandatory invitations can be accepted or declined by members.
  - **Notifications**: A real-time notification system alerts users to new meeting invitations, cancellations, and other team events.

### 👤 User & Authentication

  - **Standard & Google OAuth**: Secure user registration and login for both standard email/password accounts and Google accounts.
  - **User Profiles**: Users can edit their profile information, including username, bio, and profile picture.
  - **Protected Routes**: The main application is protected and requires users to be logged in.

-----

## 🚀 Getting Started

### Prerequisites

  - Node.js
  - Python 3 & pip
  - PostgreSQL

### Local Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/JasonTherawan/Planit.git
    cd Planit
    ```

2.  **Setup Backend:**

    ```bash
    cd api
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  **Setup Frontend:**

    ```bash
    npm install
    ```

4.  **Environment Variables:**

      - Create a `.env` file in the root directory.
      - Add your local database credentials, a secret key, and your Google/Gemini API keys:
        ```
        DB_USER=your_postgres_user
        DB_PASS=your_postgres_password
        SECRET_KEY=your_flask_secret_key
        VITE_GOOGLE_CLIENT_ID=your_google_client_id
        VITE_GEMINI_API_KEY=your_gemini_api_key
        ```

5.  **Run the Application:**

      - In one terminal, run the backend:
        ```bash
        cd api
        python index.py
        ```
      - In a second terminal, run the frontend:
        ```bash
        npm run dev
        ```

-----

## 🏗️ Project Structure

This project is a monorepo containing both the frontend and backend code.

  - `/api`: Contains the Flask server (`index.py`).
  - `/frontend`: Contains all React components, views, and services.
  - **Root**: Contains shared configuration files like `package.json`, `vite.config.js`, and `requirements.txt`.

-----

## 📧 Contact Developer

For questions, support, or feedback, please contact the owner of this repository or via email [therawan.jason@gmail.com](mailto:therawan.jason@gmail.com).

-----

## 📜 License

This project is licensed under the MIT License - see the `LICENSE.txt` file for details.